import Taro from '@spcsn/taro';
import { useEffect, useState } from 'react';

interface WechatApi {
  getMenuButtonBoundingClientRect?: () => {
    bottom: number;
    height: number;
    left: number;
    right: number;
    top: number;
    width: number;
  };
}

declare const wx: WechatApi;

export interface SafeAreaInfo {
  statusBarHeight: number;
  navBarHeight: number;
  screenWidth: number;
  screenHeight: number;
  safeAreaBottom: number;
  menuButtonTop: number;
  menuButtonHeight: number;
  menuButtonWidth: number;
  menuButtonLeft: number;
  menuButtonRight: number;
}

export function useSafeArea(): SafeAreaInfo {
  const [info, setInfo] = useState<SafeAreaInfo>({
    statusBarHeight: 20,
    navBarHeight: 44,
    screenWidth: 375,
    screenHeight: 812,
    safeAreaBottom: 0,
    menuButtonTop: 24,
    menuButtonHeight: 32,
    menuButtonWidth: 88,
    menuButtonLeft: 280,
    menuButtonRight: 368,
  });

  useEffect(() => {
    try {
      const windowInfo = typeof Taro.getWindowInfo === 'function' ? Taro.getWindowInfo() : Taro.getSystemInfoSync();

      let menuButtonInfo = { bottom: 58, top: 24, height: 32, width: 88, left: 280, right: 368 };
      if (typeof wx !== 'undefined' && wx.getMenuButtonBoundingClientRect) {
        try {
          menuButtonInfo = wx.getMenuButtonBoundingClientRect();
        } catch {
          // ignore
        }
      }

      const calcNavBarHeight = (menuButtonInfo.top - windowInfo.statusBarHeight) * 2 + menuButtonInfo.height;

      const safeAreaBottom =
        (windowInfo.safeArea?.bottom ? windowInfo.screenHeight - windowInfo.safeArea.bottom : 0) || 0;

      setInfo({
        statusBarHeight: windowInfo.statusBarHeight || 20,
        navBarHeight: calcNavBarHeight || 44,
        screenWidth: windowInfo.screenWidth || 375,
        screenHeight: windowInfo.screenHeight || 812,
        safeAreaBottom,
        menuButtonTop: menuButtonInfo.top || 24,
        menuButtonHeight: menuButtonInfo.height || 32,
        menuButtonWidth: menuButtonInfo.width || 88,
        menuButtonLeft: menuButtonInfo.left || 280,
        menuButtonRight: menuButtonInfo.right || 368,
      });
    } catch {
      // fallback defaults already set
    }
  }, []);

  return info;
}
