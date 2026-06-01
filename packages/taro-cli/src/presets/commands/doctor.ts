import {
  validateConfig,
  validateEnv,
  validateEslint,
  validatePackage,
  validateRecommend,
} from '../../doctor/validators';

import type { IPluginContext } from '@spcsn/taro-service';

export default (ctx: IPluginContext) => {
  ctx.registerCommand({
    name: 'doctor',
    optionsMap: {},
    synopsisList: ['taro doctor'],
    async fn() {
      await Promise.all([validateEnv(), validateConfig(), validatePackage(), validateRecommend(), validateEslint()]);
      console.log(ctx.helper.chalk.green('基础环境检查通过。'));
    },
  });
};
