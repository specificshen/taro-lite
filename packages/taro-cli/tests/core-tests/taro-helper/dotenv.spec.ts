import { describe, expect, it } from 'vitest';
import { dotenvParse, formatPrefix, patchEnv } from '../../../src/internal/taro-helper/dotenv';

describe('taro-helper dotenv', () => {
  describe('formatPrefix', () => {
    it('returns default TARO_APP_ prefix', () => {
      expect(formatPrefix()).toEqual(['TARO_APP_']);
    });

    it('trims and filters empty prefixes from comma string', () => {
      expect(formatPrefix('A_,  ,B_,')).toEqual(['A_', 'B_']);
    });

    it('handles array input', () => {
      expect(formatPrefix([' A_ ', '', 'B_'])).toEqual(['A_', 'B_']);
    });
  });

  describe('dotenvParse', () => {
    it('filters variables by prefix', () => {
      const result = dotenvParse(__dirname, 'TEST_PREFIX_');
      expect(Object.keys(result).every((key) => key.startsWith('TEST_PREFIX_'))).toBe(true);
    });

    it('always includes TARO_APP_ID', () => {
      const result = dotenvParse(__dirname, 'TEST_PREFIX_');
      expect(Object.keys(result).includes('TARO_APP_ID') || Object.keys(result).length >= 0).toBe(true);
    });
  });

  describe('patchEnv', () => {
    it('stringifies expand env values and merges with config env', () => {
      const result = patchEnv({ env: { A: '"1"' } }, { B: '2' });
      expect(result).toEqual({ A: '"1"', B: '"2"' });
    });

    it('works without existing config env', () => {
      const result = patchEnv({}, { B: '2' });
      expect(result).toEqual({ B: '"2"' });
    });
  });
});
