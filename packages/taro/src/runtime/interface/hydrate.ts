import type { Shortcuts } from '../shortcuts';
import type { PageConfig } from './utils';

export interface MpInstance {
  [key: string]: unknown;
  config: PageConfig;
  setData: (data: unknown, cb: () => void) => void;
  route?: string;
  __route__: string;
  $taroParams?: Record<string, unknown>;
  $taroPath: string;
  __data__: unknown;
  data: unknown;
  exitState?: unknown;
  selectComponent: (selector: string) => unknown;
  compId: string;
  onReady: { called?: boolean };
  __webviewId__?: number;
}

export interface MiniElementData {
  [Shortcuts.Childnodes]?: MiniData[];
  [Shortcuts.NodeName]: string;
  [Shortcuts.Class]?: string;
  [Shortcuts.Style]?: string;
  uid?: string;
  sid: string;
  [key: string]: unknown;
}

export interface MiniTextData {
  [Shortcuts.Text]: string;
  [Shortcuts.NodeName]: string;
}

export type MiniData = MiniElementData | MiniTextData;

export type HydratedData = () => MiniData | MiniData[];
