import _range from 'lodash/range';
import _groupBy from 'lodash/groupBy';
import _min from 'lodash/min';
import _max from 'lodash/max';
import _flatten from 'lodash/flatten';
import { DateTime } from 'luxon';

import API from 'src/modules/api';
import Random from 'src/common/Random';
import createDataSlice from 'src/modules/store/createDataSlice';
import { convertSqlUtcDateStringToTimestamp } from 'src/common/utils/datetime';
import { getGenderColor } from './gender';

export const getAverageParticipantHeartRateMock: typeof API.getAverageParticipantHeartRate = ({
  startTime,
  endTime,
}) => {
  const r = new Random(2);

  const startTs = DateTime.fromISO(startTime).valueOf();
  const endTs = DateTime.fromISO(endTime).valueOf();

  return API.mock.response({
    averageHealthData: _range(200).map((idx) => {
      const gender = r.num() < 0.5 ? 'male' : 'female';
      return {
        userId: `user_${idx}`,
        profiles: [
          {
            key: 'gender',
            value: gender,
          },
          {
            key: 'age',
            value: String(r.gaussInt({ min: 21, max: 99, mean: 45, standardDeviation: 20 })),
          },
        ],
        averageHR: r.gaussNum({
          min: 51,
          max: 89,
          mean: gender === 'male' ? 73 : 75,
          standardDeviation: 6,
        }),
        lastSyncTime: DateTime.fromMillis(r.int(startTs, endTs)).toSQL(),
      };
    }),
  });
};

API.mock.provideEndpoints({
  getAverageParticipantHeartRate: getAverageParticipantHeartRateMock,
});

function calculateTrendLine<T extends { x: number; y: number }>(values: T[]) {
  const mapSum = (fn: (v: T) => number) => values.reduce((sum, v) => sum + fn(v), 0);

  const sumX = mapSum((v) => v.x);
  const sumY = mapSum((v) => v.y);
  const sumXY = mapSum((v) => v.x * v.y);
  const sumX2 = mapSum((v) => v.x * v.x);

  const n = values.length;
  const a = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const b = (sumY - a * sumX) / n;

  return {
    a,
    b,
    getYforX: (x: number) => a * x + b,
  };
}

const avgRestingHrWithAgeSlice = createDataSlice({
  name: 'overview/avgRestingHrWithAge',
  fetchData: async ({ studyId }: { studyId: string }) => {
    const startTime = DateTime.now().minus({ days: 1 }).startOf('day');
    const endTime = startTime.plus({ days: 1 });

    const {
      data: { averageHealthData: data },
    } = await API.getAverageParticipantHeartRate({
      projectId: studyId,
      startTime: startTime.toISO(),
      endTime: endTime.toISO(),
    });

    const values = (data || [])
      .filter((d) => Number.isFinite(d.averageHR) && d.lastSyncTime)
      .map((d) => {
        const gender = d.profiles?.find((p) => p.key === 'gender')?.value || '';
        return {
          name: gender,
          age: Number(d.profiles?.find((p) => p.key === 'age')?.value || '0'),
          value: d.averageHR || 0,
          color: getGenderColor(gender),
          lastSync: convertSqlUtcDateStringToTimestamp(d.lastSyncTime) as number,
        };
      });

    const groupedByName = _groupBy(values, (v) => v.name);
    const trendLinesPerGroup = Object.values(groupedByName).map((gv) => {
      const tl = calculateTrendLine(gv.map((v) => ({ x: v.age, y: v.value })));

      const ages = gv.map((v) => v.age);
      const minAge = _min(ages) || 0;
      const maxAge = _max(ages) || 0;

      const { name, color } = gv[0];

      return [
        {
          name,
          age: minAge,
          value: tl.getYforX(minAge),
          color,
        },
        {
          name,
          age: maxAge,
          value: tl.getYforX(maxAge),
          color,
        },
      ];
    });

    return { values, trendLines: _flatten(trendLinesPerGroup) };
  },
});

export const useAvgRestingHrWithAgeSlice = avgRestingHrWithAgeSlice.hook;

export default {
  [avgRestingHrWithAgeSlice.name]: avgRestingHrWithAgeSlice.reducer,
};
