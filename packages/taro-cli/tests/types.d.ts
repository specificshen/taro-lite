/**
 * templates/default/template-creator.mjs 是含模板占位符的 .mjs 文件，无类型声明。
 * 这里为测试中的动态 import 补上最小模块形状（handler 的具体类型由调用处 as 断言给出）。
 */
declare module '*.mjs' {
  export const handler: unknown;
}
