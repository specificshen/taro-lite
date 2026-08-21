import type { Func, IPostcssOption, IPxTransformOption } from '@spcsn/taro/types/compile';
import postcssPxTransform from '../style-transforms/px-transform';

export const getDefaultPostcssConfig = function ({
  designWidth,
  deviceRatio,
  postcssOption = {} as IPostcssOption<'mini'>,
}: {
  designWidth: number | ((size?: string | number) => number);
  deviceRatio: Record<string, number>;
  postcssOption?: IPostcssOption<'mini'>;
}): [string, { enable?: boolean; config?: Record<string, unknown> | IPxTransformOption } | undefined, Func?][] {
  // autoprefixer 已移除：CSS 经 LightningCSS 按固定 targets 降级与补前缀，无需 postcss 再跑一遍
  const {
    autoprefixer: _autoprefixer,
    pxtransform = {},
    cssModules: _cssModules,
    htmltransform: _htmltransform,
    ...options
  } = postcssOption;

  if (designWidth) {
    pxtransform.config!.designWidth = designWidth;
  }

  if (deviceRatio) {
    pxtransform.config!.deviceRatio = deviceRatio;
  }

  return [['postcss-pxtransform', pxtransform, postcssPxTransform], ...Object.entries(options)];
};
