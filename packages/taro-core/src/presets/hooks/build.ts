import type { IPluginContext } from '@spcsn/taro-service';
import * as hooks from '../constant/hooks.js';

export default (ctx: IPluginContext) => {
  const methods = [
    hooks.MODIFY_APP_CONFIG,
    hooks.MODIFY_VITE_CONFIG,
    hooks.MODIFY_BUILD_ASSETS,
    hooks.MODIFY_MINI_CONFIGS,
    hooks.MODIFY_COMPONENT_CONFIG,
    hooks.ON_PARSE_CREATE_ELEMENT,
    hooks.ON_BUILD_START,
    hooks.ON_BUILD_FINISH,
    hooks.ON_BUILD_COMPLETE,
    hooks.MODIFY_RUNNER_OPTS,
  ];

  for (const methodName of methods) {
    ctx.registerMethod(methodName);
  }
};
