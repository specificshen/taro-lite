function createWhenTs (err, params) {
  return !!params.typescript
}

const handler = {
  '/tsconfig.json': createWhenTs,
  '/types/global.d.ts': createWhenTs
}

const basePageFiles = [
  '/src/pages/dashboard/index.tsx',
  '/src/pages/dashboard/index.module.css',
  '/src/pages/dashboard/index.config.ts'
]

module.exports = {
  handler,
  basePageFiles
}
