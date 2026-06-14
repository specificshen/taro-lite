import {
  CONTAINER,
  Current,
  document,
  getPageInstance,
  incrementId,
  injectPageInstance,
  PAGE_INIT,
  perf,
  setCurrentApp,
} from '@spcsn/taro-runtime';
import { EMPTY_OBJ, ensure, hooks } from '@spcsn/taro-shared';
import { reactMeta } from './react-meta';
import { ensureIsArray, HOOKS_APP_ID, isClassComponent, setDefaultDescriptor, setRouterParams } from './utils';
import type {
  AppInstance,
  Instance,
  MpEvent,
  PageLifeCycle,
  PageProps,
  ReactAppInstance,
  ReactPageComponent,
} from '@spcsn/taro-runtime';
import type { AppConfig } from '@spcsn/taro';
import type React from 'react';
import type TReactDOM from 'react-dom';
import type TReactDOMClient from 'react-dom/client';

type PageComponent = React.CElement<PageProps, React.Component<PageProps, any, any>>;
type InjectPageInstance = (node?: Instance | null) => void;
type PageInjectedProps = PageProps & {
  ref?: React.Ref<Instance>;
  forwardedRef?: InjectPageInstance;
  reactReduxForwardedRef?: InjectPageInstance;
};
type PageInjectedComponent = React.ComponentType<PageInjectedProps>;
type ReactDOMRenderer = typeof TReactDOM &
  typeof TReactDOMClient & {
    render?: (element: React.ReactElement, container: unknown) => void;
  };
type LifecycleCallback = (...args: unknown[]) => unknown;

let h: typeof React.createElement;
let ReactDOM: ReactDOMRenderer;

const pageKeyId = incrementId();

export function setReconciler(ReactDOM?: ReactDOMRenderer) {
  hooks.tap('getLifecycle', function (instance: unknown, lifecycle: unknown) {
    const inst = instance as Instance;
    const name = String(lifecycle).replace(/^on(Show|Hide)$/, 'componentDid$1');
    return inst[name] as LifecycleCallback | LifecycleCallback[] | undefined;
  });

  hooks.tap('modifyMpEvent', function (event: unknown) {
    const ev = event as MpEvent;
    Object.defineProperty(ev, 'type', {
      value: ev.type.replace(/-/g, ''),
    });
  });

  hooks.tap('batchedEventUpdates', function (cb: unknown) {
    ReactDOM?.unstable_batchedUpdates(cb as () => void);
  });

  hooks.tap('mergePageInstance', function (prev: unknown, next: unknown) {
    const prevInst = prev as Instance | undefined;
    const nextInst = next as Instance | undefined;
    if (!prevInst || !nextInst) return;

    // 子组件使用 lifecycle hooks 注册了生命周期后，会存在 prev，里面是注册的生命周期回调。

    // prev 使用 Object.create(null) 创建，需排除 fast-refresh 等场景下意外产生的 prev
    if ('constructor' in prevInst) return;

    Object.keys(prevInst).forEach((item) => {
      const prevList = ensureIsArray<LifecycleCallback>(prevInst[item] as LifecycleCallback | LifecycleCallback[]);
      const nextList = ensureIsArray<LifecycleCallback>(nextInst[item] as LifecycleCallback | LifecycleCallback[]);
      (nextInst as Record<string, LifecycleCallback[]>)[item] = nextList.concat(prevList);
    });
  });
}

export function connectReactPage(R: typeof React, id: string) {
  return (Page: ReactPageComponent): React.ComponentClass<PageProps> => {
    const isReactComponent = isClassComponent(R, Page);
    const pageComponent = Page as PageInjectedComponent;
    const inject: InjectPageInstance = (node) => {
      if (node) {
        injectPageInstance(node, id);
      }
    };
    const refs: PageInjectedProps = isReactComponent
      ? { ref: inject }
      : {
          forwardedRef: inject,
          // 兼容 react-redux 7.20.1+
          reactReduxForwardedRef: inject,
        };

    if (reactMeta.PageContext === EMPTY_OBJ) {
      reactMeta.PageContext = R.createContext('');
    }

    return class PageWrapper extends R.Component<PageProps, { hasError: boolean }> {
      state = {
        hasError: false,
      };

      static getDerivedStateFromError(error: Error) {
        Current.app?.onError?.(error.message + error.stack);
        return { hasError: true };
      }

      // React 16 uncaught error 会导致整个应用 crash，
      // 目前把错误缩小到页面
      componentDidCatch(error: Error, info: React.ErrorInfo) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(error);
          console.error(info.componentStack);
        }
      }

      render() {
        const children = this.state.hasError
          ? []
          : h(
              reactMeta.PageContext.Provider,
              { value: id },
              h(pageComponent, {
                ...this.props,
                ...refs,
              }),
            );

        return h('root', { id }, children);
      }
    };
  };
}

