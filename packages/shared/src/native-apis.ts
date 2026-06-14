import { isFunction, isString } from './is';
import { nonsupport, setUniqueKeyToRoute } from './utils';

declare const getCurrentPages: () => unknown;
declare const getApp: () => unknown;
declare const requirePlugin: () => void;

type IObject = Record<string, unknown>;

type NativeApiCallback<T = unknown> = (res: T) => void;

interface NativeApiOptions<TSuccess = unknown, TFail = unknown, TComplete = unknown> extends Record<string, unknown> {
  success?: NativeApiCallback<TSuccess>;
  fail?: NativeApiCallback<TFail>;
  complete?: NativeApiCallback<TComplete>;
}

interface NativeRequestSuccess<T = unknown> {
  data: T;
  statusCode: number;
  header?: Record<string, unknown>;
  cookies?: string[];
  [key: string]: unknown;
}

interface NativeRequestOptions<TData = unknown, TResponse = unknown>
  extends NativeApiOptions<NativeRequestSuccess<TResponse>> {
  url?: string;
  data?: TData;
  header?: Record<string, unknown>;
  method?: string;
  timeout?: number;
}

type NativeTaskMethod = (...args: unknown[]) => unknown;

interface NativeTask {
  abort?: NativeTaskMethod;
  onHeadersReceived?: NativeTaskMethod;
  offHeadersReceived?: NativeTaskMethod;
  onProgressUpdate?: NativeTaskMethod;
  offProgressUpdate?: NativeTaskMethod;
  onChunkReceived?: NativeTaskMethod;
  offChunkReceived?: NativeTaskMethod;
}

type NativeTaskPromise<T> = Promise<T> &
  Omit<Partial<NativeTask>, 'abort'> & {
    progress?: (cb: NativeTaskMethod) => NativeTaskPromise<T>;
    abort?: (cb?: () => void) => NativeTaskPromise<T>;
    [key: string]: unknown;
  };

interface TaroRequestChain {
  requestParams: NativeRequestOptions | string;
}

interface IProcessApisIOptions {
  noPromiseApis?: Set<string>;
  needPromiseApis?: Set<string>;
  handleSyncApis?: (key: string, global: IObject, args: unknown[]) => unknown;
  transformMeta?: (key: string, options: IObject) => { key: string; options: IObject };
  modifyApis?: (apis: Set<string>) => void;
  modifyAsyncResult?: (key: string, res: unknown) => void;
  isOnlyPromisify?: boolean;
  [propName: string]: unknown;
}

export interface IApiDiff {
  [key: string]: {
    /** API重命名 */
    alias?: string;
    options?: {
      /** API参数键名修改 */
      change?: {
        old: string;
        new: string;
      }[];
      /** API参数值修改 */
      set?: {
        key: string;
        value: ((options: Record<string, unknown>) => unknown) | unknown;
      }[];
    };
  };
}

