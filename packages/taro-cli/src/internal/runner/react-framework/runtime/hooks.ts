import type { AppInstance, Instance, PageLifeCycle, PageProps, Router } from '@spcsn/taro/runtime';
import {
  Current,
  eventCenter,
  getOnHideEventKey,
  getOnReadyEventKey,
  getOnShowEventKey,
  getPageInstance,
  injectPageInstance,
  isArray,
  isFunction,
} from '@spcsn/taro/runtime';
import type { Func } from '@spcsn/taro/types/compile';
import { reactMeta } from './react-meta';
import { HOOKS_APP_ID } from './utils';

const EVENT_LIFECYCLE_MAP: Record<string, string | undefined> = {
  componentDidShow: 'onShow',
  componentDidHide: 'onHide',
  onReady: 'onReady',
};

const getEventKeyByLifecycle = (lifecycle: string, id: string): string | undefined => {
  const eventName = EVENT_LIFECYCLE_MAP[lifecycle];
  if (!eventName) return undefined;
  if (eventName === 'onShow') return getOnShowEventKey(id);
  if (eventName === 'onHide') return getOnHideEventKey(id);
  if (eventName === 'onReady') return getOnReadyEventKey(id);
  return undefined;
};

const createTaroHook = (lifecycle: keyof PageLifeCycle | keyof AppInstance) => {
  return (fn: Func) => {
    const { R: React } = reactMeta;
    const instRef = React.useRef<Record<string, unknown> | undefined>(undefined);

    // hold fn ref and keep up to date
    const fnRef = React.useRef(fn);
    if (fnRef.current !== fn) fnRef.current = fn;

    React.useLayoutEffect(() => {
      const isAppLifecycle = ['onLaunch', 'onError', 'onUnhandledRejection', 'onPageNotFound'].includes(
        lifecycle as string,
      );
      const router = Current.router;
      const id = isAppLifecycle ? HOOKS_APP_ID : router?.$taroPath || router?.path || HOOKS_APP_ID;
      let inst = getPageInstance(id) as Record<string, unknown> | undefined;
      instRef.current = inst;
      let first = false;
      if (!inst) {
        first = true;
        instRef.current = Object.create(null);
        inst = instRef.current!;
      }

      // callback is immutable but inner function is up to date
      const callback = (...args: unknown[]) => (fnRef.current as (...args: unknown[]) => unknown)(...args);

      if (isFunction(inst[lifecycle])) {
        inst[lifecycle] = [inst[lifecycle], callback];
      } else {
        inst[lifecycle] = [...((inst[lifecycle] as unknown[]) || []), callback];
      }

      if (first) {
        injectPageInstance(inst as Instance<PageProps>, id);
      }

      // 同时通过 eventCenter 订阅页面生命周期事件，绕过 instance / getLifecycle 映射可能失效的问题
      const eventKey = getEventKeyByLifecycle(lifecycle as string, id);
      if (eventKey) {
        eventCenter.on(eventKey, callback);
      }

      return () => {
        const inst = instRef.current;
        if (!inst) return;
        const list = inst[lifecycle];
        if (list === callback) {
          inst[lifecycle] = undefined;
        } else if (isArray(list)) {
          inst[lifecycle] = list.filter((item) => item !== callback);
        }
        if (eventKey) {
          eventCenter.off(eventKey, callback);
        }
        instRef.current = undefined;
      };
    }, []);
  };
};

/** LifeCycle */
export const useDidHide = createTaroHook('componentDidHide');
export const useDidShow = createTaroHook('componentDidShow');

/** App */
export const useError = createTaroHook('onError');
export const useUnhandledRejection = createTaroHook('onUnhandledRejection');
export const useLaunch = createTaroHook('onLaunch');
export const usePageNotFound = createTaroHook('onPageNotFound');

/** Page */
export const useLoad = createTaroHook('onLoad');
export const usePageScroll = createTaroHook('onPageScroll');
export const usePullDownRefresh = createTaroHook('onPullDownRefresh');
export const useReachBottom = createTaroHook('onReachBottom');
export const useResize = createTaroHook('onResize');
export const useUnload = createTaroHook('onUnload');

/** Mini-Program */
export const useAddToFavorites = createTaroHook('onAddToFavorites');
export const useSaveExitState = createTaroHook('onSaveExitState');
export const useShareAppMessage = createTaroHook('onShareAppMessage');
export const useShareTimeline = createTaroHook('onShareTimeline');

/** Router */
export const useReady = createTaroHook('onReady');
export const useRouter = (dynamic = false): Router | null => {
  const React = reactMeta.R;
  return dynamic ? Current.router : React.useMemo(() => Current.router, []);
};
export const useTabItemTap = createTaroHook('onTabItemTap');

export const useScope = () => undefined;
