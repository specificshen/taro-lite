function createWhenTs (err, params) {
  return !!params.typescript
}

const handler = {
  '/tsconfig.json': createWhenTs,
  '/types/global.d.ts': createWhenTs,
  '/_editorconfig' () {
    return { setPageName: '/.editorconfig' }
  },
  '/_env.development' () {
    return { setPageName: '/.env.development' }
  },
  '/_env.production' () {
    return { setPageName: '/.env.production' }
  },
  '/_env.test' () {
    return { setPageName: '/.env.test' }
  },
  '/_gitignore' () {
    return { setPageName: '/.gitignore' }
  }
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
