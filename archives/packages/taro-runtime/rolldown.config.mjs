import { defineConfig } from 'rolldown';

const externalPackages = [];
const external = (id) => externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));

const baseOutput = {
  sourcemap: true,
  exports: 'named',
};

export default defineConfig([
  {
    input: 'src/index.ts',
    external,
    transform: {
      target: 'es2022',
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
      target: 'es2022',
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
      target: 'es2022',
    },
    output: {
      ...baseOutput,
      file: 'dist/runtime.esm.js',
      format: 'es',
      codeSplitting: false,
    },
  },
]);
