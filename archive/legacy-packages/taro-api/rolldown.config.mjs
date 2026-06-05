import { defineConfig } from 'rolldown';

const external = ['@spcsn/taro-runtime', '@spcsn/taro-shared'];

const baseOutput = {
  sourcemap: true,
  exports: 'named',
};

export default defineConfig([
  {
    input: 'src/index.ts',
    external,
    transform: {
      target: 'es2015',
    },
    output: {
      ...baseOutput,
      dir: 'dist',
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
  },
  {
    input: 'src/index.ts',
    external,
    transform: {
      target: 'es2015',
    },
    output: {
      ...baseOutput,
      file: 'dist/index.cjs.js',
      format: 'cjs',
      codeSplitting: false,
    },
  },
  {
    input: 'src/index.ts',
    external,
    transform: {
      target: 'es2015',
    },
    output: {
      ...baseOutput,
      file: 'dist/taro.js',
      format: 'umd',
      codeSplitting: false,
      name: 'Taro',
      globals: {
        '@spcsn/taro-runtime': 'runtime',
        '@spcsn/taro-shared': 'shared',
      },
    },
  },
  {
    input: 'src/index.ts',
    external,
    transform: {
      target: 'es2015',
    },
    output: {
      ...baseOutput,
      file: 'dist/index.esm.js',
      format: 'es',
      codeSplitting: false,
    },
  },
]);
