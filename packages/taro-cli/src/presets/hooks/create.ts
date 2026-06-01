import * as hooks from '../constant';

import type { IPluginContext } from '@spcsn/taro-service';

export default (ctx: IPluginContext) => {
  [hooks.MODIFY_CREATE_TEMPLATE].forEach((methodName) => {
    ctx.registerMethod(methodName);
  });
};
