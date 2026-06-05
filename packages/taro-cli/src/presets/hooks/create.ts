import * as hooks from '../constant/hooks.js';

import type { IPluginContext } from '@spcsn/taro-service';

export default (ctx: IPluginContext) => {
  [hooks.MODIFY_CREATE_TEMPLATE].forEach((methodName) => {
    ctx.registerMethod(methodName);
  });
};
