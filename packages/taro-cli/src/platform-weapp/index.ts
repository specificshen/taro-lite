import { type IPluginContext } from '../internal/taro-service';
import WeappPlatform from './program';

export default (ctx: IPluginContext) => {
  ctx.registerPlatform({
    name: 'weapp',
    useConfigName: 'mini',
    async fn({ config }) {
      await new WeappPlatform(ctx, config).start();
    },
  });
};

export { WeappPlatform };
