import type * as React from 'react';
import { EMPTY_OBJ } from '../../../taro-shared';

interface ReactMeta {
  PageContext: React.Context<string>;
  R: typeof React;
}

export const reactMeta: ReactMeta = {
  PageContext: EMPTY_OBJ as React.Context<string>,
  R: EMPTY_OBJ as typeof React,
};
