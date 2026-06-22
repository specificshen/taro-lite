import type { Func, IPostcssOption, IPxTransformOption } from '@spcsn/taro/types/compile';
import autoprefixerPlugin from 'autoprefixer';
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
  const {
    autoprefixer,
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

  return [
    ['autoprefixer', autoprefixer, autoprefixerPlugin],
    ['postcss-pxtransform', pxtransform, postcssPxTransform],
    ...Object.entries(options),
  ];
};
