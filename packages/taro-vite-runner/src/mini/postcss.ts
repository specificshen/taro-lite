import type { Func, IPostcssOption } from '@spcsn/taro/types/compile';

export const getDefaultPostcssConfig = function ({
  designWidth,
  deviceRatio,
  postcssOption = {} as IPostcssOption<'mini'>,
}): [string, any, Func?][] {
  const { autoprefixer, pxtransform = {}, htmltransform, ...options } = postcssOption;

  if (designWidth) {
    pxtransform.config!.designWidth = designWidth;
  }

  if (deviceRatio) {
    pxtransform.config!.deviceRatio = deviceRatio;
  }

  return [
    ['autoprefixer', autoprefixer, require('autoprefixer')],
    ['postcss-pxtransform', pxtransform, require('@spcsn/postcss-pxtransform')],
    ['postcss-html-transform', htmltransform, require('@spcsn/postcss-html-transform')],
    ...Object.entries(options),
  ];
};
