#!/usr/bin/env node
/* export-svg.mjs —— 模板 HTML → 静态自包含 SVG 文件（与具体飞书工具无关的中间产物）
 *
 *   node export-svg.mjs <diagram.html> [-o diagram.svg]
 *
 * 用无头 Chrome/Edge 渲染模板，取出最终 <svg>，补 xmlns，去掉 <script>。
 * 产出的 .svg 可交给任何能吃 SVG 的飞书通道：
 *   - lark-cli whiteboard +update --input_format svg --source @diagram.svg
 *   - lark-doc 的 <whiteboard type="svg"> 块
 *   - 直接作为图片插入文档
 * 浏览器路径可用环境变量 CHROME 指定。
 */
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const html = args.find(a => a.endsWith('.html'));
if (!html) { console.error('用法: node export-svg.mjs <diagram.html> [-o diagram.svg]'); process.exit(1); }
const oi = args.indexOf('-o');
const out = oi >= 0 ? args[oi + 1] : html.replace(/\.html$/, '.svg');

const inject = `<script>(function(){const s=document.querySelector('svg');const c=s.cloneNode(true);
c.setAttribute('xmlns','http://www.w3.org/2000/svg');c.querySelectorAll('script').forEach(e=>e.remove());
const p=document.createElement('pre');p.id='__svg__';p.textContent=c.outerHTML;document.body.appendChild(p);})();</script>`;
const tmp = join(mkdtempSync(join(tmpdir(), 'd2s-')), 'page.html');
writeFileSync(tmp, readFileSync(html, 'utf8').replace(/<\/body>/i, inject + '</body>'), 'utf8');

const chrome = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => existsSync(p));
if (!chrome) { console.error('找不到 Chrome/Edge，请用环境变量 CHROME 指定'); process.exit(1); }

const dom = execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=2000,2000',
  '--virtual-time-budget=3000', '--dump-dom', pathToFileURL(tmp).href], { encoding: 'utf8', maxBuffer: 64 << 20 });
const m = dom.match(/<pre id="__svg__">([\s\S]*?)<\/pre>/);
if (!m) { console.error('页面没有产出 SVG（模板报错？先在浏览器打开确认）'); process.exit(1); }
const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + unesc(m[1]);
writeFileSync(out, svg, 'utf8');
console.log(JSON.stringify({ out: resolve(out), bytes: svg.length }));
