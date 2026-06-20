declare const wx: Record<string, unknown> | undefined;

import { processApis } from './runtime';

const needPromiseApis = new Set([
  'addFileToFavorites',
  'addVideoToFavorites',
  'authPrivateMessage',
  'checkIsAddedToMyMiniProgram',
  'chooseContact',
  'cropImage',
  'disableAlertBeforeUnload',
  'editImage',
  'enableAlertBeforeUnload',
  'getBackgroundFetchData',
  'getChannelsLiveInfo',
  'getChannelsLiveNoticeInfo',
  'getFuzzyLocation',
  'getGroupEnterInfo',
  'getLocalIPAddress',
  'getShareInfo',
  'getUserProfile',
  'getWeRunData',
  'join1v1Chat',
  'openChannelsActivity',
  'openChannelsEvent',
  'openChannelsLive',
  'openChannelsUserProfile',
  'openCustomerServiceChat',
  'openVideoEditor',
  'saveFileToDisk',
  'scanItem',
  'setEnable1v1Chat',
  'setWindowSize',
  'sendBizRedPacket',
  'startFacialRecognitionVerify',
]);

function initWeappNativeApiFallback(taro: Record<string, unknown>): void {
  if (typeof wx === 'undefined' || typeof taro.addInterceptor === 'function') return;

  processApis(taro, wx, {
    needPromiseApis,
    modifyApis(apis) {
      apis.delete('lanDebug');
    },
    transformMeta(api, options) {
      if (api === 'showShareMenu') {
        const showShareItems = options.showShareItems as string[] | undefined;
        options.menus = showShareItems?.map((item) =>
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
  taro.getTabBar = function (pageCtx: Record<string, unknown>) {
    const getTabBar = pageCtx.getTabBar as (() => { $taroInstances?: unknown } | null | undefined) | undefined;
    if (typeof getTabBar === 'function') {
      return getTabBar()?.$taroInstances;
    }
  };
  taro.getRenderer = function () {
    const getCurrentInstance = taro.getCurrentInstance as () => { page?: { renderer?: string } } | undefined;
    return getCurrentInstance?.()?.page?.renderer ?? 'webview';
  };
}

export { initWeappNativeApiFallback };
