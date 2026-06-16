import { describe, expect, it } from 'vitest';
import { hex4ToRgba, hex8ToRgba, transformWxss } from '../../src/style-transforms/wxss-compat';

describe('wxss-compat', () => {
  describe('hex8ToRgba', () => {
    it('converts 8-digit hex to rgba', () => {
      expect(hex8ToRgba('#111f2c8f')).toBe('rgba(17, 31, 44, 0.56)');
    });

    it('rounds alpha to two decimals', () => {
      expect(hex8ToRgba('#ffffffff')).toBe('rgba(255, 255, 255, 1)');
      expect(hex8ToRgba('#00000080')).toBe('rgba(0, 0, 0, 0.5)');
    });
  });

  describe('hex4ToRgba', () => {
    it('converts 4-digit hex to rgba by duplicating digits', () => {
      expect(hex4ToRgba('#fffc')).toBe('rgba(255, 255, 255, 0.8)');
    });

    it('handles fully transparent 4-digit hex', () => {
      expect(hex4ToRgba('#0000')).toBe('rgba(0, 0, 0, 0)');
    });

    it('rounds alpha to two decimals', () => {
      expect(hex4ToRgba('#fff6')).toBe('rgba(255, 255, 255, 0.4)');
    });
  });

  describe('transformWxss', () => {
    it('converts #RRGGBBAA colors to rgba', () => {
      const input = '.foo{color:#111f2c8f;background:#ff000080}';
      const { css } = transformWxss(input);
      expect(css).toBe('.foo{color:rgba(17, 31, 44, 0.56);background:rgba(255, 0, 0, 0.5)}');
    });

    it('does not touch 3/6-digit hex colors', () => {
      const input = '.foo{color:#fff;background:#ff0000}';
      const { css } = transformWxss(input);
      expect(css).toBe('.foo{color:#fff;background:#ff0000}');
    });

    it('converts #RGBA colors to rgba', () => {
      const input = '.foo{color:#fffc;background:#0000}';
      const { css } = transformWxss(input);
      expect(css).toBe('.foo{color:rgba(255, 255, 255, 0.8);background:rgba(0, 0, 0, 0)}');
    });

    it('removes unsupported letter-spacing: normal', () => {
      const input = '.foo{font-size:24rpx;letter-spacing:normal;color:#333}';
      const { css, warnings } = transformWxss(input);
      expect(css).toBe('.foo{font-size:24rpx;color:#333}');
      expect(warnings).toHaveLength(0);
    });

    it('keeps non-normal letter-spacing values', () => {
      const input = '.foo{letter-spacing:2rpx}';
      const { css } = transformWxss(input);
      expect(css).toBe('.foo{letter-spacing:2rpx}');
    });

    it('expands direct-child universal selector with common mini-program tags and warns', () => {
      const input = '.flex > *{flex:1}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('.flex > *');
      expect(css).toMatch(/\.flex > view,/);
      expect(css).toMatch(/\.flex > text,/);
      expect(css).toMatch(/\.flex > button,/);
      expect(css).toMatch(/\.flex > map\{flex:1\}$/);
      expect(css.split(',').length).toBe(15);
    });

    it('expands direct-child universal selector with pseudo-class and warns', () => {
      const input = '.list > *:last-child{margin-right:0}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('.list > *:last-child');
      expect(css).toMatch(/\.list > view:last-child,/);
      expect(css).toMatch(/\.list > text:last-child,/);
      expect(css).toMatch(/\.list > map:last-child\{margin-right:0\}$/);
    });

    it('expands implicit direct-child universal selector without explicit *', () => {
      const input = '.list > :last-child{margin-right:0}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(1);
      expect(css).toMatch(/\.list > view:last-child,/);
      expect(css).toMatch(/\.list > map:last-child\{margin-right:0\}$/);
    });

    it('expands implicit direct-child universal selector without spaces', () => {
      const input = '.list>:last-child{margin-right:0}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(1);
      expect(css).toMatch(/\.list>view:last-child,/);
      expect(css).toMatch(/\.list>map:last-child\{margin-right:0\}$/);
    });

    it('warns and removes unsupported universal selectors', () => {
      const input = '.reset *{margin:0}.ok{color:red}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('.reset *');
      expect(css).toBe('.ok{color:red}');
    });

    it('processes rules inside @media blocks', () => {
      const input = '@media screen{.card > *{padding:8px}}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('.card > *');
      expect(css).toContain('@media screen{');
      expect(css).toMatch(/\.card > view,/);
      expect(css).toMatch(/\.card > map\{padding:8px\}\}$/);
    });

    it('preserves unrelated CSS', () => {
      const input = '.a{color:rgba(0,0,0,0.5)}.b{display:flex}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(0);
      expect(css).toBe('.a{color:rgba(0,0,0,0.5)}.b{display:flex}');
    });

    it('preserves CSS with braces in string content', () => {
      const input = '.foo{content:"}"}.bar > *{flex:1}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(1);
      expect(css).toContain('content:"}"');
    });

    it('does not break on nested at-rules', () => {
      const input = '@supports (display:flex){.foo > *{display:flex}}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(1);
      expect(css).toContain('@supports (display:flex){');
    });

    it('keeps original CSS when parsing fails', () => {
      const input = 'this is not css';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('WXSS compat post-processing failed');
      expect(css).toBe(input);
    });
  });
});
