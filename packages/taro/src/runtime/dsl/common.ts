import type { ComponentClass } from 'react';
import { raf } from '../bom/raf';
import { taroWindowProvider } from '../bom/window';
import {
  BEHAVIORS,
  CONTEXT_ACTIONS,
  CUSTOM_WRAPPER,
  EXTERNAL_CLASSES,
  ON_HIDE,
  ON_LOAD,
  ON_READY,
  ON_SHOW,
  OPTIONS,
  PAGE_INIT,
  VIEW,
} from '../constants';
import { Current, whenAppReady } from '../current';
import { eventHandler } from '../dom/event';
import type { TaroRootElement } from '../dom/root';
import { eventCenter } from '../emitter/emitter';
import env from '../env';
import type { MpInstance, PageConfig, TFunc } from '../interface';
import { getComponentsAlias, internalComponents } from '../internal-components-registry';
import { perf } from '../perf';
import { hooks } from '../runtime-hooks';
import { EMPTY_OBJ, ensure, isArray, isFunction, isString, isUndefined } from '../shared-primitives';
import { Shortcuts } from '../shortcuts';
import { customWrapperCache, incrementId } from '../utils';
import { addLeadingSlash } from '../utils/router';
import type { Instance, PageInstance, PageProps } from './instance';

const instances = new Map<string, Instance>();
const pageId = incrementId();

export function injectPageInstance(inst: Instance<PageProps>, id: string) {
  hooks.call('mergePageInstance', instances.get(id), inst);
  instances.set(id, inst);
}

export function getPageInstance(id: string): Instance | undefined {
  return instances.get(id);
}

export function removePageInstance(id: string) {
  instances.delete(id);
}

export function safeExecute(path: string, lifecycle: string, ...args: unknown[]): unknown {
  const instance = instances.get(path);

  if (instance == null) {
    return;
  }

  const func = hooks.call('getLifecycle', instance, lifecycle as string);

  if (isArray(func)) {
    const res = func.map((fn) => fn.apply(instance, args));
    return res[0];
  }

  if (!isFunction(func)) {
    return;
  }

  return func.apply(instance, args);
}

export function stringify(obj?: Record<string, unknown>) {
  if (obj == null) {
    return '';
  }
  const path = Object.keys(obj)
    .map((key) => {
      return key + '=' + obj[key];
    })
    .join('&');
  return path === '' ? path : '?' + path;
}

export function getPath(id: string, options?: Record<string, unknown>): string {
  const idx = id.indexOf('?');
  return `${idx > -1 ? id.substring(0, idx) : id}${stringify(options)}`;
}

export function getOnReadyEventKey(path: string) {
  return path + '.' + ON_READY;
}

export function getOnShowEventKey(path: string) {
  return path + '.' + ON_SHOW;
}

export function getOnHideEventKey(path: string) {
  return path + '.' + ON_HIDE;
}

