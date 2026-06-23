#!/usr/bin/env bun
/**
 * Post-process tsc-emitted JS files so that relative ESM import/export specifiers
 * include the `.js` extension (or `/index.js` for directory imports).
 *
 * Uses acorn to avoid accidental replacements inside strings, comments, or
 * non-module expressions.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as acorn from 'acorn';

interface Specifier {
  start: number;
  end: number;
  text: string;
}

function isLiteral(node: acorn.Node): node is acorn.Literal {
  return node.type === 'Literal';
}

function isImportDeclaration(node: acorn.Node): node is acorn.ImportDeclaration {
  return node.type === 'ImportDeclaration';
}

function isExportAllDeclaration(node: acorn.Node): node is acorn.ExportAllDeclaration {
  return node.type === 'ExportAllDeclaration';
}

function isExportNamedDeclaration(node: acorn.Node): node is acorn.ExportNamedDeclaration {
  return node.type === 'ExportNamedDeclaration';
}

function isImportExpression(node: acorn.Node): node is acorn.ImportExpression {
  return node.type === 'ImportExpression';
}

function isCallExpression(node: acorn.Node): node is acorn.CallExpression {
  return node.type === 'CallExpression';
}

function isMemberExpression(node: acorn.Node): node is acorn.MemberExpression {
  return node.type === 'MemberExpression';
}

function isMetaProperty(node: acorn.Node): node is acorn.MetaProperty {
  return node.type === 'MetaProperty';
}

function isIdentifier(node: acorn.Node): node is acorn.Identifier {
  return node.type === 'Identifier';
}

const KNOWN_JS_EXTS = new Set(['.js', '.mjs', '.cjs', '.json']);

function addLiteral(literal: acorn.Node | null | undefined, specifiers: Specifier[]) {
  if (!literal || !isLiteral(literal) || typeof literal.value !== 'string') return;
  const text = literal.value;
  if (!text.startsWith('.')) return;
  const ext = path.extname(text);
  // 只有以 .js/.mjs/.cjs/.json 结尾才视为已处理；.mini/.config 等文件名需要补 .js
  if (ext && KNOWN_JS_EXTS.has(ext)) return;
  specifiers.push({ start: literal.start, end: literal.end, text });
}

function isImportMetaResolveCall(node: acorn.CallExpression): boolean {
  const callee = node.callee;
  if (!isMemberExpression(callee)) return false;
  if (!isMetaProperty(callee.object)) return false;
  if (callee.object.meta.name !== 'import' || callee.object.property.name !== 'meta') return false;
  if (callee.computed) return false;
  if (!isIdentifier(callee.property)) return false;
  return callee.property.name === 'resolve';
}

function collectRelativeSpecifiers(node: acorn.Node): Specifier[] {
  const specifiers: Specifier[] = [];

  function walk(n: acorn.Node) {
    if (isImportDeclaration(n) || isExportAllDeclaration(n) || isExportNamedDeclaration(n)) {
      addLiteral(n.source, specifiers);
    } else if (isImportExpression(n)) {
      addLiteral(n.source, specifiers);
    } else if (isCallExpression(n) && isImportMetaResolveCall(n)) {
      addLiteral(n.arguments[0], specifiers);
    }

    const nodeRecord = n as unknown as Record<string, unknown>;
    for (const key of Object.keys(nodeRecord)) {
      const child = nodeRecord[key];
      if (!child || typeof child !== 'object') continue;
      if (Array.isArray(child)) {
        for (const c of child) {
          if (c && typeof c === 'object' && (c as { type?: string }).type) {
            walk(c as acorn.Node);
          }
        }
      } else if ((child as { type?: string }).type) {
        walk(child as acorn.Node);
      }
    }
  }

  walk(node);
  return specifiers;
}

function resolveSpecifierExtension(baseDir: string, specifier: string): string {
  const resolved = path.resolve(baseDir, specifier);
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    return `${specifier}/index.js`;
  }
  return `${specifier}.js`;
}

function fixFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  let ast: acorn.Node;
  try {
    ast = acorn.parse(content, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch {
    // Not parseable as module JS; leave untouched.
    return;
  }

  const specifiers = collectRelativeSpecifiers(ast).sort((a, b) => b.start - a.start);
  if (specifiers.length === 0) return;

  const baseDir = path.dirname(filePath);
  let result = content;
  for (const spec of specifiers) {
    const replacement = resolveSpecifierExtension(baseDir, spec.text);
    result = result.slice(0, spec.start + 1) + replacement + result.slice(spec.end - 1);
  }

  fs.writeFileSync(filePath, result, 'utf8');
}

function walkDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(entryPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      fixFile(entryPath);
    }
  }
}

function main() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    console.error('Usage: fix-esm-imports.ts <dir>');
    process.exit(1);
  }
  const resolved = path.resolve(targetDir);
  if (!fs.existsSync(resolved)) {
    console.error(`Directory not found: ${resolved}`);
    process.exit(1);
  }
  walkDir(resolved);
}

main();
