import { AppInstance, PageInstance } from './dsl/instance';

export interface Router {
  params: Record<string, unknown>;
  path: string;
  $taroPath: string;
  onReady: string;
  onHide: string;
  onShow: string;
  exitState?: any;
}

interface Current {
  app: AppInstance | null;
  router: Router | null;
  page: PageInstance | null;
  preloadData?: any;
}

export const Current: Current = {
  app: null,
  router: null,
  page: null,
};

type AppReadyCallback = (app: AppInstance) => void;

const appReadyCallbacks: AppReadyCallback[] = [];

export function setCurrentApp(app: AppInstance) {
  Current.app = app;

  while (appReadyCallbacks.length) {
    appReadyCallbacks.shift()!(app);
  }
}

export function whenAppReady(callback: AppReadyCallback) {
  if (Current.app) {
    callback(Current.app);
  } else {
    appReadyCallbacks.push(callback);
  }
}

export const getCurrentInstance = () => Current;
