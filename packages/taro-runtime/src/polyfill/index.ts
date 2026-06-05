import { handleArrayFindPolyfill, handleArrayIncludesPolyfill } from './array'
import { handleObjectAssignPolyfill, handleObjectDefinePropertyPolyfill, handleObjectEntriesPolyfill } from './object'

function handlePolyfill () {
  if (process.env.SUPPORT_TARO_POLYFILL === 'enabled' || process.env.SUPPORT_TARO_POLYFILL === 'Object' || process.env.SUPPORT_TARO_POLYFILL === 'Object.assign') {
    handleObjectAssignPolyfill()
  }
  if (process.env.SUPPORT_TARO_POLYFILL === 'enabled' || process.env.SUPPORT_TARO_POLYFILL === 'Object' || process.env.SUPPORT_TARO_POLYFILL === 'Object.entries') {
    handleObjectEntriesPolyfill()
  }
  if (process.env.SUPPORT_TARO_POLYFILL === 'enabled' || process.env.SUPPORT_TARO_POLYFILL === 'Object' || process.env.SUPPORT_TARO_POLYFILL === 'Object.defineProperty') {
    handleObjectDefinePropertyPolyfill()
  }
  if (process.env.SUPPORT_TARO_POLYFILL === 'enabled' || process.env.SUPPORT_TARO_POLYFILL === 'Array' || process.env.SUPPORT_TARO_POLYFILL === 'Array.find') {
    handleArrayFindPolyfill()
  }
  if (process.env.SUPPORT_TARO_POLYFILL === 'enabled' || process.env.SUPPORT_TARO_POLYFILL === 'Array' || process.env.SUPPORT_TARO_POLYFILL === 'Array.includes') {
    handleArrayIncludesPolyfill()
  }
}

if (process.env.SUPPORT_TARO_POLYFILL !== 'disabled') {
  handlePolyfill()
}

export { handlePolyfill }

