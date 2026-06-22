import type { AppInstance, PageInstance } from '@spcsn/taro';
import type { Instance, MpInstance, TaroRootElement } from '@spcsn/taro/runtime';
import {
  addLeadingSlash,
  CONTEXT_ACTIONS,
  Current,
  document,
  eventCenter,
  eventHandler,
  getOnHideEventKey,
  getOnReadyEventKey,
  getOnShowEventKey,
  getPageInstance,
  getPath,
  incrementId,
  injectPageInstance,
  ON_HIDE,
  ON_READY,
  ON_SHOW,
  removePageInstance,
  requestAnimationFrame,
  safeExecute,
  setCurrentApp,
  window,
} from '@spcsn/taro/runtime';
import type React from 'react';
import type TReactDOM from 'react-dom';
import type TReactDOMClient from 'react-dom/client';
import { EMPTY_OBJ, ensure, hooks, isUndefined } from '../../../taro-shared';
import { setReconciler } from './connect';
import { reactMeta } from './react-meta';
import { isClassComponent } from './utils';

type ReactDOMRenderer = typeof TReactDOM &
  typeof TReactDOMClient & {
    render: (element: React.ReactElement, container: unknown) => void;
  };

interface NativeComponentConfig {
  isNewBlended?: boolean;
  [key: string]: unknown;
}

interface EventTargetLike {
  id?: string;
  dataset?: Record<string, unknown>;
}

interface EventLike {
  target?: EventTargetLike;
  [key: string]: unknown;
}

interface NativeComponentObject {
  options: NativeComponentConfig;
  properties: Record<string, unknown>;
  created: (this: MpInstance) => void;
  attached: (this: MpInstance) => void;
  ready: (this: MpInstance) => void;
  detached: (this: MpInstance) => void;
  pageLifetimes: {
    show: (this: MpInstance, options: Record<string, unknown>) => void;
    hide: (this: MpInstance) => void;
    [key: string]: unknown;
  };
  methods: Record<string, unknown>;
  [key: string]: unknown;
}

declare const getCurrentPages: () => PageInstance[];

const getNativeCompId = incrementId();
let h: typeof React.createElement;
let ReactDOM: ReactDOMRenderer;
let nativeComponentApp: AppInstance;
interface InitNativeComponentEntryParams {
  R: typeof React;
  ReactDOM: ReactDOMRenderer;
  cb?: () => void;
  // 是否使用默认的 DOM 入口 - app；默认为true，false的时候，会创建一个新的dom并且把它挂载在 app 下面
  isDefaultEntryDom?: boolean;
}

function initNativeComponentEntry(params: InitNativeComponentEntryParams) {
  const { R, ReactDOM, cb, isDefaultEntryDom = true } = params;
  interface IEntryState {
    components: {
      compId: string;
      element: React.ReactElement;
    }[];
  }

  interface IWrapperProps {
    compId: string;
    getCtx: () => MpInstance;
    renderComponent: (ctx: MpInstance) => React.ReactElement;
  }

  class NativeComponentWrapper extends R.Component<IWrapperProps, Record<string, unknown>> {
    root = R.createRef<TaroRootElement>();
    ctx = this.props.getCtx();

    componentDidMount() {
      this.ctx.component = this;
      const rootElement = this.root.current!;
      rootElement.ctx = this.ctx;
      rootElement.performUpdate(true);
    }

    render() {
      return h(
        'root',
        {
          ref: this.root,
          id: this.props.compId,
        },
        this.props.renderComponent(this.ctx),
      );
    }
  }

  class Entry extends R.Component<Record<string, unknown>, IEntryState> {
    state: IEntryState = {
      components: [],
    };

    componentDidMount() {
      if (isDefaultEntryDom) {
        setCurrentApp(this as unknown as AppInstance);
      } else {
        nativeComponentApp = this as unknown as AppInstance;
      }
      cb && cb();
    }

    mount(
      Component: React.ComponentType<Record<string, unknown>>,
      compId: string,
      getCtx: () => MpInstance,
      cb?: () => void,
    ) {
      const isReactComponent = isClassComponent(R, Component);
      const inject = (node?: Instance) => node && injectPageInstance(node, compId);
      const refs = isReactComponent
        ? { ref: inject }
        : {
            forwardedRef: inject,
            reactReduxForwardedRef: inject,
          };
      if (reactMeta.PageContext === EMPTY_OBJ) {
        reactMeta.PageContext = R.createContext('');
      }
      const item = {
        compId,
        element: h(NativeComponentWrapper, {
          key: compId,
          compId,
          getCtx,
          renderComponent(ctx) {
            const data = (ctx.data || {}) as Record<string, unknown>;
            return h(
              reactMeta.PageContext.Provider,
              { value: compId },
              h(Component, {
                ...(data.props as Record<string, unknown>),
                ...refs,
                $scope: ctx,
              }),
            );
          },
        }),
      };
      this.setState(
        {
          components: [...this.state.components, item],
        },
        () => cb && cb(),
      );
    }

    unmount(compId: string, cb?: () => void) {
      const components = this.state.components;
      const index = components.findIndex((item) => item.compId === compId);
      const next = [...components.slice(0, index), ...components.slice(index + 1)];
      this.setState(
        {
          components: next,
        },
        () => {
          removePageInstance(compId);
          cb && cb();
        },
      );
    }

    render() {
      const components = this.state.components;

      return components.map(({ element }) => element);
    }
  }

  setReconciler(ReactDOM);

  let app = document.getElementById('app');
  if (!isDefaultEntryDom && !nativeComponentApp) {
    // create
    const nativeApp = document.createElement('nativeComponent');
    // insert
    app?.parentNode?.appendChild(nativeApp);
    app = nativeApp;
  }
  ReactDOM.render(h(Entry, {}), app);
}

