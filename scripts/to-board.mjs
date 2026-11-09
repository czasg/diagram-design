#!/usr/bin/env node
/* to-board.mjs —— 模板 HTML → 飞书画板，一条命令
 *
 *   node to-board.mjs <diagram.html> [--out nodes.json] [--board <whiteboard_id>] [--chunk 80]
 *
 *   1. 用无头 Chrome/Edge 打开 HTML（布局由模板自己算，和 HTML 交付完全一致）
 *   2. 注入 svg2board.js，把 SVG 翻译成画板节点 JSON
 *   3. 给了 --board：读取画板已有节点，自动把新图放到已有内容下方 80px，分批 create-notes 上传
 *
 * 浏览器路径可用环境变量 CHROME 指定。
 */
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const html = args.find(a => !a.startsWith('--') && !Object.values({}).includes(a) && a.endsWith('.html'));
if (!html) { console.error('用法: node to-board.mjs <diagram.html> [--out nodes.json] [--board <wid>] [--chunk 80]'); process.exit(1); }
const out = opt('--out') || html.replace(/\.html$/, '.board.json');
const board = opt('--board');
const chunk = +(opt('--chunk') || 80);
const feishu = (...a) => execFileSync('feishu', a, { encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 64 << 20 });

/* ---------- 1. 已有内容 → 偏移量 ---------- */
let ox = 0, oy = 0, z0 = 0;
if (board) {
  const ex = JSON.parse(feishu('board', 'nodes', board));
  const list = Array.isArray(ex) ? ex : (ex.nodes || []);
  const tops = list.filter(n => !n.parent_id && n.height != null);
  z0 = Math.max(0, ...list.map(n => n.z_index || 0));
  if (tops.length) {
    ox = Math.min(...tops.map(n => n.x));
    oy = Math.max(...tops.map(n => n.y + (n.height || 0))) + 80;
  }
}

/* ---------- 2. 无头浏览器渲染 + 翻译 ---------- */
const conv = readFileSync(join(here, 'svg2board.js'), 'utf8');
const src = readFileSync(html, 'utf8');
const inject = `<script>window.__BOARD_OFFSET_X=${ox};window.__BOARD_OFFSET_Y=${oy};window.__BOARD_Z0=${z0};
try{const n=${conv.trim().replace(/;?\s*$/, '')};
const p=document.createElement('pre');p.id='__board__';p.textContent=JSON.stringify(n);document.body.appendChild(p);}
catch(e){const p=document.createElement('pre');p.id='__board_err__';p.textContent=e.stack;document.body.appendChild(p);}</script>`;
const tmp = join(mkdtempSync(join(tmpdir(), 'd2b-')), 'page.html');
writeFileSync(tmp, src.replace(/<\/body>/i, inject + '</body>'), 'utf8');

const cands = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chrome = cands.find(p => existsSync(p));
if (!chrome) { console.error('找不到 Chrome/Edge，请用环境变量 CHROME 指定'); process.exit(1); }
const dom = execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--window-size=2000,2000', '--virtual-time-budget=3000', '--dump-dom', pathToFileURL(tmp).href],
  { encoding: 'utf8', maxBuffer: 64 << 20 });
const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const err = dom.match(/<pre id="__board_err__">([\s\S]*?)<\/pre>/);
if (err) { console.error('转换失败：\n' + unesc(err[1])); process.exit(1); }
const m = dom.match(/<pre id="__board__">([\s\S]*?)<\/pre>/);
if (!m) { console.error('页面没有产出节点（模板报错？先在浏览器打开确认能正常渲染）'); process.exit(1); }
const nodes = JSON.parse(unesc(m[1]));
writeFileSync(out, JSON.stringify(nodes), 'utf8');
const stat = nodes.reduce((a, n) => (a[n.type] = (a[n.type] || 0) + 1, a), {});
console.log(JSON.stringify({ out: resolve(out), count: nodes.length, types: stat, offset: [ox, oy] }));

/* ---------- 3. 分批上传 ---------- */
if (board) {
  let ok = 0;
  for (let i = 0; i < nodes.length; i += chunk) {
    const part = join(dirname(tmp), `part${i}.json`);
    writeFileSync(part, JSON.stringify(nodes.slice(i, i + chunk)), 'utf8');
    const r = JSON.parse(feishu('board', 'create-notes', board, '-f', part));
    ok += r.count || (r.node_ids || []).length;
  }
  console.log(JSON.stringify({ board, uploaded: ok }));
}
