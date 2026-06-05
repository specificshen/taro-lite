// @ts-nocheck
const path = require('node:path');
const { TaroPlatformBase } = require('@spcsn/taro-service');
const { components } = require('./components');
const { Template } = require('./template');

class Weapp extends TaroPlatformBase {
  template: Template;
  platform = 'weapp';
  globalObject = 'wx';
  projectConfigJson: string = this.config.projectConfigName || 'project.config.json';
  runtimePath: string;
  taroComponentsPath: string;
  fileType = {
    templ: '.wxml',
    style: '.wxss',
    config: '.json',
    script: '.js',
    xs: '.wxs',
  };

  /**
   * 1. setupTransaction - init
   * 2. setup
   * 3. setupTransaction - close
   * 4. buildTransaction - init
   * 5. build
   * 6. buildTransaction - close
   */
  constructor(ctx, config, pluginOptions?: IOptions) {
    super(ctx, config);
    const platformDirectory = path.dirname(ctx.path);
    this.runtimePath = path.join(platformDirectory, 'runtime');
    this.taroComponentsPath = path.join(platformDirectory, 'components-react');
    this.template = new Template(pluginOptions);
    // Skyline / glass-easel 默认配置（用户可在 project config 中覆盖）
    this.config = {
      renderer: 'skyline',
      componentFramework: 'glass-easel',
      lazyCodeLoading: 'requiredComponents',
      style: 'v2',
      ...this.config,
    };
    this.setupTransaction.addWrapper({
      close: () => {
        this.modifyTemplate(pluginOptions);
      },
    });
  }

  /**
   * 增加组件或修改组件属性
   */
  modifyTemplate(pluginOptions?: IOptions) {
    const template = this.template;
    template.mergeComponents(this.ctx, components);
    template.voidElements.add('voip-room');
    template.voidElements.add('native-slot');
    template.focusComponents.add('editor');
    if (pluginOptions?.enablekeyboardAccessory) {
      template.voidElements.delete('input');
      template.voidElements.delete('textarea');
    }
  }
}

module.exports.default = Weapp;
