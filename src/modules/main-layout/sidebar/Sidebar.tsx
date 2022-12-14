import React, { FC, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import useWindowSize from 'react-use/lib/useWindowSize';

import styled, { css, DefaultTheme } from 'styled-components';

import { Path, sectionPathSelector } from 'src/modules/navigation/store';
import { useAppDispatch, useAppSelector } from 'src/modules/store';
import { userNameSelector } from 'src/modules/auth/auth.slice';
import { signout } from 'src/modules/auth/auth.slice.signout';
import { selectedStudySelector } from 'src/modules/studies/studies.slice';
import {
  DESKTOP_WIDTH_BREAKPOINT,
  LAPTOP_WIDTH_BREAKPOINT,
} from 'src/common/components/SimpleGrid';
import Link from 'src/common/components/Link';
import StudyAvatar from 'src/common/components/StudyAvatar';
import Tooltip from 'src/common/components/Tooltip/Tooltip';
import Button from 'src/common/components/Button';
import Ripple, { useRipple } from 'src/common/components/Ripple';
import OverviewIcon from 'src/assets/icons/overview.svg';
import TrialManagementIcon from 'src/assets/icons/trial_management.svg';
import DataCollectionIcon from 'src/assets/icons/data_collection.svg';
import StudySettingsIcon from 'src/assets/icons/study_settings.svg';
import SignOutIcon from 'src/assets/icons/sign_out.svg';
import UserAvatarIcon from 'src/assets/icons/user_avatar.svg';
import ResizeIcon from 'src/assets/icons/resize.svg';
import { px, typography, colors, animation, boxShadow } from 'src/styles';
import { getRoleFunction, getRoleLabel } from 'src/modules/auth/userRole';
import { userRoleSelector } from 'src/modules/auth/auth.slice.userRoleSelector';

import {
  getSidebarWidth,
  isSidebarMinimized,
  SIDEBAR_MINIMIZED_WIDTH,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_SMALL_SCREEN,
} from './helper';
import {
  isSidebarCollapsedSelector,
  isSidebarForceCollapsedSelector,
  toggleSidebarCollapsed,
} from './sidebar.slice';

type Props = {
  onStudyClick: () => void;
};

type Position = {
  posX: number;
  posY: number;
};

type DesktopType = 'desktop' | 'smallDesktop' | 'laptop';

type Minimizable = { minimized?: boolean };

interface ContainerProps {
  $barWidth: number;
  desktopType: DesktopType;
  isResizeVisible: boolean;
  minimized: boolean;
}

interface MenuItemProps extends Minimizable, React.HTMLAttributes<HTMLDivElement> {
  $barWidth: number;
  desktopType: DesktopType;
  selected?: boolean;
  disabled?: boolean;
}

const INITIAL_POS: Position = { posX: -1000, posY: -1000 };
const BUTTON_WIDTH = 24;
const INITIAL_RESIZE_BTN_POS = `${px(-1000)}`;

const menuItemsRegistry = {
  overview: {
    title: 'Overview',
    icon: <OverviewIcon />,
    section: Path.Overview,
  },
  studyManagement: {
    title: 'Study Management',
    icon: <TrialManagementIcon />,
    section: Path.TrialManagement,
  },
  dataInsights: {
    title: 'Data Insights',
    icon: <DataCollectionIcon />,
    section: Path.DataCollection,
  },
  studySettings: {
    title: 'Study Settings',
    icon: <StudySettingsIcon />,
    section: Path.StudySettings,
  },
};

const hideDisplayIfMinimized = (minimized = false) =>
  css`
    display: ${minimized ? 'none' : 'block'};
  `;

const getBasePadding = (desktopType: DesktopType) =>
  css`
    padding: ${desktopType === 'desktop' ? px(24) : px(16)};
  `;

const getMenuItemColorsStyles = (theme: DefaultTheme, selected = false, disabled = false) => {
  const color =
    (disabled && theme.colors.disabled) ||
    (selected ? theme.colors.primary : theme.colors.textSecondaryGray);
  return css`
    color: ${color} !important;
    svg {
      fill: ${color};
    }
  `;
};

const getMenuItemTypography = ({ selected, $barWidth, disabled = false }: MenuItemProps) => {
  if ($barWidth === SIDEBAR_WIDTH) {
    return (
      (disabled && typography.bodySmallRegular) ||
      (selected ? typography.bodySmallSemibold : typography.bodySmallRegular)
    );
  }
  return (
    (disabled && typography.bodyXSmallRegular) ||
    (selected ? typography.bodyXSmallSemibold : typography.bodyXSmallRegular)
  );
};

const Container = styled.div.attrs<ContainerProps>(({ $barWidth, desktopType }) => ({
  style: {
    width: px($barWidth),
    paddingTop: desktopType !== 'laptop' ? px(26) : px(8),
  },
}))<ContainerProps>`
  height: 100%;
  background-color: ${colors.surface};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  ${typography.bodySmallRegular};
  color: ${colors.textSecondaryGray};
  position: relative;
  border-right: ${px(1)} solid ${colors.background};
  transition: border 150ms ${animation.defaultTiming};
  padding-bottom: ${({ desktopType, minimized }) =>
    (desktopType === 'desktop' && (minimized ? px(30) : px(16))) ||
    (desktopType === 'smallDesktop' && px(14)) ||
    (desktopType === 'laptop' && px(14))};
  ${({ isResizeVisible, theme, desktopType }) =>
    isResizeVisible &&
    desktopType !== 'laptop' &&
    css`
      border-color: ${theme.colors.primary};
    `};
`;

const FadeOutContainer = styled.div<{
  $visible?: boolean;
  $barWidth: number;
  desktopType: DesktopType;
}>`
  transition: opacity 0.3s ${animation.defaultTiming};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
`;

const StyledAvatar = styled(StudyAvatar)<Minimizable>`
  margin-right: ${({ minimized }) => !minimized && px(16)};
`;

const ResizeButton = styled(Button)`
  position: absolute !important;
  z-index: 1100;
  background-color: ${colors.primary05};
  top: ${px(-1000)};
  left: ${px(-1000)};
`;

const StudyPanel = styled(FadeOutContainer)<Minimizable>`
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: ${({ minimized }) => minimized && 'column'};
  text-align: ${({ minimized }) => minimized && 'center'};
  ${({ desktopType }) => getBasePadding(desktopType)};
  margin-bottom: ${({ desktopType }) =>
    (desktopType === 'desktop' && px(36)) ||
    (desktopType === 'smallDesktop' && px(40)) ||
    (desktopType === 'laptop' && px(20))};
  &:hover {
    cursor: pointer;
    ${StyledAvatar} {
      box-shadow: ${boxShadow.avatar};
    }
  }
`;

const StudyName = styled.div<Minimizable & { $barWidth: number }>`
  ${({ $barWidth }) =>
    $barWidth === SIDEBAR_WIDTH ? typography.headingXMedium : typography.bodySmallSemibold};
  margin-top: ${({ minimized }) => !minimized && px(2)};
  word-break: break-word;
  ${({ minimized }) => hideDisplayIfMinimized(minimized)};
  color: ${colors.textPrimaryDark};
`;

const UserPanel = styled(FadeOutContainer)<Minimizable & { disabled?: boolean }>`
  display: flex;
  align-items: ${({ minimized }) => (minimized ? 'center' : 'flex-start')};
  padding-left: ${({ $barWidth }) =>
    ($barWidth === SIDEBAR_WIDTH && px(24)) ||
    ($barWidth === SIDEBAR_WIDTH_SMALL_SCREEN && px(16)) ||
    ($barWidth === SIDEBAR_MINIMIZED_WIDTH && px(0))};
  justify-content: ${({ minimized }) => minimized && 'center'};
  position: relative;
  overflow: hidden;
  height: ${({ $barWidth }) => ($barWidth === SIDEBAR_WIDTH ? px(75) : px(63))};
  flex-direction: column;
  margin-top: ${({ desktopType }) => (desktopType === 'desktop' ? px(8) : px(4))};
  ${({ $barWidth }) =>
    $barWidth === SIDEBAR_WIDTH ? typography.bodyMediumRegular : typography.bodyXSmallRegular};
  color: ${({ disabled }) => (disabled ? colors.textDisabled : colors.onSurface)} !important;
  svg {
    fill: ${({ disabled }) => (disabled ? colors.disabled : colors.textSecondaryGray)};
  }
`;

const Username = styled.div<Minimizable & { $barWidth: number }>`
  ${({ $barWidth }) =>
    $barWidth === SIDEBAR_WIDTH ? typography.headingXMedium : typography.bodySmallSemibold};
  margin-bottom: ${px(8)};
  ${({ minimized }) => hideDisplayIfMinimized(minimized)};
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

const Menu = styled.div`
  height: fit-content;
  overflow: auto;
  position: relative;
`;

const MenuIcon = styled.div<{ $barWidth: number }>`
  position: relative;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  ${({ $barWidth }) => css`
    margin-right: ${($barWidth === SIDEBAR_WIDTH && px(16)) ||
    ($barWidth === SIDEBAR_WIDTH_SMALL_SCREEN && px(8)) ||
    ($barWidth === SIDEBAR_MINIMIZED_WIDTH && px(0))};
  `};
  }
