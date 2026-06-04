import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import * as components from '../src/platform-weapp/components-react';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('components-react entry', () => {
  it('exports mini component tag names without resolving through the aliased package entry', () => {
    expect(components).toMatchObject({
      View: 'view',
      Text: 'text',
      Image: 'image',
      Swiper: 'swiper',
      SwiperItem: 'swiper-item',
      Button: 'button',
      ScrollView: 'scroll-view',
      PageContainer: 'page-container',
      RootPortal: 'root-portal',
    });

    const source = fs.readFileSync(path.join(packageRoot, 'src/platform-weapp/components-react.ts'), 'utf8');
    expect(source).not.toContain("from '@spcsn/taro-components'");
  });
});
