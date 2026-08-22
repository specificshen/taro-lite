import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type IPluginContext, TaroPlatformBase, type TConfig } from '../internal/kernel';

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
    this.projectConfigJson = (this.config.projectConfigName as string | undefined) || 'project.config.json';

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
    // Skyline 属性绑定是响应式的，input/textarea 的 focus 直接动态绑定即可，
    // 不再继承 webview 时代的 focus/blur 双模板（一切换就销毁重建原生节点，
    // 光标与内部滚动位置丢失）。editor 使用率低且未验证，保留双模板。
    this.template.focusComponents = new Set(['editor']);
  }
}

export default Weapp;