`;

const Title = styled.p<Minimizable & { selected?: boolean }>`
  position: relative;
  z-index: 1000;
  margin: 0;
  ${({ minimized }) => hideDisplayIfMinimized(minimized)}
`;

const BaseItemContainer = styled.div<Omit<MenuItemProps, 'desktopType' | '$barWidth'>>`
  display: flex;
  align-items: center;
  justify-content: ${({ minimized }) => minimized && 'center'};
  flex-direction: ${({ minimized }) => minimized && 'column'};
  position: relative;
  overflow: hidden;
  text-align: ${({ minimized }) => minimized && 'center'};
  z-index: 0;
`;

interface BaseItemProps extends Minimizable, React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  selected?: boolean;
}

const BaseItem: FC<BaseItemProps> = ({
  children,
  selected,
  minimized,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  ...props
}) => {
  const { rippleProps, rippleTriggerProps, handleRippleOut, handleRippleIn } =
    useRipple<HTMLDivElement>({
      opacity: 1,
      color: 'primaryLightPressed',
    });

  const handleMouseDown = useCallback(
    (evt: React.MouseEvent<HTMLDivElement>) => {
      handleRippleIn(evt);
    },
    [handleRippleIn]
  );

  const handleMouseUp = useCallback(
    (evt: React.MouseEvent<HTMLDivElement>) => {
      if (typeof selected === 'undefined') {
        handleRippleOut(undefined, { force: true });
      }
      onMouseUp?.(evt);
    },
    [selected, handleRippleOut, onMouseUp]
  );

  const handleMouseLeave = useCallback(() => {
    handleRippleOut(undefined, { force: true });
  }, [handleRippleOut]);

  return (
    <BaseItemContainer
      {...props}
      ref={rippleTriggerProps.ref}
      minimized={minimized}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <Ripple {...rippleProps} />
    </BaseItemContainer>
  );
};

const MenuItem = styled(BaseItem)<MenuItemProps>`
  ${({ desktopType }) => getBasePadding(desktopType)};
  ${({ desktopType }) => css`
    height: ${desktopType === 'desktop' ? px(56) : px(40)};
    margin-bottom: ${desktopType !== 'desktop' && px(8)};
  `};
  ${({ selected, disabled, theme }) => getMenuItemColorsStyles(theme, selected, disabled)};
  &:hover {
    cursor: pointer;
    background-color: ${colors.primaryLight};
    ${({ theme }) => getMenuItemColorsStyles(theme, true)};
  }
  pointer-events: ${({ disabled }) => disabled && 'none'};
  ${({ selected, desktopType, $barWidth, disabled }) => {
    const pipeWidth = desktopType === 'desktop' ? 8 : 4;
    const leftByBarWidth = ($barWidth as number) - pipeWidth;
    return css`
      ::before {
        content: '';
        height: ${desktopType === 'desktop' ? px(48) : px(32)};
        width: ${px(pipeWidth)};
        border-radius: ${desktopType === 'desktop'
          ? `${px(4)} ${px(0)} ${px(0)} ${px(4)}`
          : `${px(2)} ${px(0)} ${px(0)} ${px(2)}`};
        position: absolute;
        left: ${px(leftByBarWidth)};
        background-color: ${colors.primary};
        color: ${colors.primary};
        z-index: 100;
        display: ${(disabled && 'none') || (selected ? 'block' : 'none')};
      }
    `;
  }}

  > ${Title} {
    ${getMenuItemTypography};
  }
