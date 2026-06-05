import { defineConfig } from 'rolldown';

const externalPackages = [
  '@spcsn/taro-helper',
  '@spcsn/taro-runtime',
  '@spcsn/taro-service',
  '@spcsn/taro-shared',
  '@spcsn/taro',
  '@vitejs/plugin-react',
  'acorn',
  'acorn-walk',
  'lodash',
  'react',
  'react-dom',
  'react-dom/client',
  'tslib',
  'vite',
];

const external = (id) =>
  id.startsWith('node:') || externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));

export default defineConfig([
  {
    input: 'src/index.ts',
    external,
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
  },
  {
    input: 'src/runtime/index.ts',
    external,
    output: {
      file: 'dist/runtime.js',
      format: 'es',
      sourcemap: true,
    },
  },
]);
