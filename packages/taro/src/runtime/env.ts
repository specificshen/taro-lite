import type { TaroWindow } from './bom/window';
import type { TaroDocument } from './dom/document';
import { EMPTY_OBJ, getGlobalSingleton } from './shared-primitives';

interface Env {
  window: TaroWindow;
  document: TaroDocument;
}

const env: Env = getGlobalSingleton('__TARO_ENV__', () => ({
  window: EMPTY_OBJ as unknown as TaroWindow,
  document: EMPTY_OBJ as unknown as TaroDocument,
}));

export default env;