export function createPageConfig(
  component: ComponentClass,
  pageName?: string,
  data?: Record<string, unknown>,
  pageConfig?: PageConfig,
) {
  // 小程序 Page 构造器是一个傲娇小公主，不能把复杂的对象挂载到参数上
  const id = pageName ?? `taro_page_${pageId()}`;
  const [ONLOAD, ONUNLOAD, ONREADY, ONSHOW, ONHIDE, LIFECYCLES, SIDE_EFFECT_LIFECYCLES] =
    hooks.call('getMiniLifecycleImpl')!.page;
  let pageElement: TaroRootElement | null = null;
  let unmounting = false;
  let prepareMountList: (() => void)[] = [];

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
  let loadResolver: () => void;
  let hasLoaded: Promise<void>;
  const config: PageInstance = {
    [ONLOAD](this: MpInstance, options: Readonly<Record<string, unknown>> = {}, cb?: TFunc) {
      hasLoaded = new Promise((resolve) => {
        loadResolver = resolve;
      });

      perf.start(PAGE_INIT);

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

      // 初始化当前页面的上下文信息
      taroWindowProvider.trigger(CONTEXT_ACTIONS.INIT, $taroPath);

      const mount = () => {
        whenAppReady((app) =>
          app.mount!(component, $taroPath, () => {
            pageElement = env.document.getElementById<TaroRootElement>($taroPath);

            ensure(pageElement !== null, '没有找到页面实例。');
            safeExecute($taroPath, ON_LOAD, this.$taroParams);
            loadResolver();
            pageElement.ctx = this;
            pageElement.performUpdate(true, cb);
          }),
        );
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
      taroWindowProvider.trigger(CONTEXT_ACTIONS.DESTROY, $taroPath);
      // 触发onUnload生命周期
      safeExecute($taroPath, ONUNLOAD);
      unmounting = true;
      whenAppReady((app) =>
        app.unmount!($taroPath, () => {
          unmounting = false;
          instances.delete($taroPath);
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
        }),
      );
    },
    [ONREADY](this: MpInstance) {
      hasLoaded.then(() => {
        // 触发生命周期
        safeExecute(this.$taroPath, ON_READY);
        // 通过事件触发子组件的生命周期
        raf(() => eventCenter.trigger(getOnReadyEventKey(this.$taroPath)));
        (this[ONREADY] as TFunc & { called?: boolean }).called = true;
      });
    },
    [ONSHOW](this: MpInstance, options: Record<string, unknown> = {}) {
      hasLoaded.then(() => {
        // 设置 Current 的 page 和 router
        Current.page = this as unknown as PageInstance;
        setCurrentRouter(this);
        // 恢复上下文信息
        taroWindowProvider.trigger(CONTEXT_ACTIONS.RECOVER, this.$taroPath);
        // 触发生命周期
        safeExecute(this.$taroPath, ON_SHOW, options);
        // 通过事件触发子组件的生命周期
        raf(() => eventCenter.trigger(getOnShowEventKey(this.$taroPath)));
      });
    },
    [ONHIDE](this: MpInstance) {
      // 缓存当前页面上下文信息
      taroWindowProvider.trigger(CONTEXT_ACTIONS.RESTORE, this.$taroPath);
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
  LIFECYCLES.forEach((lifecycle) => {
    let isDefer = false;
    let isEvent = false;
    lifecycle = lifecycle.replace(/^defer:/, () => {
      isDefer = true;
      return '';
    });
    lifecycle = lifecycle.replace(/^events:/, () => {
      isEvent = true;
      return '';
    });

    if (isEvent) {
      return;
    }

    config[lifecycle] = function (this: MpInstance, ...args: unknown[]) {
      const exec = () => safeExecute(this.$taroPath, lifecycle, ...args);
      if (isDefer) {
        hasLoaded.then(exec);
      } else {
        return exec();
      }
    };
  });

  // onShareAppMessage 和 onShareTimeline 一样，会影响小程序右上方按钮的选项，因此不能默认注册。
  SIDE_EFFECT_LIFECYCLES.forEach((lifecycle) => {
    const comp = component as unknown as Record<string, unknown>;
    if (
      comp[lifecycle] ||
      (comp.prototype as Record<string, unknown> | undefined)?.[lifecycle] ||
      comp[lifecycle.replace(/^on/, 'enable')] ||
      pageConfig?.[lifecycle.replace(/^on/, 'enable')]
    ) {
      config[lifecycle] = function (this: MpInstance, ...args: unknown[]) {
        const target = (args[0] as Record<string, unknown> | undefined)?.target as Record<string, unknown> | undefined;
        if (target != null && isString(target.id)) {
          const id = target.id;
          const element = env.document.getElementById(id);
          if (element) {
            target.dataset = element.dataset;
          }
        }
        return safeExecute(this.$taroPath, lifecycle, ...args);
      };
    }
  });

  config.eh = eventHandler;

  if (!isUndefined(data)) {
    config.data = data;
  }

  hooks.call('modifyPageObject', config);

  return config;
}

export function createComponentConfig(
  component: ComponentClass,
  componentName?: string,
  data?: Record<string, unknown>,
) {
  const id = componentName ?? `taro_component_${pageId()}`;
  let componentElement: TaroRootElement | null = null;
  const [ATTACHED, DETACHED] = hooks.call('getMiniLifecycleImpl')!.component;

  const config: Record<string, unknown> = {
    [ATTACHED](this: MpInstance) {
      perf.start(PAGE_INIT);
      this.pageIdCache = (this.getPageId as (() => string) | undefined)?.() || pageId();

      const path = getPath(id, { id: this.pageIdCache });

      whenAppReady((app) =>
        app.mount!(component, path, () => {
          componentElement = env.document.getElementById<TaroRootElement>(path);
          ensure(componentElement !== null, '没有找到组件实例。');
          this.$taroInstances = instances.get(path);
          safeExecute(path, ON_LOAD);
          componentElement.ctx = this;
          componentElement.performUpdate(true);
        }),
      );
    },
    [DETACHED](this: MpInstance) {
      const path = getPath(id, { id: this.pageIdCache });

      whenAppReady((app) =>
        app.unmount!(path, () => {
          instances.delete(path);
          if (componentElement) {
            componentElement.ctx = null;
          }
        }),
      );
    },
    methods: {
      eh: eventHandler,
    },
  };

  if (!isUndefined(data)) {
    config.data = data;
  }

  [OPTIONS, EXTERNAL_CLASSES, BEHAVIORS].forEach((key) => {
    config[key] = (component as unknown as Record<string, unknown>)[key] ?? EMPTY_OBJ;
  });

  return config;
}

export function createRecursiveComponentConfig(componentName?: string): Record<string, unknown> {
  const isCustomWrapper = componentName === CUSTOM_WRAPPER;
  const [ATTACHED, DETACHED] = hooks.call('getMiniLifecycleImpl')!.component;

  const lifeCycles = isCustomWrapper
    ? {
        [ATTACHED](this: MpInstance) {
          const data = this.data as Record<string, unknown>;
          const props = this.props as Record<string, unknown> | undefined;
          const componentId =
            ((data.i as Record<string, unknown> | undefined)?.sid as string | undefined) ||
            ((props?.i as Record<string, unknown> | undefined)?.sid as string | undefined);
          if (isString(componentId)) {
            customWrapperCache.set(componentId, this);
            const el = env.document.getElementById(componentId);
            if (el) {
              el.ctx = this;
            }
          }
        },
        [DETACHED](this: MpInstance) {
          const data = this.data as Record<string, unknown>;
          const props = this.props as Record<string, unknown> | undefined;
          const componentId =
            ((data.i as Record<string, unknown> | undefined)?.sid as string | undefined) ||
            ((props?.i as Record<string, unknown> | undefined)?.sid as string | undefined);
          if (isString(componentId)) {
            customWrapperCache.delete(componentId);
            const el = env.document.getElementById(componentId);
            if (el) {
              el.ctx = null;
            }
          }
        },
      }
    : EMPTY_OBJ;

  return hooks.call(
    'modifyRecursiveComponentConfig',
    {
      properties: {
        i: {
          type: Object,
          value: {
            [Shortcuts.NodeName]: getComponentsAlias(internalComponents)[VIEW]._num,
          },
        },
        l: {
          type: String,
          value: '',
        },
      },
      options: {
        virtualHost: !isCustomWrapper,
      },
      methods: {
        eh: eventHandler,
      },
      ...lifeCycles,
    },
    { isCustomWrapper },
  ) as Record<string, unknown>;
}
