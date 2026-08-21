import type { IPluginContext } from '../../internal/kernel';
import * as hooks from '../constant/hooks';

export default (ctx: IPluginContext) => {
  const methods = [
    hooks.MODIFY_APP_CONFIG,
    hooks.MODIFY_VITE_CONFIG,
    hooks.MODIFY_BUILD_ASSETS,
    hooks.MODIFY_MINI_CONFIGS,
    hooks.ON_BUILD_START,
    hooks.ON_BUILD_FINISH,
    hooks.ON_BUILD_COMPLETE,
    hooks.MODIFY_RUNNER_OPTS,
  ];

  for (const methodName of methods) {
    ctx.registerMethod(methodName);
  }
};
