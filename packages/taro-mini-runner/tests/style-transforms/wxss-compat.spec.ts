import { describe, expect, it } from 'vitest';
import { hex8ToRgba, transformWxss } from '../../src/style-transforms/wxss-compat';

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

    it('expands direct-child universal selector with common mini-program tags', () => {
      const input = '.flex > *{flex:1}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(0);
      expect(css).toMatch(/\.flex > view,/);
      expect(css).toMatch(/\.flex > text,/);
      expect(css).toMatch(/\.flex > button,/);
      expect(css).toMatch(/\.flex > map\{flex:1\}$/);
      expect(css.split(',').length).toBe(15);
    });

    it('expands direct-child universal selector with pseudo-class', () => {
      const input = '.list > *:last-child{margin-right:0}';
      const { css, warnings } = transformWxss(input);
      expect(warnings).toHaveLength(0);
      expect(css).toMatch(/\.list > view:last-child,/);
      expect(css).toMatch(/\.list > text:last-child,/);
      expect(css).toMatch(/\.list > map:last-child\{margin-right:0\}$/);
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
      expect(warnings).toHaveLength(0);
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
  });
});