/**
 * 桥接小程序 App 构造器和 React 渲染流程
 * @param App 用户编写的入口组件
 * @param react 框架
 * @param dom 框架渲染器
 * @param config 入口组件配置 app.config.js 的内容
 * @returns 传递给 App 构造器的对象 obj ：App(obj)
 */
export function createReactApp(
  App: React.ComponentClass,
  react: typeof React,
  dom: ReactDOMRenderer,
  config: AppConfig,
) {
  if (process.env.NODE_ENV !== 'production') {
    ensure(!!dom, "构建 React 项目时未能找到 ReactDOM，请确认 process.env.FRAMEWORK 设置为 'react'");
  }

  reactMeta.R = react;
  h = react.createElement;
  ReactDOM = dom;
  const appInstanceRef = react.createRef<ReactAppInstance>();
  const isReactComponent = isClassComponent(react, App);
  let appWrapper: AppWrapper;
  let appWrapperResolver: (value: AppWrapper) => void;
  const appWrapperPromise = new Promise<AppWrapper>((resolve) => (appWrapperResolver = resolve));

  setReconciler(ReactDOM);

  function getAppInstance(): ReactAppInstance | null {
    return appInstanceRef.current;
  }

  function waitAppWrapper(cb: () => void) {
    /**
     * 当同个事件触发多次时，waitAppWrapper 会出现同步和异步任务的执行顺序问题，
     * 导致某些场景下 onShow 会优于 onLaunch 执行
     */
    appWrapperPromise.then(() => cb());
    // appWrapper ? cb() : appWrapperPromise.then(() => cb())
  }

  function renderReactRoot() {
    const appId = config?.appId || 'app';
    let container = document.getElementById(appId);
    if (container == null) {
      const appContainer = document.getElementById(CONTAINER);
      container = document.createElement(appId);
      container.id = appId;
      appContainer?.appendChild(container);
    }
    if (typeof ReactDOM.createRoot === 'function') {
      const root = ReactDOM.createRoot(container as unknown as Element);
      root.render?.(h(AppWrapper));
    } else {
      ReactDOM.render?.(h(AppWrapper), container);
    }
  }

  class AppWrapper extends react.Component {
    // run createElement() inside the render function to make sure that owner is right
    private pages: Array<() => PageComponent> = [];
    private elements: Array<PageComponent> = [];

    constructor(props: Record<string, unknown>) {
      super(props);
      appWrapper = this;
      appWrapperResolver(this);
    }

    public mount(pageComponent: ReactPageComponent, id: string, cb: () => void) {
      const pageWrapper = connectReactPage(react, id)(pageComponent);
      const key = id + pageKeyId();
      const page = () => h(pageWrapper, { key, tid: id });
      this.pages.push(page);
      this.forceUpdate((...args) => {
        perf.stop(PAGE_INIT);
        return cb(...args);
      });
    }

    public unmount(id: string, cb: () => void) {
      const elements = this.elements;
      const idx = elements.findIndex((item) => item.props.tid === id);
      elements.splice(idx, 1);
      this.forceUpdate(cb);
    }

    public render() {
      const { pages, elements } = this;

      while (pages.length > 0) {
        const page = pages.pop()!;
        elements.push(page());
      }

      let props: React.ComponentProps<any> | null = null;

      if (isReactComponent) {
        props = { ref: appInstanceRef };
      }

      return h(App, props, elements.slice());
    }
  }

  renderReactRoot();

  const [ONLAUNCH, ONSHOW, ONHIDE] = hooks.call('getMiniLifecycleImpl')!.app;

  const appObj: AppInstance = Object.create(
    {
      render(cb: () => void) {
        appWrapper.forceUpdate(cb);
      },

      mount(component: ReactPageComponent, id: string, cb: () => void) {
        if (appWrapper) {
          appWrapper.mount(component, id, cb);
        } else {
          appWrapperPromise.then((appWrapper) => appWrapper.mount(component, id, cb));
        }
      },

      unmount(id: string, cb: () => void) {
        if (appWrapper) {
          appWrapper.unmount(id, cb);
        } else {
          appWrapperPromise.then((appWrapper) => appWrapper.unmount(id, cb));
        }
      },
    },
    {
      config: setDefaultDescriptor({
        configurable: true,
        value: config,
      }),

      [ONLAUNCH]: setDefaultDescriptor({
        value(options: Record<string, unknown>) {
          setRouterParams(options);

          const onLaunch = () => {
            // 用户编写的入口组件实例
            const app = getAppInstance();
            this.$app = app;

            if (app) {
              // 把 App Class 上挂载的额外属性同步到全局 app 对象中
              if (app.taroGlobalData) {
                const globalData = app.taroGlobalData;
                const keys = Object.keys(globalData);
                const descriptors = Object.getOwnPropertyDescriptors(globalData);
                keys.forEach((key) => {
                  Object.defineProperty(this, key, {
                    configurable: true,
                    enumerable: true,
                    get() {
                      return globalData[key];
                    },
                    set(value) {
                      globalData[key] = value;
                    },
                  });
                });
                Object.defineProperties(this, descriptors);
              }

              app.onLaunch?.(options);
            }
            triggerAppHook('onLaunch', options);
          };

          waitAppWrapper(onLaunch);
        },
      }),

      [ONSHOW]: setDefaultDescriptor({
        value(options: Record<string, unknown>) {
          setRouterParams(options);

          const onShow = () => {
            /**
             * trigger lifecycle
             */
            const app = getAppInstance();
            // class component, componentDidShow
            app?.componentDidShow?.(options);
            // functional component, useDidShow
            triggerAppHook('onShow', options);
          };

          waitAppWrapper(onShow);
        },
      }),

      [ONHIDE]: setDefaultDescriptor({
        value() {
          const onHide = () => {
            /**
             * trigger lifecycle
             */
            const app = getAppInstance();
            // class component, componentDidHide
            app?.componentDidHide?.();
            // functional component, useDidHide
            triggerAppHook('onHide');
          };

          waitAppWrapper(onHide);
        },
      }),

      onError: setDefaultDescriptor({
        value(error: string) {
          const onError = () => {
            const app = getAppInstance();
            app?.onError?.(error);
            triggerAppHook('onError', error);
            if (process.env.NODE_ENV !== 'production' && error?.includes('Minified React error')) {
              console.warn(
                'React 出现报错，请打开编译配置 mini.debugReact 查看报错详情：https://docs.taro.zone/docs/config-detail#minidebugreact',
              );
            }
          };

          waitAppWrapper(onError);
        },
      }),

      onUnhandledRejection: setDefaultDescriptor({
        value(res: unknown) {
          const onUnhandledRejection = () => {
            const app = getAppInstance();
            app?.onUnhandledRejection?.(res);
            triggerAppHook('onUnhandledRejection', res);
          };

          waitAppWrapper(onUnhandledRejection);
        },
      }),

      onPageNotFound: setDefaultDescriptor({
        value(res: unknown) {
          const onPageNotFound = () => {
            const app = getAppInstance();
            app?.onPageNotFound?.(res);
            triggerAppHook('onPageNotFound', res);
          };

          waitAppWrapper(onPageNotFound);
        },
      }),
    },
  );

  function triggerAppHook(lifecycle: keyof PageLifeCycle | keyof AppInstance, ...option: unknown[]) {
    const instance = getPageInstance(HOOKS_APP_ID);
    if (instance) {
      const app = getAppInstance();
      const func = hooks.call('getLifecycle', instance, lifecycle);
      if (Array.isArray(func)) {
        func.forEach((cb) => cb.apply(app, option));
      }
    }
  }

  setCurrentApp(appObj);
  return appObj;
}
