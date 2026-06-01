import { EMPTY_OBJ } from '@spcsn/taro-shared';

import type React from 'react';

interface ReactMeta {
  PageContext: React.Context<string>;
  R: typeof React;
}

export const reactMeta: ReactMeta = {
  PageContext: EMPTY_OBJ,
  R: EMPTY_OBJ,
};
