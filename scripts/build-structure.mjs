#!/usr/bin/env node
/* build-structure.mjs —— 结构图别名 → build-diagram.mjs structure
 *   node scripts/build-structure.mjs <data.js> [out.html]
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const r = spawnSync(process.execPath,
  [join(here, 'build-diagram.mjs'), 'structure', ...process.argv.slice(2)],
  { stdio: 'inherit' });
process.exit(r.status ?? 1);
