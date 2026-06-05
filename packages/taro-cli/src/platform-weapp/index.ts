// @ts-nocheck
const Weapp = require('./program').default;

const platformWeappPlugin = (ctx, options) => {
  ctx.registerPlatform({
    name: 'weapp',
    useConfigName: 'mini',
    async fn({ config }) {
      const program = new Weapp(ctx, config, options || {});
      await program.start();
    },
  });
};

// 让其它平台插件可以继承此平台
module.exports = platformWeappPlugin;
module.exports.default = platformWeappPlugin;
module.exports.Weapp = Weapp;
