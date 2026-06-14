declare const wx: any;

import { processApis } from '@spcsn/taro-shared';

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

function initWeappNativeApiFallback(taro: Record<string, any>): void {
  if (typeof wx === 'undefined' || typeof taro.addInterceptor === 'function') return;

  processApis(taro, wx, {
    needPromiseApis,
    modifyApis(apis) {
      apis.delete('lanDebug');
    },
    transformMeta(api, options) {
      if (api === 'showShareMenu') {
        options.menus = options.showShareItems?.map((item: string) =>
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
  taro.getTabBar = function (pageCtx: any) {
    if (typeof pageCtx?.getTabBar === 'function') {
      return pageCtx.getTabBar()?.$taroInstances;
    }
  };
  taro.getRenderer = function () {
    return taro.getCurrentInstance()?.page?.renderer ?? 'webview';
  };
}

export { initWeappNativeApiFallback };
