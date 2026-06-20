import { UnRecursiveTemplate } from '@spcsn/taro/runtime';

type MiniComponents = Record<string, Record<string, string>>;

type ComponentAlias = {
  _num?: string;
  mapkey?: string;
};

type PageTemplateData = {
  content?: {
    enablePageMeta?: boolean;
  };
};

export class Template extends UnRecursiveTemplate {
  supportXS = true;
  Adapter = {
    if: 'wx:if',
    else: 'wx:else',
    elseif: 'wx:elif',
    for: 'wx:for',
    forItem: 'wx:for-item',
    forIndex: 'wx:for-index',
    key: 'wx:key',
    xs: 'wxs',
    type: 'weapp',
  };

  transferComponents: Record<string, Record<string, string>> = {};

  constructor() {
    super();
    this.nestElements.set('root-portal', 3);
  }

  buildXsTemplate(filePath = './utils'): string {
    return `<wxs module="xs" src="${filePath}.wxs" />`;
  }

  createMiniComponents(components: MiniComponents): MiniComponents {
    const result = super.createMiniComponents(components);
    this.transferComponents['page-meta'] = result['page-meta'];
    this.transferComponents['navigation-bar'] = result['navigation-bar'];
    delete result['page-meta'];
    delete result['navigation-bar'];
    return result;
  }

  replacePropName(name: string, value: string, componentName: string, componentAlias: ComponentAlias): string {
    if (value === 'eh') {
      const lower = name.toLowerCase();
      return lower === 'bindlongtap' && componentName !== 'canvas' ? 'bindlongpress' : lower;
    }
    if (componentName === 'share-element') {
      const mapKeyAlias = componentAlias.mapkey;
      if (mapKeyAlias && value === `i.${mapKeyAlias}`) return 'key';
    }
    return name;
  }

  buildPageTemplate = (baseTempPath: string, page?: PageTemplateData): string => {
    let pageMetaTemplate = '';

    if (page?.content?.enablePageMeta) {
      const getAttrs = (name: string, dataPath: string): string => {
        const component = this.transferComponents[name];
        if (!component) return '';
        return Object.entries(component).reduce((sum, [key, value]) => {
          const attrValue = value === 'eh' ? value : `{{${value.replace('i.', dataPath)}}}`;
          return `${sum}${key}="${attrValue}" `;
        }, '');
      };

      pageMetaTemplate = `
<wxs module="xs" src="${baseTempPath.replace('base.wxml', 'utils.wxs')}" />
<page-meta data-sid="{{pageMeta.sid}}" ${getAttrs('page-meta', 'pageMeta.')}>
  <navigation-bar ${getAttrs('navigation-bar', 'navigationBar.')}/>
</page-meta>`;
    }

    return `<import src="${baseTempPath}"/>${pageMetaTemplate}
<template is="taro_tmpl" data="{{${this.dataKeymap('root:root')}}}" />`;
  };
}
