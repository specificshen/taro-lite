export const MessageKind = {
  Error: 'error',
  Warning: 'warning',
  Success: 'success',
  Manual: 'manual',
} as const;

export type MessageKind = (typeof MessageKind)[keyof typeof MessageKind];

export interface ValidateMessage {
  kind: MessageKind;
  content: string;
}

export interface ValidateResult {
  isValid: boolean;
  messages: ValidateMessage[];
}

const validResult = (): ValidateResult => ({
  isValid: true,
  messages: [],
});

export const validateConfig = async (..._args: unknown[]): Promise<ValidateResult> => validResult();
export const validateEnv = async (..._args: unknown[]): Promise<ValidateResult> => validResult();
export const validatePackage = async (..._args: unknown[]): Promise<ValidateResult> => validResult();
export const validateRecommend = async (..._args: unknown[]): Promise<ValidateResult> => validResult();
export const validateEslint = async (..._args: unknown[]): Promise<ValidateResult> => validResult();
