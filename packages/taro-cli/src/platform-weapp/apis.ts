import { processApis } from '@spcsn/taro/runtime';
import { needPromiseApis } from './apis-list';

interface WeappNativeApi extends Record<string, unknown> {
  cloud?: unknown;
}

interface TaroApiTarget extends Record<string, unknown> {
  cloud?: unknown;
  getTabBar?: (pageCtx?: { getTabBar?: () => { $taroInstances?: unknown } }) => unknown;
  getRenderer?: () => string;
  getCurrentInstance?: () => { page?: { renderer?: string } };
}

declare const wx: WeappNativeApi;

export function initNativeApi(taro: TaroApiTarget): void {
  processApis(taro, wx, {
    needPromiseApis,
    modifyApis(apis) {
      apis.delete('lanDebug');
    },
    transformMeta(api: string, options: Record<string, unknown>) {
      if (api === 'showShareMenu') {
        const showShareItems = Array.isArray(options.showShareItems) ? options.showShareItems : [];
        options.menus = showShareItems.map((item) =>
          item === 'wechatFriends' ? 'shareAppMessage' : item === 'wechatMoment' ? 'shareTimeline' : item,
        );
      }

      return {
        key: api,
        options,
      };
    },
  });

  taro.cloud = wx.cloud;
  taro.getTabBar = function (pageCtx) {
    if (typeof pageCtx?.getTabBar === 'function') {
      return pageCtx.getTabBar()?.$taroInstances;
    }
  };
  taro.getRenderer = function () {
    return taro.getCurrentInstance?.()?.page?.renderer ?? 'webview';
  };
}
