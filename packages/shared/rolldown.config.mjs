import { defineConfig } from 'rolldown';

const baseOutput = {
  sourcemap: true,
  exports: 'named',
};

export default defineConfig([
  {
    input: 'src/index.ts',
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
    transform: {
      target: 'es2015',
    },
    output: {
      ...baseOutput,
      file: 'dist/index.cjs',
      format: 'cjs',
    },
  },
  {
    input: 'src/index.ts',
    transform: {
      target: 'es2015',
    },
    output: {
      ...baseOutput,
      file: 'dist/shared.esm.js',
      format: 'es',
    },
  },
  {
    input: 'src/template.ts',
    transform: {
      target: 'es2015',
    },
    output: {
      ...baseOutput,
      file: 'dist/template.js',
      format: 'es',
    },
  },
  {
    input: 'src/template.ts',
    transform: {
      target: 'es2015',
    },
    output: {
      ...baseOutput,
      file: 'dist/template.cjs',
      format: 'cjs',
    },
  },
]);
