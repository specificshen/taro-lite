import { recursiveMerge } from '@spcsn/taro-helper';
import { describe, expect, it } from 'vitest';
import { componentConfig } from '../../taro-mini-runner/src/shared/component';
import { components } from '../src/platform-weapp/components';
import { Template } from '../src/platform-weapp/template';

describe('微信小程序模板', () => {
  it('默认包含运行时可能创建的内置组件模板', () => {
    const template = new Template();
    template.mergeComponents({ helper: { recursiveMerge } }, components);

    const content = template.buildTemplate(componentConfig);

    ['swiper', 'swiper-item', 'button', 'page-container', 'root-portal'].forEach((componentName) => {
      expect(content).toContain(`<${componentName} `);
    });
  });
});
