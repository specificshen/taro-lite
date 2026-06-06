import { useState, useEffect } from 'react';
import Taro from '@spcsn/taro';

declare const wx: any;

export interface SafeAreaInfo {
  statusBarHeight: number;
  navBarHeight: number;
  screenWidth: number;
  screenHeight: number;
  safeAreaBottom: number;
}

export function useSafeArea(): SafeAreaInfo {
  const [info, setInfo] = useState<SafeAreaInfo>({
    statusBarHeight: 20,
    navBarHeight: 44,
    screenWidth: 375,
    screenHeight: 812,
    safeAreaBottom: 0,
  });

  useEffect(() => {
    try {
      const windowInfo = (Taro as any).getWindowInfo
        ? (Taro as any).getWindowInfo()
        : Taro.getSystemInfoSync();

      let menuButtonInfo = { bottom: 58, top: 24, height: 32 };
      if (typeof wx !== 'undefined' && wx.getMenuButtonBoundingClientRect) {
        try {
          menuButtonInfo = wx.getMenuButtonBoundingClientRect();
        } catch {
          // ignore
        }
      }

      const calcNavBarHeight =
        (menuButtonInfo.top - windowInfo.statusBarHeight) * 2 + menuButtonInfo.height;

      const safeAreaBottom =
        (windowInfo.safeArea?.bottom
          ? windowInfo.screenHeight - windowInfo.safeArea.bottom
          : 0) || 0;

      setInfo({
        statusBarHeight: windowInfo.statusBarHeight || 20,
        navBarHeight: calcNavBarHeight || 44,
        screenWidth: windowInfo.screenWidth || 375,
        screenHeight: windowInfo.screenHeight || 812,
        safeAreaBottom,
      });
    } catch {
      // fallback defaults already set
    }
  }, []);

  return info;
}
