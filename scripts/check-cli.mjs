#!/usr/bin/env node
/* check-cli.mjs —— 一条命令跑完 Step 4 自检（无头 Chrome 执行 check.js）
 *
 *   node check-cli.mjs <diagram.html>                # → JSON 打到 stdout
 *   node check-cli.mjs <diagram.html> --shot         # 顺带出 <名>-shot.png 供目检
 *   node check-cli.mjs <diagram.html> --shot out.png # 指定截图路径
 *
 * 退出码：0 = pass:true，1 = pass:false，2 = 跑不起来（缺 Chrome / 页面报错）
 * 浏览器路径可用环境变量 CHROME 指定（与 export-svg.mjs 一致）。
 *
 * 原理：把 check.js 注入成品页，无头渲染后取回 JSON。
 * 结果走 base64，避免 dump-dom 的 HTML 转义弄脏 JSON。
 */
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const html = args.find(a => a.endsWith('.html') && !a.startsWith('--'));
if (!html) {
  console.error('用法: node check-cli.mjs <diagram.html> [--shot [png路径]]');
  process.exit(2);
}
const si = args.indexOf('--shot');
const shot = si >= 0
  ? (args[si + 1] && !args[si + 1].startsWith('--') ? args[si + 1] : html.replace(/\.html$/, '-shot.png'))
  : null;

const chrome = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => existsSync(p));
if (!chrome) { console.error('找不到 Chrome/Edge，请用环境变量 CHROME 指定'); process.exit(2); }

/* check.js 是 (():{…return{…}})()，包一层把返回值转成 base64 塞进 <pre>
   <pre> 仅给 --dump-dom 解析用：CSS 隐藏（dump-dom 仍序列化其文本，--shot 不再拍到它） */
const checkSrc = readFileSync(join(here, 'check.js'), 'utf8');
const inject = '<style>#__check__{display:none}</style><script>(function(){' +
  'var r;' +
  'try{r=' + checkSrc + '}catch(e){r={pass:false,error:String((e&&e.stack)||e)}}' +
  'var json=JSON.stringify(r);' +
  'var bytes=new TextEncoder().encode(json);' +
  'var bin="";for(var i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);' +
  'var p=document.createElement("pre");p.id="__check__";p.textContent=btoa(bin);' +
  'document.body.appendChild(p);' +
  '})();</script>';

const tmp = join(mkdtempSync(join(tmpdir(), 'd2c-')), 'page.html');
writeFileSync(tmp, readFileSync(html, 'utf8').replace(/<\/body>/i, inject + '</body>'), 'utf8');

const dom = execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--window-size=2400,2400', '--virtual-time-budget=3000',
  '--dump-dom', pathToFileURL(tmp).href
], { encoding: 'utf8', maxBuffer: 64 << 20 });

const m = dom.match(/<pre id="__check__">([\s\S]*?)<\/pre>/);
if (!m) { console.error('页面没有产出自检结果（模板在注入前就崩了？先在浏览器打开确认）'); process.exit(2); }

let result;
try {
  result = JSON.parse(Buffer.from(m[1].trim(), 'base64').toString('utf8'));
} catch (e) {
  console.error('自检结果不是合法 JSON: ' + e.message);
  process.exit(2);
}

if (result.error) {
  console.error(result.error);
  process.exit(2);
}

/* --shot：按画布实际尺寸再起一次 Chrome 截图（window-size 用默认会裁切或留白过多） */
let shotPath = null;
if (shot) {
  const [w, h] = result.canvas || [1600, 1200];
  shotPath = resolve(shot);
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--window-size=${Math.ceil(w) + 40},${Math.ceil(h) + 80}`,
    '--virtual-time-budget=3000',
    `--screenshot=${shotPath}`, pathToFileURL(tmp).href
  ], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (!existsSync(shotPath)) { console.error('截图失败: ' + shotPath); process.exit(2); }
}

const out = shotPath ? { ...result, shot: shotPath } : result;
console.log(JSON.stringify(out, null, 2));
if (result.pass) {
  console.error(shotPath ? `pass:true  截图 → ${shotPath}` : 'pass:true');
  process.exit(0);
} else {
  const bad = ['badSizes', 'offCanvas', 'overlaps', 'outOfBox', 'linkHits', 'lint', 'tooWide']
    .filter(k => (result[k] || []).length)
    .map(k => `${k}×${result[k].length}`);
  console.error('pass:false  ' + (bad.join('  ') || '未知'));
  process.exit(1);
}
