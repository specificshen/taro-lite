import { defineConfig } from 'rolldown';

const externalPackages = ['@spcsn/taro-runtime', 'react'];
const external = (id) => externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));

export default defineConfig({
  input: 'src/index.ts',
  external,
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'auto',
  },
});
