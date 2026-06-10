import type { Config } from '@swc/core';

type SwcOnlyMatcher = string | RegExp | ((filename: string) => boolean);
type SwcPlugin = [string, Record<string, unknown>];

type SwcRegisterConfig = Config & {
  only: SwcOnlyMatcher[];
  jsc: NonNullable<Config['jsc']> & {
    experimental?: {
      plugins: SwcPlugin[];
    };
  };
};

interface ICreateSwcRegisterParam {
  only: SwcOnlyMatcher[];
  plugins?: SwcPlugin[];
}

export default function createSwcRegister({ only, plugins }: ICreateSwcRegisterParam) {
  const config: SwcRegisterConfig = {
    only: Array.from(new Set([...only])),
    jsc: {
      parser: {
        syntax: 'typescript',
        decorators: true,
      },
      transform: {
        legacyDecorator: true,
      },
    },
    module: {
      type: 'commonjs',
    },
  };

  if (plugins) {
    config.jsc.experimental = {
      plugins,
    };
  }

  require('@swc/register')(config);
}
