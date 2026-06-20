import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type IPluginContext, TaroPlatformBase, type TConfig } from '../internal/taro-service';

const __filename = fileURLToPath(import.meta.url);

import { components } from './components';
import { Template } from './template';

class Weapp extends TaroPlatformBase {
  template: Template;
  platform = 'weapp';
  globalObject = 'wx';
  projectConfigJson: string;
  runtimePath: string;
  taroComponentsPath: string;
  fileType = {
    templ: '.wxml',
    style: '.wxss',
    config: '.json',
    script: '.js',
    xs: '.wxs',
  };

  constructor(ctx: IPluginContext, config: TConfig) {
    super(ctx, config);
    const platformDirectory = path.dirname(ctx.path ?? __filename);
    this.runtimePath = path.join(platformDirectory, 'runtime');
    this.taroComponentsPath = path.join(platformDirectory, 'components-react');
    this.template = new Template();
    this.projectConfigJson = this.config.projectConfigName || 'project.config.json';

    this.config = {
      renderer: 'skyline',
      componentFramework: 'glass-easel',
      lazyCodeLoading: 'requiredComponents',
      style: 'v2',
      ...this.config,
    };

    this.setupTransaction.addWrapper({
      close: () => this.modifyTemplate(),
    });
  }

  modifyTemplate(): void {
    this.template.mergeComponents(this.ctx, components);
    this.template.voidElements.add('voip-room');
    this.template.voidElements.add('native-slot');
    this.template.focusComponents.add('editor');
  }
}

export default Weapp;
