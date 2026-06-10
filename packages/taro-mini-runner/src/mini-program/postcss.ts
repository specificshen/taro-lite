import autoprefixerPlugin from 'autoprefixer';
import type { Func, IPostcssOption } from '@spcsn/taro/types/compile';
import postcssHtmlTransform from '../style-transforms/html-transform';
import postcssPxTransform from '../style-transforms/px-transform';

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
    ['autoprefixer', autoprefixer, autoprefixerPlugin],
    ['postcss-pxtransform', pxtransform, postcssPxTransform],
    ['postcss-html-transform', htmltransform, postcssHtmlTransform],
    ...Object.entries(options),
  ];
};
