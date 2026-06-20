function createWhenTs(_err, params) {
  return !!params.typescript;
}

export const handler = {
  '/tsconfig.json': createWhenTs,
  '/types/global.d.ts': createWhenTs,
};

export const basePageFiles = [
  '/src/pages/dashboard/index.tsx',
  '/src/pages/dashboard/index.module.css',
  '/src/pages/dashboard/index.config.ts',
];
