const { Current, getPageInstance, injectPageInstance } = require('@spcsn/taro-runtime');
const React = require('react');

const hooksMap = {
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

function createHook(lifecycle) {
  return (fn) => {
    const router = Current.router;
    const id = router?.$taroPath || router?.path || 'taro-app';
    const instRef = React.useRef();
    const fnRef = React.useRef(fn);
    if (fnRef.current !== fn) fnRef.current = fn;

    React.useLayoutEffect(() => {
      let inst = (instRef.current = getPageInstance(id));
      if (!inst) {
        inst = instRef.current = Object.create(null);
        injectPageInstance(inst, id);
      }

      const callback = (...args) => fnRef.current(...args);
      if (typeof inst[lifecycle] === 'function') {
        inst[lifecycle] = [inst[lifecycle], callback];
      } else {
        inst[lifecycle] = [...(inst[lifecycle] || []), callback];
      }

      return () => {
        const inst = instRef.current;
        if (!inst) return;

        const list = inst[lifecycle];
        if (list === callback) {
          inst[lifecycle] = undefined;
        } else if (Array.isArray(list)) {
          inst[lifecycle] = list.filter((item) => item !== callback);
        }
        instRef.current = undefined;
      };
    }, []);
  };
}

function initReactHooksFallback(taro) {
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

module.exports = {
  initReactHooksFallback,
};
