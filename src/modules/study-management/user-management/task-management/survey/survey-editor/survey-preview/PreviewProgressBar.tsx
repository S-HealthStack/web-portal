import React, { FC } from 'react';

import styled from 'styled-components';

import { animation, colors, px, typography } from 'src/styles';

const ProgressBarContainer = styled.div`
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const ProgressBarBackground = styled.div`
  width: 100%;
  border-radius: ${px(12)};
  background-color: ${colors.primaryLight};
  height: ${px(12)};
  position: relative;
`;

const ProgressBar = styled.div<{ $fillPercent: number }>`
  width: ${({ $fillPercent }) => `calc(100% * ${$fillPercent})`};
  position: relative;
  height: ${px(12)};
  border-radius: ${px(12)};
  background-color: ${colors.primary};
  transition: width 300ms ${animation.defaultTiming};
`;

const ProgressBarText = styled.div`
  ${typography.bodySmallRegular};
  line-height: ${px(18)};
  color: ${colors.textPrimary};
  margin-top: ${px(8)};
  margin-bottom: ${px(6)};
`;

interface PreviewProgressBarProps {
  maxIndex: number;
  activeIndex: number;
}

const PreviewProgressBar: FC<PreviewProgressBarProps> = ({
  maxIndex,
  activeIndex,
}: PreviewProgressBarProps) => (
  <ProgressBarContainer>
    <ProgressBarBackground>
      <ProgressBar $fillPercent={activeIndex / maxIndex} />
    </ProgressBarBackground>
    <ProgressBarText>{`${activeIndex} out of ${maxIndex}`}</ProgressBarText>
  </ProgressBarContainer>
);

export default PreviewProgressBar;
