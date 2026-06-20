import { isObject } from '../type-guards';

interface TaroApi {
  config?: PxTransformConfig;
}

interface PxTransformConfig {
  designWidth?: number | ((size: number) => number);
  deviceRatio?: Record<number, number>;
  baseFontSize?: number;
  targetUnit?: string;
  unitPrecision?: number;
}

export function Behavior(options: Record<string, unknown>): Record<string, unknown> {
  return options;
}

export function getPreload(current: { preloadData?: unknown }) {
  return function (key: string | Record<string, unknown>, val: unknown) {
    current.preloadData = isObject(key)
      ? key
      : {
          [key]: val,
        };
  };
}

const defaultDesignWidth = 750;
const defaultDesignRatio: Record<number, number> = {
  640: 2.34 / 2,
  750: 1,
  828: 1.81 / 2,
};
const defaultBaseFontSize = 20;
const defaultUnitPrecision = 5;
const defaultTargetUnit = 'rpx';

export function getInitPxTransform(taro: TaroApi) {
  return function (config: PxTransformConfig) {
    const {
      designWidth = defaultDesignWidth,
      deviceRatio = defaultDesignRatio,
      baseFontSize = defaultBaseFontSize,
      targetUnit = defaultTargetUnit,
      unitPrecision = defaultUnitPrecision,
    } = config;
    if (!taro.config) {
      taro.config = {};
    }
    const taroConfig = taro.config;
    taroConfig.designWidth = designWidth;
    taroConfig.deviceRatio = deviceRatio;
    taroConfig.baseFontSize = baseFontSize;
    taroConfig.targetUnit = targetUnit;
    taroConfig.unitPrecision = unitPrecision;
  };
}

export function getPxTransform(taro: TaroApi) {
  return function (size: number) {
    const config = taro.config || {};
    const baseFontSize = config.baseFontSize;
    const deviceRatio = config.deviceRatio || defaultDesignRatio;
    const designWidth =
      typeof config.designWidth === 'function' ? config.designWidth(size) : config.designWidth || defaultDesignWidth;
    if (!(designWidth in deviceRatio)) {
      throw new Error(`deviceRatio 配置中不存在 ${designWidth} 的设置！`);
    }
    const targetUnit = config.targetUnit || defaultTargetUnit;
    const unitPrecision = config.unitPrecision || defaultUnitPrecision;
    const formatSize = ~~size;
    let rootValue = 1 / deviceRatio[designWidth];
    switch (targetUnit) {
      case 'rem':
        rootValue *= (baseFontSize || defaultBaseFontSize) * 2;
        break;
      case 'px':
        rootValue *= 2;
        break;
    }
    let val = formatSize / rootValue;
    if (unitPrecision >= 0 && unitPrecision <= 100) {
      val = Number(val.toFixed(unitPrecision));
    }
    return val + targetUnit;
  };
}
