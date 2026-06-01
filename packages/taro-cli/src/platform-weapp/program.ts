// @ts-nocheck
import path from 'node:path';

import { TaroPlatformBase } from '@spcsn/taro-service';

import { components } from './components';
import { Template } from './template';

import type { IOptions } from './index';

export default class Weapp extends TaroPlatformBase {
  template: Template;
  platform = 'weapp';
  globalObject = 'wx';
  projectConfigJson: string = this.config.projectConfigName || 'project.config.json';
  runtimePath = path.join(__dirname, 'runtime');
  taroComponentsPath = path.join(__dirname, 'components-react');
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
        this.modifyWebpackConfig();
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

  /**
   * 修改 Webpack 配置
   */
  modifyWebpackConfig() {
    this.ctx.modifyWebpackChain(({ chain }) => {
      // 解决微信小程序 sourcemap 映射失败的问题，#9412
      chain.output.devtoolModuleFilenameTemplate((info) => {
        const resourcePath = info.resourcePath.replace(/[/\\]/g, '_');
        return `webpack://${info.namespace}/${resourcePath}`;
      });
    });
  }
}
