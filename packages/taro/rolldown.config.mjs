import { defineConfig } from 'rolldown';

const externalPackages = ['react'];
const external = (id) => externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));

const runtimeDefines = {
  ENABLE_CLONE_NODE: 'false',
  ENABLE_CONTAINS: 'false',
  ENABLE_SIZE_APIS: 'false',
  ENABLE_TEMPLATE_CONTENT: 'false',
  ENABLE_MUTATION_OBSERVER: 'false',
};

export default defineConfig({
  input: {
    index: 'src/index.ts',
    'runtime/index': 'src/runtime/index.ts',
  },
  external,
  transform: {
    define: runtimeDefines,
  },
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
  },
});
