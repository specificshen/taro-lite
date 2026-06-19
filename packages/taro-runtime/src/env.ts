import { EMPTY_OBJ } from './shared-primitives';
import type { TaroDocument } from './dom/document';

interface Env {
  window: any;
  document: TaroDocument;
}

const env: Env = {
  window: EMPTY_OBJ,
  document: EMPTY_OBJ,
};

export default env;
