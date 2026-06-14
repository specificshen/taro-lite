import autoprefixerPlugin from 'autoprefixer';
import type { Func, IPostcssOption } from '@spcsn/taro/types/compile';
import postcssPxTransform from '../style-transforms/px-transform';

export const getDefaultPostcssConfig = function ({
  designWidth,
  deviceRatio,
  postcssOption = {} as IPostcssOption<'mini'>,
}: {
  designWidth: any;
  deviceRatio: any;
  postcssOption?: IPostcssOption<'mini'>;
}): [string, any, Func?][] {
  const { autoprefixer, pxtransform = {}, ...options } = postcssOption;

  if (designWidth) {
    pxtransform.config!.designWidth = designWidth;
  }

  if (deviceRatio) {
    pxtransform.config!.deviceRatio = deviceRatio;
  }

  return [
    ['autoprefixer', autoprefixer, autoprefixerPlugin],
    ['postcss-pxtransform', pxtransform, postcssPxTransform],
    ...Object.entries(options),
  ];
};
