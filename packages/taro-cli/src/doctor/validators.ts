import type { IProjectConfig } from '@spcsn/taro/types/compile';

export enum MessageKind {
  Error = 'error',
  Warning = 'warning',
  Success = 'success',
}

export interface ValidationMessage {
  kind: MessageKind;
  content: string;
}

export interface ValidationResult {
  isValid: boolean;
  messages: ValidationMessage[];
}

export function validateConfig(projectConfig: IProjectConfig): ValidationResult {
  const messages: ValidationMessage[] = [];

  if (!projectConfig) {
    messages.push({ kind: MessageKind.Error, content: '缺少项目配置' });
    return { isValid: false, messages };
  }

  messages.push({ kind: MessageKind.Success, content: '项目配置检查通过' });
  return { isValid: true, messages };
}
