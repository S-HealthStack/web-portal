import React, { useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import _sumBy from 'lodash/sumBy';
import _slice from 'lodash/slice';
import styled from 'styled-components';

import { typography, px, colors, theme } from 'src/styles';
import Tooltip from 'src/common/components/Tooltip';
import { XAxis, YAxis, Area } from './common-components';
import { NoResponsesLabel, NO_RESPONSES_LABEL } from './common-helpers';

const TooltipContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const TooltipRowContent = styled.div`
  display: flex;
`;

const TooltipNameBlock = styled.div`
  display: flex;
  margin-right: ${px(8)};
  ${typography.labelSemibold};
  color: ${colors.surface};
`;

const TooltipDataBlock = styled.div`
  display: flex;
  flex-direction: column;
  ${typography.labelRegular};
  color: ${colors.surface};
`;

interface DataItem {
  percentage: number;
  scaleValue: number;
}

export type BarChartProps = {
  data: DataItem[];
  width: number;
  height: number;
  color?: string;
  minScale?: number;
  maxScale?: number;
  className?: string;
};

const DEFAULT_COLOR = '#00B0D7';

const TOOLTIP_MARGIN_TOP = 37;

const StackedBarChart = ({
  width,
  height,
  data,
  color = DEFAULT_COLOR,
  minScale = 1,
  maxScale = 10,
  className,
}: BarChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const [currentHoveredArea, setCurrentHoveredArea] = useState<number>(-1);

  const x = useMemo(
    () => d3.map(data, (d, index) => _sumBy(_slice(data, 0, index + 1), 'percentage')),
    [data]
  );
  const y = useMemo(() => [0, 1], []);

  const xRange = useMemo(() => [0, width], [width]);
  const yRange = useMemo(() => [height, 0], [height]);

  const xScale = useMemo(() => d3.scaleLinear([0, 100], xRange).nice(), [xRange]);
  const yScale = useMemo(() => d3.scaleLinear(y, yRange).nice(), [y, yRange]);

  const getAreaKeyByIndex = (index: number) => `area-${index}`;

  const getAreaLabelKeyByIndex = (index: number) => `area-label-${index}`;

  const tooltipPosition = useMemo(() => {
    if (!svgRef.current || currentHoveredArea < 0) {
      return 'l';
    }

    const svgRect = svgRef.current.getBoundingClientRect();
    const areaId = getAreaKeyByIndex(currentHoveredArea);
    const areaNode = d3.select(svgRef.current).select(`#${areaId}`).node() as HTMLElement;
    const areaRect = areaNode?.getBoundingClientRect();

    return (svgRect && (areaRect.left + 200 > svgRect.left + svgRect.width ? 'l' : 'r')) || 'l';
  }, [currentHoveredArea]);

  const tooltipContent = useMemo(() => {
    const areaData = data[currentHoveredArea];

    if (!areaData) {
      return undefined;
    }

    return (
      <TooltipContent>
        <TooltipRowContent>
          <TooltipNameBlock>SCALE VALUE:</TooltipNameBlock>
          <TooltipDataBlock>{areaData.scaleValue}</TooltipDataBlock>
        </TooltipRowContent>
        <TooltipRowContent>
          <TooltipNameBlock>PERCENTAGE:</TooltipNameBlock>
          <TooltipDataBlock>{`${Math.round(areaData.percentage)}%`}</TooltipDataBlock>
        </TooltipRowContent>
      </TooltipContent>
    );
  }, [currentHoveredArea, data]);

  const tooltipContainer = useMemo(
    () =>
      d3
        .select(svgRef.current)
        .select(`#${getAreaLabelKeyByIndex(currentHoveredArea)}`)
        .node() as HTMLElement,
    [currentHoveredArea]
  );

  const onAreaMouseEnter = useCallback(
    (_: React.MouseEvent<SVGPathElement, MouseEvent>, index: number) => {
      setCurrentHoveredArea(index);
    },
    []
  );

  const onAreaMouseLeave = useCallback(() => {
    setCurrentHoveredArea(-1);
  }, []);

  const isEmptyState = useMemo(() => data.every((d) => d.percentage === 0), [data]);

  return (
    <div className={className}>
      <svg ref={svgRef} width={width} height={height}>
        <XAxis key="x-axis" xScale={xScale} removeDomain yOffset={height} ticks={0} tickSize={0} />
        <YAxis key="y-axis" yScale={yScale} xOffset={0} removeDomain ticks={0} tickSize={0} />
        {!isEmptyState &&
          data.map((d, index) => (
            <Area
              key={getAreaKeyByIndex(index)}
              id={getAreaKeyByIndex(index)}
              data={[
                { x: x[index - 1] || 0, y0: 0, y1: 1 },
                { x: x[index], y0: 0, y1: 1 },
              ]}
              xScale={xScale}
              yScale={yScale}
              color={color}
              fillOpacity={(1 / (maxScale - minScale + 1)) * (index + 1)}
              visible
              onMouseEnter={(event) => onAreaMouseEnter(event, index)}
              onMouseLeave={onAreaMouseLeave}
            />
          ))}
        {!isEmptyState &&
          data.map((d, index) => (
            <rect
              key={getAreaLabelKeyByIndex(index)}
              id={getAreaLabelKeyByIndex(index)}
              x={`${
                xScale(x[index - 1] || 0) + (xScale(x[index]) - xScale(x[index - 1] || 0)) / 2
              }px`}
              y={`${TOOLTIP_MARGIN_TOP}px`}
              fillOpacity={0}
            />
          ))}
        {isEmptyState && (
          <rect x="0px" y="0px" width={width} height={height} fill={theme.colors.background} />
        )}
        {isEmptyState && (
          <NoResponsesLabel
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            width={width}
            height={height}
          >
            {NO_RESPONSES_LABEL}
          </NoResponsesLabel>
        )}
      </svg>
      <Tooltip
        static
        content={tooltipContent}
        container={tooltipContainer}
        show={!!tooltipContent && !!tooltipContainer}
        position={tooltipPosition}
        arrow
        centered
      />
    </div>
  );
};

export default styled(StackedBarChart)``;