`;

const PanelWrapper = styled.div`
  ${Menu} {
    opacity: 0;
    transition: opacity 0.3s ${animation.defaultTiming};
  }
  &:hover {
    ${Menu} {
      opacity: 1;
    }
  }
  margin-top: auto;
`;

const Sidebar: React.FC<Props> = ({ onStudyClick }) => {
  const sectionPath = useSelector(sectionPathSelector);
  const username = useAppSelector(userNameSelector);
  const userRole = useAppSelector(userRoleSelector);
  const selectedStudy = useAppSelector(selectedStudySelector);
  const { width: screenWidth } = useWindowSize();
  const [tooltipPos, setTooltipPos] = useState<Position>(INITIAL_POS);
  const [resizeBtnVisible, setResizeBtnVisible] = useState<boolean>(false);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const isUserResize = useAppSelector(isSidebarCollapsedSelector);
  const isUserResizeAllowed = !useAppSelector(isSidebarForceCollapsedSelector);
  const minimized = isSidebarMinimized(screenWidth, isUserResize);
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const resizeBtnRef = useRef<HTMLButtonElement>(null);

  const desktopType: DesktopType = useMemo(() => {
    let result = 'desktop';
    if (screenWidth >= LAPTOP_WIDTH_BREAKPOINT && screenWidth < DESKTOP_WIDTH_BREAKPOINT) {
      result = 'smallDesktop';
    } else if (screenWidth < LAPTOP_WIDTH_BREAKPOINT) {
      result = 'laptop';
    }
    return result as DesktopType;
  }, [screenWidth]);

  const hideResizeBtn = () => {
    if (resizeBtnRef.current) {
      resizeBtnRef.current.style.top = INITIAL_RESIZE_BTN_POS;
      resizeBtnRef.current.style.left = INITIAL_RESIZE_BTN_POS;
    }
    setResizeBtnVisible(false);
  };

  const handleSetResizeButtonPos = (e: React.MouseEvent<HTMLDivElement>) => {
    const { width } = e.currentTarget.getBoundingClientRect();
    if (e.clientX >= width - BUTTON_WIDTH / 2 && e.clientX <= width + BUTTON_WIDTH / 2) {
      if (resizeBtnRef.current) {
        resizeBtnRef.current.style.top = `${e.clientY - BUTTON_WIDTH / 2}px`;
        resizeBtnRef.current.style.left = `${width - BUTTON_WIDTH / 2}px`;
      }
      setResizeBtnVisible(true);
    } else {
      hideResizeBtn();
    }
  };

  const barWidth = useMemo(
    () => getSidebarWidth(screenWidth, isUserResize),
    [screenWidth, isUserResize]
  );

  const handleSignOut = () => {
    dispatch(signout());
  };

  const userRoleLabel = userRole ? getRoleLabel(userRole) : 'Unknown';

  const handleSetTooltipParams = (
    event: React.MouseEvent<HTMLElement | SVGSVGElement>,
    title: string
  ) => {
    const elementRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const tooltipPosY = elementRect.y + elementRect.height / 2;
    setTooltipPos({ posX: SIDEBAR_MINIMIZED_WIDTH, posY: tooltipPosY });
    setTooltipTitle(title);
  };

  const clearTooltipParams = () => {
    setTooltipTitle('');
    setTooltipPos(INITIAL_POS);
  };

  const toggleBarWidth = () => {
    hideResizeBtn();
    dispatch(toggleSidebarCollapsed());
  };

  const clearResizeBtnPos = () => {
    hideResizeBtn();
  };

  const handleStudyClick = () => {
    if (!selectedStudy) {
      return;
    }

    onStudyClick();
    setTooltipTitle('');
  };

  const menuItems = useMemo(() => {
    const mr = menuItemsRegistry;
    switch (userRole?.role && getRoleFunction(userRole.role)) {
      case 'study_operator':
        return [mr.overview, mr.studyManagement, mr.dataInsights, mr.studySettings];
      case 'principal_investigator':
        return [mr.overview, mr.dataInsights, mr.studyManagement, mr.studySettings];

      default:
        return [];
    }
  }, [userRole]);

  return (
    <Container
      $barWidth={barWidth}
      ref={ref}
      isResizeVisible={resizeBtnVisible}
      desktopType={desktopType}
      minimized={minimized}
      id="sidebar"
      onMouseLeave={clearResizeBtnPos}
      onMouseMove={handleSetResizeButtonPos}
    >
      <Tooltip
        position="r"
        static
        show={minimized && !!selectedStudy && !!tooltipTitle}
        arrow
        content={tooltipTitle}
        key={tooltipTitle}
        point={[tooltipPos.posX, tooltipPos.posY]}
      />
      {desktopType !== 'laptop' && isUserResizeAllowed && (
        <ResizeButton
          fill="text"
          rate="icon"
          icon={<ResizeIcon />}
          onClick={toggleBarWidth}
          ref={resizeBtnRef}
        />
      )}
      <StudyPanel
        $visible
        $barWidth={barWidth}
        minimized={minimized}
        onClick={handleStudyClick}
        onMouseLeave={clearTooltipParams}
        desktopType={desktopType}
      >
        <StyledAvatar
          minimized={minimized}
          color={selectedStudy?.color || 'disabled'}
          onMouseEnter={(e) => handleSetTooltipParams(e, selectedStudy?.name || '')}
        />
        <StudyName $barWidth={barWidth} minimized={minimized}>
          {selectedStudy?.name || ''}
        </StudyName>
      </StudyPanel>
      <Menu onMouseLeave={clearTooltipParams}>
        {menuItems.map(({ title, icon, section }) => (
          <Link to={section} key={section}>
            <MenuItem
              minimized={minimized}
              selected={sectionPath === section}
              onMouseEnter={(e) => handleSetTooltipParams(e, title)}
              $barWidth={barWidth}
              desktopType={desktopType}
            >
              <MenuIcon $barWidth={barWidth}>{icon}</MenuIcon>
              <Title minimized={minimized} selected={sectionPath === section}>
                {title}
              </Title>
            </MenuItem>
          </Link>
        ))}
      </Menu>
      <PanelWrapper>
        <Menu onMouseLeave={clearTooltipParams}>
          <MenuItem
            onMouseEnter={(e) => handleSetTooltipParams(e, 'Sign out')}
            $barWidth={barWidth}
            minimized={minimized}
            onClick={handleSignOut}
            desktopType={desktopType}
          >
            <MenuIcon $barWidth={barWidth}>
              <SignOutIcon />
            </MenuIcon>
            <Title minimized={minimized}>Sign out</Title>
          </MenuItem>
        </Menu>
        <UserPanel
          $visible={!!userRoleLabel && !!username}
          minimized={minimized}
          $barWidth={barWidth}
          onMouseLeave={clearTooltipParams}
          desktopType={desktopType}
        >
          <Username minimized={minimized} $barWidth={barWidth}>
            {username}
          </Username>
          {minimized ? (
            <UserAvatarIcon onMouseEnter={(e) => handleSetTooltipParams(e, username || '')} />
          ) : (
            userRoleLabel
          )}
        </UserPanel>
      </PanelWrapper>
    </Container>
  );
};

export default Sidebar;
