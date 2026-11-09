#!/usr/bin/env node
/* build-icons.mjs —— 从 lucide-static 重新生成 assets/icons.js（并注入两个模板）
 *
 * 用法：
 *   node build-icons.mjs <lucide 的 svg 目录> [新图标名...]   重新生成 icons.js（保留已有 + 追加新名）并注入模板、刷新预览
 *   node build-icons.mjs --preview                            只按 references/icons.md 重建 assets/icons-preview.html
 *   （先在任意目录 npm i lucide-static svgpath，并在该目录执行）
 *
 * 归一化（为飞书画板 SVG 解析器）：ellipse/polyline/polygon → path；
 * 所有 path 转绝对坐标、椭圆弧 A → 三次贝塞尔（飞书对 rx≠ry 的弧解析错误，database 等会变形）。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(join(process.cwd(), 'x.js'));

const here = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(here, '..', 'assets');

/* --preview：按 references/icons.md 的分类生成可视预览页 assets/icons-preview.html */
function buildPreview() {
  const s = readFileSync(join(ASSETS, 'icons.js'), 'utf8');
  const icons = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
  const md = readFileSync(join(here, '..', 'references', 'icons.md'), 'utf8');
  const sec = md.slice(md.indexOf('## 按分类'), md.indexOf('## 通用兜底'));
  const groups = []; let cur = null; const seen = new Set();
  for (const line of sec.split('\n')) {
    const h = line.match(/^### (.+)/); if (h) { groups.push(cur = { name: h[1], items: [] }); continue; }
    if (!cur) continue;
    const names = [...line.matchAll(/`([a-z0-9-]+)`/g)].map(m => m[1]).filter(n => icons[n]);
    const desc = line.startsWith('|') ? (line.split('|')[2] || '').trim() : '';
    names.forEach(n => { cur.items.push([n, desc]); seen.add(n); });
  }
  const rest = Object.keys(icons).filter(n => !seen.has(n));
  if (rest.length) groups.push({ name: '未登记（请补进 icons.md）', items: rest.map(n => [n, '']) });
  const cell = ([n, d]) => `<div class="c" title="${d}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[n]}</svg><b>${n}</b><i>${d}</i></div>`;
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>图标预览 · ${Object.keys(icons).length} 个</title>
<style>body{font:13px "PingFang SC","Microsoft YaHei",sans-serif;background:#F6F7F9;color:#2C3441;margin:0;padding:28px 36px}
h1{font-size:22px;margin:0 0 4px}p{color:#7A8494;margin:0 0 20px}h2{font-size:14px;color:#7B4A9E;margin:22px 0 10px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.c{background:#fff;border:1px solid #E2E8F2;border-radius:6px;padding:10px;display:flex;flex-direction:column;gap:4px;color:#3E63DD}
.c svg{width:22px;height:22px}.c b{color:#2C3441;font:600 12px Consolas,monospace}.c i{color:#8A93A3;font-style:normal;font-size:11px;line-height:1.4}</style></head>
<body><h1>diagram-design 图标库</h1><p>${Object.keys(icons).length} 个 · Lucide（ISC）· 数据中写 <code>icon:'名称'</code> · 业务词索引见 references/icons.md</p>
${groups.map(g => `<h2>${g.name}</h2><div class="g">${g.items.map(cell).join('')}</div>`).join('\n')}</body></html>`;
  writeFileSync(join(ASSETS, 'icons-preview.html'), html);
  console.log(JSON.stringify({ preview: join(ASSETS, 'icons-preview.html'), groups: groups.length, unregistered: rest }));
}
if (process.argv.includes('--preview')) { buildPreview(); process.exit(0); }

const [src, ...extra] = process.argv.slice(2);
if (!src || !existsSync(src)) { console.error('用法: node build-icons.mjs <lucide-static/icons 目录> [额外图标名...]'); process.exit(1); }

const svgpath = require('svgpath');
const old = readFileSync(join(ASSETS, 'icons.js'), 'utf8');
const names = [...new Set([...Object.keys(JSON.parse(old.slice(old.indexOf('{'), old.lastIndexOf('}') + 1))), ...extra])];
const num = (t, k) => +t.match(new RegExp(`\\b${k}="([^"]+)"`))[1];
const norm = p => svgpath(p).abs().unarc().unshort().round(3).toString();
const out = {}, miss = [];
for (const n of names) {
  const f = join(src, n + '.svg'); if (!existsSync(f)) { miss.push(n); continue; }
  let b = readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '').match(/>\s*([\s\S]*)<\/svg>/)[1];
  b = b.replace(/<ellipse[^>]*\/>/g, t => { const [cx, cy, rx, ry] = ['cx', 'cy', 'rx', 'ry'].map(k => num(t, k));
        return `<path d="M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z" />`; })
       .replace(/<(polyline|polygon)[^>]*\/>/g, (t, kind) => { const v = t.match(/points="([^"]+)"/)[1].match(/-?[\d.]+/g);
        const pr = []; for (let i = 0; i < v.length; i += 2) pr.push(v[i] + ' ' + v[i + 1]);
        return `<path d="M${pr.join(' L')}${kind === 'polygon' ? 'Z' : ''}" />`; })
       .replace(/<path d="([^"]+)"/g, (_, p) => `<path d="${norm(p)}"`)
       .replace(/\s+/g, ' ').trim();
  out[n] = b;
}
const js = '/* Lucide icons subset (ISC License, https://lucide.dev) — 24x24, stroke=currentColor; arcs → beziers for Feishu */\nconst ICONS = '
  + JSON.stringify(out) + ';\n';
writeFileSync(join(ASSETS, 'icons.js'), js);
const tpl = join(ASSETS, 'template-structure.html');
writeFileSync(tpl, readFileSync(tpl, 'utf8').replace(/\/\* Lucide icons subset[^\n]*\nconst ICONS = [^\n]*;\n/, js));
console.log(JSON.stringify({ icons: Object.keys(out).length, missing: miss }));
buildPreview();
