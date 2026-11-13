#!/usr/bin/env node
/* build-diagram.mjs —— 通用：DATA + 引擎 → 单个自包含 HTML
 *
 *   node scripts/build-diagram.mjs <structure|flowchart|flow> <data.js> [out.html] [--check] [--shot [png]]
 *   node scripts/build-structure.mjs <data.js> [out.html] [--check]   # 结构图别名
 *
 * --check：build 通过后接着跑 check-cli（一条命令出最终自检 JSON；退出码跟 check）
 * --shot ：仅在带 --check 时透传给 check-cli（出目检 PNG）
 * 模型只写 data 文件；渲染引擎勿读勿改，由本脚本内联。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintData } from './lint-data.mjs';
import { LIMITS } from './rules-core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const KINDS = {
  structure: { shell: '_shell-structure.html', engine: 'engine-structure.js', label: '结构图' },
  flowchart: { shell: '_shell-flowchart.html', engine: 'engine-flowchart.js', label: '流程图' },
  flow:      { shell: '_shell-flow.html',      engine: 'engine-flow.js',      label: '泳道时序' },
};

const rawArgs = process.argv.slice(2);
/* 位置参数：跳过 --flag 及其值（--shot 后的 png 不能当成 out.html） */
const argv = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--shot') {
    if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith('--')) i++;
    continue;
  }
  if (a.startsWith('--')) continue;
  argv.push(a);
}
const doCheck = rawArgs.includes('--check');
let kind, dataArg, outArg;
if (argv[0] && KINDS[argv[0]]) {
  kind = argv[0]; dataArg = argv[1]; outArg = argv[2];
} else {
  // 兼容 build-structure 式：只传 data
  kind = 'structure'; dataArg = argv[0]; outArg = argv[1];
}
if (!dataArg) {
  console.error('用法: node scripts/build-diagram.mjs <structure|flowchart|flow> <data.js> [out.html] [--check] [--shot [png]]');
  console.error('  或: node scripts/build-structure.mjs <data.js> [out.html] [--check]');
  process.exit(2);
}

const meta = KINDS[kind];
const dataPath = resolve(dataArg);
const out = outArg
  ? resolve(outArg)
  : resolve(dataPath.replace(/\.data\.js$/i, '.html').replace(/(?<!\.data)\.js$/i, '.html'));

if (!existsSync(dataPath)) { console.error('找不到 data 文件: ' + dataPath); process.exit(2); }

const shellPath = join(root, 'assets', meta.shell);
const enginePath = join(root, 'assets', meta.engine);
if (!existsSync(shellPath) || !existsSync(enginePath)) {
  console.error(`缺少 assets/${meta.shell} 或 assets/${meta.engine}`);
  process.exit(2);
}

const data = readFileSync(dataPath, 'utf8').replace(/\s+$/, '\n');
let engine = readFileSync(enginePath, 'utf8');
const shell = readFileSync(shellPath, 'utf8');
if (!shell.includes('/*__DATA__*/') || !shell.includes('/*__ENGINE__*/')) {
  console.error('shell 缺少 /*__DATA__*/ 或 /*__ENGINE__*/ 占位');
  process.exit(2);
}

/* 数据类规则前置（P0）：不起 Chrome，读 data 就能判的错误在这里拦。
 * 几何类（重叠/出画布/过宽/稀疏）仍归渲染后的 check.js。 */
const lintWarnings = lintData(kind, data);
if (lintWarnings.length) {
  console.error(`数据 lint 不过（${lintWarnings.length} 条）——改 data 后重新 build：`);
  lintWarnings.forEach(x => console.error('  ✗ ' + x));
  process.exit(1);
}

/* 红线数字单源注入：engine 顶部的 LIMITS 占位（__LIMITS__ 标记）用 rules-core 的 JSON 覆盖 */
engine = engine.replace(/const LIMITS = \/\*__LIMITS__\*\/\{[^}]*\}/,
  () => 'const LIMITS = /*__LIMITS__*/' + JSON.stringify(LIMITS));

/* 图标按需内联：引擎里 131 个全量 ICONS（~43KB）裁成 data 实际引用的子集。
 * 引用 = data 全文 icon:'name' / icon:"name"（icon:false 无图标，不计）。
 * 裁剪失败（格式意外）→ 原样内联，不影响正确性。 */
let icons = null, iconMissing = [];
const iconsMatch = engine.match(/^const ICONS = (\{.*\});$/m);
if (iconsMatch) {
  try {
    const all = JSON.parse(iconsMatch[1]);
    const used = new Set();
    for (const m of data.matchAll(/\bicon\s*:\s*['"]([^'"]+)['"]/g)) used.add(m[1]);
    const sub = {};
    for (const name of used) {
      if (name in all) sub[name] = all[name];
      else iconMissing.push(name);
    }
    engine = engine.replace(iconsMatch[0], () => 'const ICONS = ' + JSON.stringify(sub) + ';');
    icons = Object.keys(sub).length;
  } catch { /* 保持全量 */ }
}

const html = shell
  .replace('/*__DATA__*/', () => data)
  .replace('/*__ENGINE__*/', () => engine);

writeFileSync(out, html, 'utf8');
const summary = {
  kind, label: meta.label, out,
  bytes: html.length, dataBytes: data.length, engineBytes: engine.length,
  ...(icons !== null ? { icons } : {}),
  ...(iconMissing.length ? { iconMissing } : {}),
};

/* --check：build 成功后接着跑自检。summary 走 stderr，stdout 留给 check 的最终 JSON */
if (doCheck) {
  console.error(JSON.stringify(summary, null, 2));
  const checkArgs = [join(here, 'check-cli.mjs'), out];
  const si = rawArgs.indexOf('--shot');
  if (si >= 0) {
    checkArgs.push('--shot');
    const p = rawArgs[si + 1];
    if (p && !p.startsWith('--')) checkArgs.push(p);
  }
  const r = spawnSync(process.execPath, checkArgs, { stdio: 'inherit' });
  process.exit(r.status ?? 2);
}
console.log(JSON.stringify(summary, null, 2));
