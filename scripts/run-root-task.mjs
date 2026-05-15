/**
 * Run a root package.json script via the detected package manager (bun / pnpm / npm).
 * Usage: node scripts/run-root-task.mjs <script-name>
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectPackageManager, spawnPackageScriptWithPathFallback } from './lib/package-runner.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scriptName = process.argv[2];

if (!scriptName) {
  console.error('Usage: node scripts/run-root-task.mjs <script-name>');
  process.exit(1);
}

const pm = detectPackageManager(root);
spawnPackageScriptWithPathFallback(pm, scriptName, root);
