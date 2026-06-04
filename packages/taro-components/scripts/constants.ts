import path from 'node:path';

export const MINI_APP_TYPES = ['weapp'] as const;
export const TYPES_DIR = path.join(process.cwd(), 'types');
