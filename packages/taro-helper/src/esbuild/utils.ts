import { resolve } from 'node:path';

export function externalEsbuildModule({
  path,
  namespace,
  importer,
  pluginData,
}: {
  path?: string;
  namespace?: string;
  importer?: string;
  pluginData?: unknown;
}) {
  if (namespace === 'file' && importer && path) {
    path = resolve(importer, path);
  }
  return {
    path,
    namespace,
    pluginData,
    external: true,
  };
}
