const path = require('node:path')

function createWhenTs (err, params) {
  return !!params.typescript
}

function normalizePath (filePath) {
  return filePath.replace(/\\/g, '/').replace(/\/{2,}/g, '/')
}

const SOURCE_ENTRY = '/src'
const PAGES_ENTRY = '/src/pages'

const handler = {
  '/tsconfig.json': createWhenTs,
  '/types/global.d.ts': createWhenTs,
  '/src/pages/index/index.tsx' (err, { pageDir = '', pageName = '', subPkg = '' }) {
    return {
      setPageName: normalizePath(path.join(PAGES_ENTRY, pageDir, pageName, 'index.tsx')),
      setSubPkgName: normalizePath(path.join(SOURCE_ENTRY, subPkg, pageDir, pageName, 'index.tsx'))
    }
  },
  '/src/pages/index/index.module.css' (err, { pageDir = '', pageName = '', subPkg = '' }) {
    return {
      setPageName: normalizePath(path.join(PAGES_ENTRY, pageDir, pageName, 'index.module.css')),
      setSubPkgName: normalizePath(path.join(SOURCE_ENTRY, subPkg, pageDir, pageName, 'index.module.css'))
    }
  },
  '/src/pages/index/index.config.js' (err, { pageDir = '', pageName = '', subPkg = '' }) {
    return {
      setPageName: normalizePath(path.join(PAGES_ENTRY, pageDir, pageName, 'index.config.js')),
      setSubPkgName: normalizePath(path.join(SOURCE_ENTRY, subPkg, pageDir, pageName, 'index.config.js'))
    }
  },
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
  '/src/pages/index/index.tsx',
  '/src/pages/index/index.module.css',
  '/src/pages/index/index.config.js'
]

module.exports = {
  handler,
  basePageFiles
}
