import { defineConfig } from 'rolldown';

const externalPackages = ['@spcsn/taro-shared', 'react'];
const external = (id) => externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));

const runtimeDefines = {
  ENABLE_CLONE_NODE: 'false',
  ENABLE_CONTAINS: 'false',
  ENABLE_SIZE_APIS: 'false',
  ENABLE_TEMPLATE_CONTENT: 'false',
  ENABLE_MUTATION_OBSERVER: 'false',
};

const definePlugin = {
  name: 'runtime-define',
  transform(code) {
    const lines = code.split('\n');
    let changed = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('declare const')) continue;
      for (const [key, value] of Object.entries(runtimeDefines)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        if (regex.test(line)) {
          lines[i] = line.replace(regex, value);
          changed = true;
        }
      }
    }
    return changed ? { code: lines.join('\n'), map: { mappings: '' } } : null;
  },
};

export default defineConfig({
  input: {
    index: 'src/index.ts',
    'runtime/index': 'src/runtime/index.ts',
  },
  external,
  plugins: [definePlugin],
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
    exports: 'auto',
  },
});
