const WeappPlatform = require('./program').default;

interface PlatformPluginContext {
  registerPlatform(platform: {
    name: string;
    useConfigName: string;
    fn(params: { config: unknown }): Promise<void>;
  }): void;
}

const platformWeappPlugin = (ctx: PlatformPluginContext, options: Record<string, unknown> = {}) => {
  ctx.registerPlatform({
    name: 'weapp',
    useConfigName: 'mini',
    async fn({ config }) {
      const program = new WeappPlatform(ctx, config, options || {});
      await program.start();
    },
  });
};

// 让其它平台插件可以继承此平台
module.exports = platformWeappPlugin;
module.exports.default = platformWeappPlugin;
module.exports.Weapp = WeappPlatform;