export function createNativePageConfig(
  Component: React.ComponentType<Record<string, unknown>>,
  pageName: string,
  data: Record<string, unknown>,
  react: typeof React,
  reactDOM: typeof ReactDOM,
  pageConfig: Record<string, unknown>,
) {
  reactMeta.R = react;
  h = react.createElement;
  ReactDOM = reactDOM;
  setReconciler(ReactDOM);
  const [ONLOAD, ONUNLOAD, ONREADY, ONSHOW, ONHIDE, LIFECYCLES, SIDE_EFFECT_LIFECYCLES] =
    hooks.call('getMiniLifecycleImpl')!.page;
  let unmounting = false;
  let prepareMountList: (() => void)[] = [];
  let pageElement: TaroRootElement | null = null;
  let loadResolver: () => void;
  let hasLoaded: Promise<void>;
  const id = pageName ?? `taro_page_${getNativeCompId()}`;
  function setCurrentRouter(page: MpInstance) {
    const router = page.route || page.__route__ || page.$taroPath;
    Current.router = {
      params: page.$taroParams!,
      path: addLeadingSlash(router),
      $taroPath: page.$taroPath,
      onReady: getOnReadyEventKey(page.$taroPath),
      onShow: getOnShowEventKey(page.$taroPath),
      onHide: getOnHideEventKey(page.$taroPath),
    };
    if (!isUndefined(page.exitState)) {
      Current.router.exitState = page.exitState;
    }
  }

  const pageObj: Record<string, unknown> = {
    options: pageConfig,
    [ONLOAD](this: MpInstance, options: Readonly<Record<string, unknown>> = {}, cb?: () => void) {
      hasLoaded = new Promise((resolve) => {
        loadResolver = resolve;
      });
      Current.page = this as unknown as PageInstance;
      this.config = pageConfig || {};
      // this.$taroPath 是页面唯一标识
      const uniqueOptions = Object.assign({}, options, { $taroTimestamp: Date.now() });
      this.$taroPath = getPath(id, uniqueOptions);
      const $taroPath = this.$taroPath;

      // this.$taroParams 作为暴露给开发者的页面参数对象，可以被随意修改
      if (this.$taroParams == null) {
        this.$taroParams = uniqueOptions;
      }

      setCurrentRouter(this);
      window.trigger(CONTEXT_ACTIONS.INIT, $taroPath);

      const mountCallback = () => {
        pageElement = document.getElementById($taroPath);
        ensure(pageElement !== null, '没有找到页面实例。');
        safeExecute($taroPath, ONLOAD, this.$taroParams);
        loadResolver();
        pageElement.ctx = this;
        pageElement.performUpdate(true, cb);
      };

      const mount = () => {
        if (!Current.app) {
          initNativeComponentEntry({
            R: react,
            ReactDOM,
            cb: () => {
              Current.app!.mount!(Component, $taroPath, () => this, mountCallback);
            },
          });
        } else {
          Current.app!.mount!(Component, $taroPath, () => this, mountCallback);
        }
      };

      if (unmounting) {
        prepareMountList.push(mount);
      } else {
        mount();
      }
    },
    [ONUNLOAD](this: MpInstance) {
      const $taroPath = this.$taroPath;
      // 销毁当前页面的上下文信息
      window.trigger(CONTEXT_ACTIONS.DESTROY, $taroPath);
      // 触发onUnload生命周期
      safeExecute($taroPath, ONUNLOAD);
      resetCurrent();
      unmounting = true;
      Current.app!.unmount!($taroPath, () => {
        unmounting = false;
        removePageInstance($taroPath);
        if (pageElement) {
          pageElement.ctx = null;
          pageElement = null;
        }
        if (prepareMountList.length) {
          for (const fn of prepareMountList) {
            fn();
          }
          prepareMountList = [];
        }
      });
    },
    [ONREADY](this: MpInstance) {
      hasLoaded.then(() => {
        // 触发生命周期
        safeExecute(this.$taroPath, ON_READY);
        // 通过事件触发子组件的生命周期
        requestAnimationFrame(() => eventCenter.trigger(getOnReadyEventKey(this.$taroPath)));
        this.onReady.called = true;
      });
    },
    [ONSHOW](this: MpInstance, options: Record<string, unknown> = {}) {
      hasLoaded.then(() => {
        // 设置 Current 的 page 和 router
        Current.page = this as unknown as PageInstance;
        setCurrentRouter(this);
        // 恢复上下文信息
        window.trigger(CONTEXT_ACTIONS.RECOVER, this.$taroPath);
        // 触发生命周期
        safeExecute(this.$taroPath, ON_SHOW, options);
        // 通过事件触发子组件的生命周期
        requestAnimationFrame(() => eventCenter.trigger(getOnShowEventKey(this.$taroPath)));
      });
    },
    [ONHIDE](this: MpInstance) {
      // 缓存当前页面上下文信息
      window.trigger(CONTEXT_ACTIONS.RESTORE, this.$taroPath);
      // 设置 Current 的 page 和 router
      if (Current.page === (this as unknown as PageInstance)) {
        Current.page = null;
        Current.router = null;
      }
      // 触发生命周期
      safeExecute(this.$taroPath, ON_HIDE);
      // 通过事件触发子组件的生命周期
      eventCenter.trigger(getOnHideEventKey(this.$taroPath));
    },
  };

  function resetCurrent() {
    // 小程序插件页面卸载之后返回到宿主页面时，需重置Current页面和路由。否则引发插件组件二次加载异常 fix:#11991
    Current.page = null;
    Current.router = null;
  }

  LIFECYCLES.forEach((lifecycle) => {
    pageObj[lifecycle] = function (this: MpInstance, ...args: unknown[]) {
      return safeExecute(this.$taroPath, lifecycle, ...args);
    };
  });

  const ComponentMeta = Component as unknown as Record<string, unknown>;

  // onShareAppMessage 和 onShareTimeline 一样，会影响小程序右上方按钮的选项，因此不能默认注册。
  SIDE_EFFECT_LIFECYCLES.forEach((lifecycle) => {
    if (
      ComponentMeta[lifecycle] ||
      (ComponentMeta.prototype as Record<string, unknown>)?.[lifecycle] ||
      ComponentMeta[lifecycle.replace(/^on/, 'enable')]
    ) {
      pageObj[lifecycle] = function (this: MpInstance, ...args: unknown[]) {
        const target = (args[0] as EventLike | undefined)?.target;
        if (target?.id) {
          const id = target.id;
          const element = document.getElementById(id);
          if (element) {
            target.dataset = element.dataset;
          }
        }
        return safeExecute(this.$taroPath, lifecycle, ...args);
      };
    }
  });

  pageObj.eh = eventHandler;

  if (!isUndefined(data)) {
    pageObj.data = data;
  }

  hooks.call('modifyPageObject', pageObj);

  return pageObj;
}

