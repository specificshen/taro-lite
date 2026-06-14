import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as components from '../src/index';
import { MINI_APP_TYPES } from '../scripts/constants';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readPackageFile = (filePath: string) => fs.readFileSync(path.join(packageRoot, filePath), 'utf8');

const weappComponentTags: Record<string, string> = {
  Ad: 'ad',
  AdCustom: 'ad-custom',
  Block: 'block',
  Button: 'button',
  Camera: 'camera',
  Canvas: 'canvas',
  Checkbox: 'checkbox',
  CheckboxGroup: 'checkbox-group',
  CoverImage: 'cover-image',
  CoverView: 'cover-view',
  CustomWrapper: 'custom-wrapper',
  Editor: 'editor',
  Form: 'form',
  Icon: 'icon',
  Image: 'image',
  Input: 'input',
  Label: 'label',
  Map: 'map',
  MovableArea: 'movable-area',
  MovableView: 'movable-view',
  Navigator: 'navigator',
  OfficialAccount: 'official-account',
  OpenData: 'open-data',
  PageMeta: 'page-meta',
  Picker: 'picker',
  PickerView: 'picker-view',
  PickerViewColumn: 'picker-view-column',
  Progress: 'progress',
  Radio: 'radio',
  RadioGroup: 'radio-group',
  RichText: 'rich-text',
  RootPortal: 'root-portal',
  ScrollView: 'scroll-view',
  Slider: 'slider',
  Swiper: 'swiper',
  SwiperItem: 'swiper-item',
  Switch: 'switch',
  Text: 'text',
  Textarea: 'textarea',
  Video: 'video',
  View: 'view',
  WebView: 'web-view',
};

const unsupportedComponents = [
  'AnimationVideo',
  'AnimationView',
  'ArCamera',
  'AwemeData',
  'CommentDetail',
  'CommentList',
  'ContactButton',
  'FollowSwan',
  'InlinePaymentPanel',
  'Lifestyle',
  'Like',
  'Login',
  'Lottie',
  'OpenEmbeddedAtomicservice',
  'RtcRoom',
  'RtcRoomItem',
  'TabItem',
  'Tabs',
];

describe('component entry', () => {
  it('exports React-facing WeChat mini program component tag names', () => {
    expect(components).toMatchObject(weappComponentTags);

    for (const value of Object.values(components)) {
      expect(value).toMatch(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
    }
  });

  it('does not expose components for other mini program vendors', () => {
    for (const component of unsupportedComponents) {
      expect(components).not.toHaveProperty(component);
    }
  });
});

describe('package support boundary', () => {
  it('generates schema-backed types for WeChat mini program only', () => {
    expect(MINI_APP_TYPES).toEqual(['weapp']);
  });

  it('publishes the built TypeScript runtime and React type entry', () => {
    const packageJson = JSON.parse(readPackageFile('package.json'));

    expect(packageJson.main).toBe('dist/index.js');
    expect(packageJson.module).toBeUndefined();
    expect(packageJson.types).toBe('types/index.d.ts');
    expect(packageJson.exports['.'].import).toBe('./dist/index.js');
    expect(packageJson.exports['.'].require).toBe('./dist/index.js');
    expect(packageJson.exports['.'].default).toBe('./dist/index.js');
    expect(packageJson.exports['./mini']).toBeUndefined();
    expect(packageJson.browser).toBeUndefined();
    expect(packageJson['main:h5']).toBeUndefined();
    expect(packageJson.collection).toBeUndefined();
    expect(packageJson.files).toEqual(['dist', 'types', 'global.css']);
  });

  it('uses Vitest instead of the old Stencil/Jest runner', () => {
    const packageJson = JSON.parse(readPackageFile('package.json'));
    const serializedScripts = JSON.stringify(packageJson.scripts);
    const serializedDependencies = JSON.stringify({
      dependencies: packageJson.dependencies,
      devDependencies: packageJson.devDependencies,
    });

    expect(packageJson.scripts.test).toBe('vitest run');
    expect(serializedScripts).not.toMatch(/stencil test|jest|puppeteer/);
    expect(serializedDependencies).not.toMatch(/@stencil\/core|jest|puppeteer|hls\.js|swiper/);
  });

  it('keeps the public type entry free of non-WeChat component exports', () => {
    const typeEntry = readPackageFile('types/index.d.ts');

    for (const component of unsupportedComponents) {
      expect(typeEntry).not.toContain(component);
      expect(fs.existsSync(path.join(packageRoot, `types/${component}.d.ts`))).toBe(false);
    }
    expect(fs.existsSync(path.join(packageRoot, 'types/index.vue3.d.ts'))).toBe(false);
    expect(fs.existsSync(path.join(packageRoot, 'types/index.solid.d.ts'))).toBe(false);
  });
});