const needPromiseApis = new Set<string>([
  'addPhoneContact',
  'authorize',
  'canvasGetImageData',
  'canvasPutImageData',
  'canvasToTempFilePath',
  'checkSession',
  'chooseAddress',
  'chooseImage',
  'chooseInvoiceTitle',
  'chooseLocation',
  'chooseVideo',
  'clearStorage',
  'closeBLEConnection',
  'closeBluetoothAdapter',
  'closeSocket',
  'compressImage',
  'connectSocket',
  'createBLEConnection',
  'downloadFile',
  'exitMiniProgram',
  'getAvailableAudioSources',
  'getBLEDeviceCharacteristics',
  'getBLEDeviceServices',
  'getBatteryInfo',
  'getBeacons',
  'getBluetoothAdapterState',
  'getBluetoothDevices',
  'getClipboardData',
  'getConnectedBluetoothDevices',
  'getConnectedWifi',
  'getExtConfig',
  'getFileInfo',
  'getImageInfo',
  'getLocation',
  'getNetworkType',
  'getSavedFileInfo',
  'getSavedFileList',
  'getScreenBrightness',
  'getSetting',
  'getStorage',
  'getStorageInfo',
  'getSystemInfo',
  'getUserInfo',
  'getWifiList',
  'hideHomeButton',
  'hideShareMenu',
  'hideTabBar',
  'hideTabBarRedDot',
  'loadFontFace',
  'login',
  'makePhoneCall',
  'navigateBack',
  'navigateBackMiniProgram',
  'navigateTo',
  'navigateToBookshelf',
  'navigateToMiniProgram',
  'notifyBLECharacteristicValueChange',
  'hideKeyboard',
  'hideLoading',
  'hideNavigationBarLoading',
  'hideToast',
  'openBluetoothAdapter',
  'openDocument',
  'openLocation',
  'openSetting',
  'pageScrollTo',
  'previewImage',
  'queryBookshelf',
  'reLaunch',
  'readBLECharacteristicValue',
  'redirectTo',
  'removeSavedFile',
  'removeStorage',
  'removeTabBarBadge',
  'requestSubscribeMessage',
  'saveFile',
  'saveImageToPhotosAlbum',
  'saveVideoToPhotosAlbum',
  'scanCode',
  'sendSocketMessage',
  'setBackgroundColor',
  'setBackgroundTextStyle',
  'setClipboardData',
  'setEnableDebug',
  'setInnerAudioOption',
  'setKeepScreenOn',
  'setNavigationBarColor',
  'setNavigationBarTitle',
  'setScreenBrightness',
  'setStorage',
  'setTabBarBadge',
  'setTabBarItem',
  'setTabBarStyle',
  'showActionSheet',
  'showFavoriteGuide',
  'showLoading',
  'showModal',
  'showShareMenu',
  'showTabBar',
  'showTabBarRedDot',
  'showToast',
  'startBeaconDiscovery',
  'startBluetoothDevicesDiscovery',
  'startDeviceMotionListening',
  'startPullDownRefresh',
  'stopBeaconDiscovery',
  'stopBluetoothDevicesDiscovery',
  'stopCompass',
  'startCompass',
  'startAccelerometer',
  'stopAccelerometer',
  'showNavigationBarLoading',
  'stopDeviceMotionListening',
  'stopPullDownRefresh',
  'switchTab',
  'uploadFile',
  'vibrateLong',
  'vibrateShort',
  'writeBLECharacteristicValue',
]);

function getCanIUseWebp(taro: IObject) {
  return function () {
    const res = (taro.getSystemInfoSync as (() => { platform: string }) | undefined)?.();

    if (!res) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('不支持 API canIUseWebp');
      }
      return false;
    }

    const { platform } = res;

    const platformLower = platform.toLowerCase();
    if (platformLower === 'android' || platformLower === 'devtools') {
      return true;
    }
    return false;
  };
}

function normalizeRequestOptions<TData, TResponse>(
  options?: NativeRequestOptions<TData, TResponse> | string,
): NativeRequestOptions<TData, TResponse> {
  if (!options) return {};
  return isString(options) ? { url: options } : { ...options };
}

function getNormalRequest(global: IObject) {
  return function request<TData = unknown, TResponse = unknown>(
    options?: NativeRequestOptions<TData, TResponse> | string,
  ): NativeTaskPromise<NativeRequestSuccess<TResponse>> {
    const requestOptions = normalizeRequestOptions(options);

    const originSuccess = requestOptions.success;
    const originFail = requestOptions.fail;
    const originComplete = requestOptions.complete;
    let requestTask: NativeTask | undefined;
    const p = new Promise<NativeRequestSuccess<TResponse>>((resolve, reject) => {
      requestOptions.success = (res) => {
        originSuccess?.(res);
        resolve(res);
      };
      requestOptions.fail = (res) => {
        originFail?.(res);
        reject(res);
      };

      requestOptions.complete = (res) => {
        originComplete?.(res);
      };

      requestTask = (global.request as (options: NativeRequestOptions<TData, TResponse>) => NativeTask)(requestOptions);
    }) as NativeTaskPromise<NativeRequestSuccess<TResponse>>;

    equipTaskMethodsIntoPromise(requestTask, p);

    p.abort = (cb) => {
      cb?.();
      requestTask?.abort?.();
      return p;
    };
    return p;
  };
}

