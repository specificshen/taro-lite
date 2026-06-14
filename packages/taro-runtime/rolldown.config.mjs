import { defineConfig } from 'rolldown';

const external = ['@spcsn/taro-shared'];

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
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].js',
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
      file: 'dist/index.cjs',
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
      file: 'dist/runtime.esm.js',
      format: 'es',
      codeSplitting: false,
    },
  },
]);
