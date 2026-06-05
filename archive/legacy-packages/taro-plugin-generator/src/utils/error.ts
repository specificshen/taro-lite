export const GeneratorErrorType = {
  modifyConfig: 'modifyConfig',
  emitFile: 'emitFile',
} as const;

type GeneratorErrorType = (typeof GeneratorErrorType)[keyof typeof GeneratorErrorType];

export class GeneratorError extends Error {
  type: GeneratorErrorType;
  targetFile?: string;
  constructor(options: { type: GeneratorErrorType; message?: string; targetFile?: string }) {
    const { type, message, targetFile } = options;
    super(message);
    this.type = type;
    this.name = 'GeneratorError';
    this.targetFile = targetFile;
  }
}

export function isGeneratorError(error: unknown): error is GeneratorError {
  return error instanceof GeneratorError;
}

export async function safely<T>(
  fn: () => T,
  options?: {
    fallback?: T;
    onError?: (err: unknown) => void;
  },
) {
  try {
    return await fn();
  } catch (error) {
    if (typeof options?.onError === 'function') {
      options.onError(error);
      return options.fallback;
    }
    if (isGeneratorError(error)) {
      switch (error.type) {
        case GeneratorErrorType.modifyConfig: {
          globalThis.console.log('❌ 更新配置文件失败');
          globalThis.console.log(`请添加如下代码至 ${error.targetFile ?? 'config/index.{ts,js}'} 中\n`);
          break;
        }
        case GeneratorErrorType.emitFile: {
          globalThis.console.log('❌ 生成文件失败');
          if (error.targetFile) {
            globalThis.console.log(`请手动添加文件 ${error.targetFile}，并添加如下代码至 ${error.targetFile} 中\n`);
          }
          break;
        }
        default: {
          break;
        }
      }
      globalThis.console.log(error.message);
    } else {
      globalThis.console.log(error);
    }
    return options?.fallback;
  }
}