function processApis(taro: IObject, global: IObject, config: IProcessApisIOptions = {}) {
  const patchNeedPromiseApis = config.needPromiseApis || new Set<string>();
  const _needPromiseApis = new Set<string>([...patchNeedPromiseApis, ...needPromiseApis]);
  const preserved = [
    'getEnv',
    'interceptors',
    'Current',
    'getCurrentInstance',
    'options',
    'nextTick',
    'eventCenter',
    'Events',
    'preload',
    'webpackJsonp',
  ];

  const apis = new Set(
    !config.isOnlyPromisify ? Object.keys(global).filter((api) => preserved.indexOf(api) === -1) : patchNeedPromiseApis,
  );

  if (config.modifyApis) {
    config.modifyApis(apis);
  }

  apis.forEach((key) => {
    if (_needPromiseApis.has(key)) {
      const originKey = key;
      taro[originKey] = (options: Record<string, unknown> | string = {}, ...args: unknown[]) => {
        let key = originKey;

        // 第一个参数 options 为字符串，单独处理
        if (typeof options === 'string') {
          if (args.length) {
            return (global[key] as (...args: unknown[]) => unknown)(options, ...args);
          }
          return (global[key] as (...args: unknown[]) => unknown)(options);
        }

        // 改变 key 或 option 字段，如需要把支付宝标准的字段对齐微信标准的字段
        if (config.transformMeta) {
          const transformResult = config.transformMeta(key, options);
          key = transformResult.key;
          options = transformResult.options;
          // 新 key 可能不存在
          if (!global.hasOwnProperty(key)) {
            return nonsupport(key)();
          }
        }

        let task: NativeTask | null = null;
        const originalOptions = options as NativeApiOptions;
        const obj: NativeApiOptions = Object.assign({}, options);

        // 为页面跳转相关的 API 设置一个随机数作为路由参数。为了给 runtime 区分页面。
        setUniqueKeyToRoute(key, obj);

        // Promise 化
        const p = new Promise((resolve, reject) => {
          obj.success = (res) => {
            config.modifyAsyncResult?.(key, res);
            originalOptions.success?.(res);
            if (key === 'connectSocket') {
              resolve(Promise.resolve().then(() => (task ? Object.assign(task, res) : res)));
            } else {
              resolve(res);
            }
          };
          obj.fail = (res) => {
            originalOptions.fail?.(res);
            reject(res);
          };
          obj.complete = (res) => {
            originalOptions.complete?.(res);
          };
          if (args.length) {
            task = (global[key] as (...args: unknown[]) => NativeTask)(obj, ...args);
          } else {
            task = (global[key] as (...args: unknown[]) => NativeTask)(obj);
          }
        }) as NativeTaskPromise<unknown>;

        // 给 promise 对象挂载属性
        if (['uploadFile', 'downloadFile'].includes(key)) {
          equipTaskMethodsIntoPromise(task, p);
          p.progress = (cb) => {
            task?.onProgressUpdate?.(cb);
            return p;
          };
          p.abort = (cb) => {
            cb?.();
            task?.abort?.();
            return p;
          };
        }
        return p;
      };
    } else {
      let platformKey = key;

      // 改变 key 或 option 字段，如需要把支付宝标准的字段对齐微信标准的字段
      if (config.transformMeta) {
        platformKey = config.transformMeta(key, {}).key;
      }

      // API 不存在
      if (!global.hasOwnProperty(platformKey)) {
        taro[key] = nonsupport(key);
        return;
      }
      if (isFunction(global[key])) {
        taro[key] = (...args: unknown[]) => {
          if (config.handleSyncApis) {
            return config.handleSyncApis(key, global, args);
          } else {
            return (global[platformKey] as (...args: unknown[]) => unknown).apply(global, args);
          }
        };
      } else {
        taro[key] = global[platformKey];
      }
    }
  });

  !config.isOnlyPromisify && equipCommonApis(taro, global, config);
}

