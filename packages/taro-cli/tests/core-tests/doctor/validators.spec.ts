import { describe, expect, it } from 'vitest';
import { MessageKind, validateConfig } from '../../../src/doctor/validators';

describe('validateConfig', () => {
  it('returns invalid when config is missing', () => {
    const result = validateConfig(null as never);
    expect(result.isValid).toBe(false);
    expect(result.messages[0].kind).toBe(MessageKind.Error);
  });

  it('returns valid when config exists', () => {
    const result = validateConfig({ sourceRoot: 'src' } as never);
    expect(result.isValid).toBe(true);
    expect(result.messages[0].kind).toBe(MessageKind.Success);
  });
});