export function createNativeComponentConfig(
  Component: React.ComponentType<Record<string, unknown>>,
  react: typeof React,
  reactDOM: typeof ReactDOM,
  componentConfig: NativeComponentConfig,
) {
  reactMeta.R = react;
  h = react.createElement;
  ReactDOM = reactDOM;
  setReconciler(ReactDOM);
  const { isNewBlended } = componentConfig;

  const componentObj: NativeComponentObject = {
    options: componentConfig,
    properties: {
      props: {
        type: null,
        value: null,
        observer(this: { component?: { forceUpdate: () => void } }, _newVal: unknown, oldVal: unknown) {
          oldVal && this.component?.forceUpdate();
        },
      },
    },
    created(this: MpInstance) {
      const app = isNewBlended ? nativeComponentApp : Current.app;
      if (!app) {
        initNativeComponentEntry({
          R: react,
          ReactDOM,
          isDefaultEntryDom: !isNewBlended,
        });
      }
    },
    attached(this: MpInstance) {
      this.compId = getNativeCompId();
      const compId = this.compId;
      setCurrent(compId);
      this.config = componentConfig;
      const app = isNewBlended ? nativeComponentApp : Current.app;
      app!.mount!(
        Component,
        compId,
        () => this,
        () => {
          const instance = getPageInstance(compId);

          if (instance && instance.node) {
            const el = document.getElementById(instance.node.uid);

            if (el) {
              el.ctx = this;
            }
          }
        },
      );
    },
    ready(this: MpInstance) {
      safeExecute(this.compId, 'onReady');
    },
    detached(this: MpInstance) {
      resetCurrent();
      const app = isNewBlended ? nativeComponentApp : Current.app;
      app!.unmount!(this.compId);
    },
    pageLifetimes: {
      show(this: MpInstance, options: Record<string, unknown>) {
        safeExecute(this.compId, 'onShow', options);
      },
      hide(this: MpInstance) {
        safeExecute(this.compId, 'onHide');
      },
    },
    methods: {
      eh: eventHandler,
      onLoad(this: MpInstance, options: Record<string, unknown>) {
        safeExecute(this.compId, 'onLoad', options);
      },
      onUnload(this: MpInstance) {
        safeExecute(this.compId, 'onUnload');
      },
    },
  };

  function resetCurrent() {
    // 小程序插件页面卸载之后返回到宿主页面时，需重置Current页面和路由。否则引发插件组件二次加载异常 fix:#11991
    Current.page = null;
    Current.router = null;
  }

  const componentMeta = Component as unknown as Record<string, unknown>;

  // onShareAppMessage 和 onShareTimeline 一样，会影响小程序右上方按钮的选项，因此不能默认注册。
  if (
    componentMeta.onShareAppMessage ||
    (componentMeta.prototype as Record<string, unknown>)?.onShareAppMessage ||
    componentMeta.enableShareAppMessage
  ) {
    componentObj.methods.onShareAppMessage = function (this: MpInstance, options: EventLike) {
      const target = options?.target;
      if (target) {
        const id = target.id;
        const element = document.getElementById(id);
        if (element) {
          target.dataset = element.dataset;
        }
      }
      return safeExecute(this.compId, 'onShareAppMessage', options);
    };
  }
  if (
    componentMeta.onShareTimeline ||
    (componentMeta.prototype as Record<string, unknown>)?.onShareTimeline ||
    componentMeta.enableShareTimeline
  ) {
    componentObj.methods.onShareTimeline = function (this: MpInstance) {
      return safeExecute(this.compId, 'onShareTimeline');
    };
  }

  return componentObj;
}

function setCurrent(compId: string) {
  if (!getCurrentPages || typeof getCurrentPages !== 'function') return;

  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  if (Current.page === currentPage) return;

  Current.page = currentPage;

  const route = (currentPage as unknown as MpInstance).route || (currentPage as unknown as MpInstance).__route__;
  const router = {
    params: currentPage.options || {},
    path: addLeadingSlash(route),
    $taroPath: compId,
    onReady: '',
    onHide: '',
    onShow: '',
  };
  Current.router = router;

  if (!currentPage.options) {
    // 例如在微信小程序中，页面 options 的设置时机比组件 attached 慢
    Object.defineProperty(currentPage, 'options', {
      enumerable: true,
      configurable: true,
      get(): Record<string, unknown> {
        return this._optionsValue as Record<string, unknown>;
      },
      set(value: unknown) {
        router.params = value as Record<string, unknown>;
        this._optionsValue = value;
      },
    });
  }
}
