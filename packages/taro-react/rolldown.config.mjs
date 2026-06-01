import { defineConfig } from 'rolldown';

const externalPackages = ['@spcsn/taro-runtime', '@spcsn/taro-shared', 'react', 'react-reconciler'];
const external = (id) => externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));

export default defineConfig({
  input: 'src/index.ts',
  external,
  transform: {
    target: 'es2015',
  },
  output: {
    sourcemap: true,
    format: 'es',
    file: 'dist/react.esm.js',
  },
});
