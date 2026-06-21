import { describe, expect, it } from 'vitest';
import { Template } from '../../../src/platform-weapp/template';

describe('Weapp Template', () => {
  it('uses weapp adapter syntax', () => {
    const template = new Template();
    expect(template.Adapter.if).toBe('wx:if');
    expect(template.Adapter.for).toBe('wx:for');
    expect(template.supportXS).toBe(true);
  });

  it('builds xs template with default path', () => {
    const template = new Template();
    expect(template.buildXsTemplate()).toBe('<wxs module="xs" src="./utils.wxs" />');
  });

  it('builds xs template with custom path', () => {
    const template = new Template();
    expect(template.buildXsTemplate('./common/utils')).toBe('<wxs module="xs" src="./common/utils.wxs" />');
  });

  it('replaces bindlongtap with bindlongpress except canvas', () => {
    const template = new Template();
    expect(template.replacePropName('bindLongtap', 'eh', 'view', {})).toBe('bindlongpress');
    expect(template.replacePropName('bindLongtap', 'eh', 'canvas', {})).toBe('bindlongtap');
  });

  it('builds page template with page meta enabled', () => {
    const template = new Template();
    template.transferComponents['page-meta'] = { 'background-color': 'i.bgColor' };
    template.transferComponents['navigation-bar'] = { title: 'i.title' };

    const result = template.buildPageTemplate('./base.wxml', { content: { enablePageMeta: true } });

    expect(result).toContain('<page-meta');
    expect(result).toContain('<navigation-bar');
    expect(result).toContain('<import src="./base.wxml"/>');
  });
});
