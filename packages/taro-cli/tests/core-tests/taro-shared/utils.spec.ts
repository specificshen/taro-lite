import { describe, expect, it } from 'vitest';
import {
  capitalize,
  ensure,
  hasOwn,
  queryToJson,
  toCamelCase,
  toDashed,
  toKebabCase,
} from '../../../../taro/src/runtime/shared-compat/utils';

describe('taro-shared utils', () => {
  describe('toDashed', () => {
    it('converts camelCase to dashed', () => {
      expect(toDashed('helloWorld')).toBe('hello-world');
    });
    it('handles numbers', () => {
      expect(toDashed('hello1World')).toBe('hello1-world');
    });
  });

  describe('toCamelCase', () => {
    it('converts dashed to camelCase', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld');
    });
    it('handles multiple dashes', () => {
      expect(toCamelCase('hello-world-foo')).toBe('helloWorldFoo');
    });
  });

  describe('toKebabCase', () => {
    it('converts camelCase to kebab-case', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world');
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });
  });

  describe('hasOwn', () => {
    it('returns true for own property', () => {
      expect(hasOwn({ a: 1 }, 'a')).toBe(true);
    });
    it('returns false for inherited property', () => {
      expect(hasOwn(Object.create({ a: 1 }), 'a')).toBe(false);
    });
  });

  describe('ensure', () => {
    it('does nothing when condition is true', () => {
      expect(() => ensure(true, 'error')).not.toThrow();
    });
    it('throws when condition is false', () => {
      expect(() => ensure(false, 'boom')).toThrow('boom');
    });
  });

  describe('queryToJson', () => {
    it('parses simple query string', () => {
      expect(queryToJson('a=1&b=2')).toEqual({ a: '1', b: '2' });
    });
    it('collects repeated keys into array', () => {
      expect(queryToJson('a=1&a=2')).toEqual({ a: ['1', '2'] });
    });
    it('decodes URI components', () => {
      expect(queryToJson('name=%E4%BD%A0%E5%A5%BD')).toEqual({ name: '你好' });
    });
    it('handles empty value', () => {
      expect(queryToJson('key')).toEqual({ key: '' });
    });
  });
});