/**
 * 挂载常用 API
 * @param taro Taro 对象
 * @param global 小程序全局对象，如微信的 wx，支付宝的 my
 */
function equipCommonApis(taro: IObject, global: IObject, apis: Record<string, unknown> = {}) {
  taro.canIUseWebp = getCanIUseWebp(taro);
  taro.getCurrentPages = getCurrentPages || nonsupport('getCurrentPages');
  taro.getApp = getApp || nonsupport('getApp');
  taro.env = (global.env as Record<string, unknown> | undefined) || {};

  try {
    taro.requirePlugin = requirePlugin || nonsupport('requirePlugin');
  } catch (error) {
    taro.requirePlugin = nonsupport('requirePlugin');
  }

  // request & interceptors
  const request = (apis.request as ReturnType<typeof getNormalRequest> | undefined) || getNormalRequest(global);
  function taroInterceptor(chain: TaroRequestChain) {
    return request(chain.requestParams);
  }
  const LinkCtor = taro.Link as new (
    interceptor: (chain: TaroRequestChain) => Promise<unknown>,
  ) => {
    request: (params: NativeRequestOptions | string) => Promise<unknown>;
    addInterceptor: (interceptor: (chain: TaroRequestChain) => Promise<unknown>) => void;
    cleanInterceptors: () => void;
  };
  const link = new LinkCtor(taroInterceptor);
  taro.request = link.request.bind(link);
  taro.addInterceptor = link.addInterceptor.bind(link);
  taro.cleanInterceptors = link.cleanInterceptors.bind(link);
  (taro.options as Record<string, unknown>).miniGlobal = global;
  taro.miniGlobal = global;
  taro.getAppInfo = function () {
    return {
      platform: process.env.TARO_PLATFORM || 'MiniProgram',
      taroVersion: process.env.TARO_VERSION || 'unknown',
      designWidth: (taro.config as Record<string, unknown>).designWidth,
    };
  };
  taro.createSelectorQuery = delayRef(taro, global, 'createSelectorQuery', 'exec');
  taro.createIntersectionObserver = delayRef(taro, global, 'createIntersectionObserver', 'observe');
}

/**
 * 将Task对象中的方法挂载到promise对象中，适配小程序api原生返回结果
 * @param task Task对象 {RequestTask | DownloadTask | UploadTask}
 * @param promise Promise
 */
function equipTaskMethodsIntoPromise(task: NativeTask | null | undefined, promise: Record<string, unknown>) {
  if (!task || !promise) return;
  const taskMethods: Array<keyof NativeTask> = [
    'abort',
    'onHeadersReceived',
    'offHeadersReceived',
    'onProgressUpdate',
    'offProgressUpdate',
    'onChunkReceived',
    'offChunkReceived',
  ];
  task &&
    taskMethods.forEach((method) => {
      const taskMethod = task[method];
      if (taskMethod) {
        promise[method] = taskMethod.bind(task);
      }
    });
}

function delayRef(taro: IObject, global: IObject, name: string, method: string) {
  return function (...args: unknown[]) {
    const res = (global[name] as (...args: unknown[]) => unknown)(...args) as Record<string, unknown>;
    const raw = (res[method] as (...args: unknown[]) => unknown).bind(res);
    res[method] = function (...methodArgs: unknown[]) {
      (taro.nextTick as (fn: () => void) => void)(() => raw(...methodArgs));
    };
    return res;
  };
}

export { processApis };
