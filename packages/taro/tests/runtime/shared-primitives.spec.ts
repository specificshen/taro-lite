import { describe, expect, it, vi } from 'vitest';
import {
  EMPTY_OBJ,
  ensure,
  isArray,
  isFunction,
  isNull,
  isNumber,
  isObject,
  isString,
  isUndefined,
  noop,
  toCamelCase,
  toDashed,
  warn,
} from '../../src/runtime/shared-primitives';

describe('runtime/shared-primitives', () => {
  it('noop does nothing', () => {
    expect(noop()).toBeUndefined();
  });

  it('EMPTY_OBJ is empty', () => {
    expect(Object.keys(EMPTY_OBJ)).toHaveLength(0);
  });

  describe('type guards', () => {
    it('isString', () => {
      expect(isString('a')).toBe(true);
      expect(isString(1)).toBe(false);
    });

    it('isUndefined', () => {
      expect(isUndefined(undefined)).toBe(true);
      expect(isUndefined(null)).toBe(false);
    });

    it('isNull', () => {
      expect(isNull(null)).toBe(true);
      expect(isNull(undefined)).toBe(false);
    });

    it('isObject', () => {
      expect(isObject({})).toBe(true);
      expect(isObject([])).toBe(true);
      expect(isObject(null)).toBe(false);
      expect(isObject('x')).toBe(false);
    });

    it('isFunction', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction({})).toBe(false);
    });

    it('isNumber', () => {
      expect(isNumber(42)).toBe(true);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('42')).toBe(false);
    });

    it('isArray', () => {
      expect(isArray([])).toBe(true);
      expect(isArray({})).toBe(false);
    });
  });

  describe('case conversion', () => {
    it('toDashed converts camelCase to dashed-case', () => {
      expect(toDashed('backgroundColor')).toBe('background-color');
      expect(toDashed('borderTopLeftRadius')).toBe('border-top-left-radius');
    });

    it('toCamelCase converts dashed-case to camelCase', () => {
      expect(toCamelCase('background-color')).toBe('backgroundColor');
      expect(toCamelCase('border-top-left-radius')).toBe('borderTopLeftRadius');
    });
  });

  describe('ensure', () => {
    it('does nothing when condition is true', () => {
      expect(() => ensure(true, 'should not throw')).not.toThrow();
    });

    it('throws when condition is false', () => {
      expect(() => ensure(false, 'boom')).toThrow('boom');
    });
  });

  describe('warn', () => {
    it('warns in non-production', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      warn(true, 'hello');
      expect(warnSpy).toHaveBeenCalledWith('[taro warn] hello');

      warn(false, 'ignored');
      expect(warnSpy).toHaveBeenCalledTimes(1);

      process.env.NODE_ENV = originalEnv;
      warnSpy.mockRestore();
    });
  });
});
