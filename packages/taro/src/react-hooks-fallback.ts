import { Current, getPageInstance, injectPageInstance } from '@spcsn/taro-runtime';
import React from 'react';

const hooksMap: Record<string, string> = {
  useAddToFavorites: 'onAddToFavorites',
  useDidHide: 'componentDidHide',
  useDidShow: 'componentDidShow',
  useError: 'onError',
  useKeyboardHeight: 'onKeyboardHeight',
  useLaunch: 'onLaunch',
  useLoad: 'onLoad',
  useOptionMenuClick: 'onOptionMenuClick',
  usePageNotFound: 'onPageNotFound',
  usePageScroll: 'onPageScroll',
  usePullDownRefresh: 'onPullDownRefresh',
  usePullIntercept: 'onPullIntercept',
  useReachBottom: 'onReachBottom',
  useReady: 'onReady',
  useResize: 'onResize',
  useSaveExitState: 'onSaveExitState',
  useShareAppMessage: 'onShareAppMessage',
  useShareTimeline: 'onShareTimeline',
  useTabItemTap: 'onTabItemTap',
  useTitleClick: 'onTitleClick',
  useUnhandledRejection: 'onUnhandledRejection',
  useUnload: 'onUnload',
};

function createHook(lifecycle: string) {
  return (fn: (...args: any[]) => any) => {
    const router = Current.router;
    const id = router?.$taroPath || router?.path || 'taro-app';
    const instRef = React.useRef<any>(undefined);
    const fnRef = React.useRef(fn);
    if (fnRef.current !== fn) fnRef.current = fn;

    React.useLayoutEffect(() => {
      let inst = (instRef.current = getPageInstance(id));
      if (!inst) {
        inst = instRef.current = Object.create(null);
        injectPageInstance(inst as any, id);
      }

      const callback = (...args: any[]) => fnRef.current(...args);
      if (typeof (inst as any)[lifecycle] === 'function') {
        (inst as any)[lifecycle] = [(inst as any)[lifecycle], callback];
      } else {
        (inst as any)[lifecycle] = [...((inst as any)[lifecycle] || []), callback];
      }

      return () => {
        const inst = instRef.current;
        if (!inst) return;

        const list = (inst as any)[lifecycle];
        if (list === callback) {
          (inst as any)[lifecycle] = undefined;
        } else if (Array.isArray(list)) {
          (inst as any)[lifecycle] = list.filter((item) => item !== callback);
        }
        instRef.current = undefined;
      };
    }, []);
  };
}

function initReactHooksFallback(taro: Record<string, any>): void {
  if (typeof taro.useShareAppMessage === 'function') return;

  Object.keys(hooksMap).forEach((key) => {
    taro[key] = createHook(hooksMap[key]);
  });

  taro.useRouter = function useRouter(dynamic = false) {
    if (dynamic) return Current.router;
    return React.useMemo(() => Current.router, []);
  };

  taro.useScope = function useScope() {
    return undefined;
  };
}

export { initReactHooksFallback };
