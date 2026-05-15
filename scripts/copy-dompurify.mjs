/**
 * Copy dompurify's browser bundle into the local editor vendor folder.
 * Resolves dompurify from the `mermaid` workspace package so it works with
 * pnpm's nested layout, Bun's hoisting, and plain npm.
 */
import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mermaidPkgJson = join(root, 'packages/mermaid/package.json');
const requireFromMermaid = createRequire(mermaidPkgJson);

const src = requireFromMermaid.resolve('dompurify/dist/purify.min.js');
const destDir = join(root, 'packages/mermaid/dist/mermaid-local-editor/vendor');
const dest = join(destDir, 'purify.min.js');

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
