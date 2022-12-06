import React from 'react';
import { Provider } from 'react-redux';
import {
  getAverageParticipantHeartRateMock,
  useAvgRestingHrWithAgeSlice,
} from 'src/modules/overview/avgRestingHrWithAge.slice';
import { act, renderHook, waitFor } from '@testing-library/react';
import { store } from 'src/modules/store/store';

describe('getAverageParticipantHeartRateMock', () => {
  it('should get mocked data', async () => {
    const { data } = await getAverageParticipantHeartRateMock({
      startTime: '2017-05-15',
      endTime: '2017-05-16',
      projectId: 'project-id',
    });

    expect({ data }).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          user_id: expect.any(String),
          gender: expect.any(String),
          age: expect.any(String),
          avg_bpm: expect.any(String),
          last_synced: expect.any(String),
        }),
      ]),
    });
  });
});

const setUpHook = (args: { studyId: string }) =>
  renderHook(
    (etchArgs: { studyId: string }) =>
      useAvgRestingHrWithAgeSlice({
        fetchArgs: etchArgs || args,
      }),
    {
      wrapper: ({ children }: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{children}</Provider>
      ),
    }
  );

const unSetHook = (hook: ReturnType<typeof setUpHook>) => {
  hook.result.current.reset();
  hook.unmount();
};

describe('useAvgRestingHrWithAgeSlice', () => {
  let hook: ReturnType<typeof setUpHook>;

  afterEach(() => {
    act(() => unSetHook(hook));
  });

  it('should fetch data from API', async () => {
    hook = setUpHook({
      studyId: 'test-study-id',
    });

    expect(hook.result.current).toMatchObject({
      isLoading: true,
    });

    await waitFor(() => expect(hook.result.current.isLoading).toBeFalsy());

    expect(hook.result.current).toMatchObject({
      isLoading: false,
      data: {
        trendLines: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            age: expect.any(Number),
            value: expect.any(Number),
            color: expect.any(String),
          }),
        ]),
        values: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            age: expect.any(Number),
            value: expect.any(Number),
            lastSync: expect.any(Number),
            color: expect.any(String),
          }),
        ]),
      },
    });
  });
});