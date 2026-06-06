{{#if typescript }}import type { UserConfigExport } from "@spcsn/taro-cli/define-config"{{/if}}

export default {
  mini: {}
}{{#if typescript }} satisfies UserConfigExport<'vite'>{{/if}}
