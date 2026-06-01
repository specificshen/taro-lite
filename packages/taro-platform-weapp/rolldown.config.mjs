import { defineConfig } from 'rolldown';

const externalPackages = ['@spcsn/taro-service', '@spcsn/taro-shared'];
const external = (id) => externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));

const baseOutput = {
  sourcemap: true,
};

export default defineConfig([
  {
    input: 'src/index.ts',
    external,
    output: {
      ...baseOutput,
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
    },
  },
  {
    input: 'src/runtime.ts',
    external,
    output: {
      ...baseOutput,
      file: 'dist/runtime.js',
      format: 'es',
    },
  },
  {
    input: 'src/runtime-utils.ts',
    external,
    output: {
      ...baseOutput,
      file: 'dist/runtime-utils.js',
      format: 'es',
    },
  },
  {
    input: 'src/components-react.ts',
    external,
    output: {
      ...baseOutput,
      file: 'dist/components-react.js',
      format: 'es',
    },
  },
]);
