import React from 'react';

export type Point = [number, number];

export type TooltipPosition =
  | 'tl'
  | 't'
  | 'tr'
  | 'lt'
  | 'l'
  | 'lb'
  | 'br'
  | 'b'
  | 'bl'
  | 'rb'
  | 'r'
  | 'rt'
  | 'abr'
  | 'abl'
  | 'atr'
  | 'atl';
export type TooltipTriggerType = 'hover' | 'click';

export type TooltipID = string;

export type TooltipHorizontalPaddings = 's' | 'm' | 'l';

export interface TooltipProps {
  id: TooltipID;
  show?: boolean;
  static?: boolean;
  styles?: Partial<React.CSSProperties>;
  content: React.ReactNode;
  container?: HTMLElement;
  point?: Point;
  position?: TooltipPosition;
  trigger?: TooltipTriggerType | TooltipTriggerType[];
  arrow?: boolean;
  delay?: number;
  horizontalPaddings?: TooltipHorizontalPaddings;
  centered?: boolean;
  onShow?: () => void;
  onHide?: () => void;
}

export interface TooltipControls {
  setPoint(point: Point): this;
  setContent(content: React.ReactNode): this;
  setContainer(container: HTMLElement): this;
  getContainer(): HTMLElement | undefined;
  getTooltip(): HTMLElement | undefined;
  setArrow(arrow: boolean): this;
  setPosition(position: TooltipPosition): this;
  show(): this;
  hide(): this;
  destroy(): void;
}

export interface ITooltipListContext {
  tooltipsMap: Record<TooltipID, TooltipProps>;
}

export type TooltipSubscribeListener = (tooltip: TooltipProps) => void;
export type TooltipDescribeListener = () => void;

export interface ITooltipItemContext {
  create(tooltipProps: Omit<TooltipProps, 'id'>): TooltipID;
  destroy(tooltipId: TooltipID): void;
  setProps(tooltipId: TooltipID, tooltipProps: Partial<Omit<TooltipProps, 'id'>>): void;
  getProps(tooltipId: TooltipID): TooltipProps | undefined;
  subscribe(tooltipId: TooltipID, cb: TooltipSubscribeListener): TooltipDescribeListener;
}
