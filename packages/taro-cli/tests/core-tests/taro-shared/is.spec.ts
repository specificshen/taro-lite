import { describe, expect, it } from 'vitest';
import {
  isArray,
  isBoolean,
  isBooleanStringLiteral,
  isFunction,
  isNull,
  isNumber,
  isObject,
  isObjectStringLiteral,
  isString,
  isUndefined,
} from '../../../../taro/src/runtime/shared-compat/is';

describe('taro-shared is', () => {
  describe('isString', () => {
    it('returns true for string', () => expect(isString('x')).toBe(true));
    it('returns false for number', () => expect(isString(1)).toBe(false));
  });

  describe('isUndefined', () => {
    it('returns true for undefined', () => expect(isUndefined(undefined)).toBe(true));
    it('returns false for null', () => expect(isUndefined(null)).toBe(false));
  });

  describe('isNull', () => {
    it('returns true for null', () => expect(isNull(null)).toBe(true));
    it('returns false for undefined', () => expect(isNull(undefined)).toBe(false));
  });

  describe('isObject', () => {
    it('returns true for plain object', () => expect(isObject({})).toBe(true));
    it('returns true for array', () => expect(isObject([])).toBe(true));
    it('returns false for null', () => expect(isObject(null)).toBe(false));
    it('returns false for string', () => expect(isObject('x')).toBe(false));
  });

  describe('isBoolean', () => {
    it('returns true for true', () => expect(isBoolean(true)).toBe(true));
    it('returns true for false', () => expect(isBoolean(false)).toBe(true));
    it('returns false for string', () => expect(isBoolean('true')).toBe(false));
  });

  describe('isFunction', () => {
    it('returns true for function', () => expect(isFunction(() => {})).toBe(true));
    it('returns false for object', () => expect(isFunction({})).toBe(false));
  });

  describe('isNumber', () => {
    it('returns true for finite number', () => expect(isNumber(1)).toBe(true));
    it('returns false for NaN', () => expect(isNumber(NaN)).toBe(false));
    it('returns false for Infinity', () => expect(isNumber(Infinity)).toBe(false));
  });

  describe('isBooleanStringLiteral', () => {
    it.each(['true', 'false', '!0', '!1'])('returns true for %s', (value) => {
      expect(isBooleanStringLiteral(value)).toBe(true);
    });
    it('returns false for other strings', () => expect(isBooleanStringLiteral('yes')).toBe(false));
  });

  describe('isObjectStringLiteral', () => {
    it('returns true for {}', () => expect(isObjectStringLiteral('{}')).toBe(true));
    it('returns false for other strings', () => expect(isObjectStringLiteral('[]')).toBe(false));
  });

  describe('isArray', () => {
    it('returns true for array', () => expect(isArray([])).toBe(true));
    it('returns false for object', () => expect(isArray({})).toBe(false));
  });
});
