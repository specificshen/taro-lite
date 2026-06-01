{{#if typescript }}import type { UserConfigExport } from "@spcsn/taro-cli"{{/if}}

export default {
  mini: {}
}{{#if typescript }} satisfies UserConfigExport<'vite'>{{/if}}
