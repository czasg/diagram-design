/* svg2board.js —— 把模板渲染出的 SVG 翻译成飞书画板节点（feishu board create-notes 的 JSON）
   用法 A：浏览器里 eval 本文件全文，返回节点数组
   用法 B：由 to-board.mjs 注入页面自动执行（推荐，一条命令出图）

   映射规则（与模板的绘制原语一一对应）：
     rect            → composite_shape round_rect / rect（fill、1px 描边、虚线）
     circle          → composite_shape ellipse
     text            → text_shape（字号四舍五入成整数：12.5→13；粗细≥600 → bold）
     line            → connector 直线（marker-end → 三角箭头）
     path 描边折线    → 拆成若干直线 connector，箭头只挂最后一段
     path 填充        → svg 节点（三角图标、箭头头等小图形）
   透明度一律预混到白底（画板不支持文字/线条透明度）。 */
(() => {
  const svg = document.querySelector('svg');
  const OX = +(window.__BOARD_OFFSET_X || 0), OY = +(window.__BOARD_OFFSET_Y || 0);
  const nodes = [];
  const num = (e, a, d = 0) => { const v = parseFloat(e.getAttribute(a)); return isNaN(v) ? d : v; };
  const r1 = v => Math.round(v * 10) / 10;

  function hex(c) {
    if (!c || c === 'none' || c === 'transparent') return null;
    if (c[0] === '#') return c.length === 4 ? '#' + [...c.slice(1)].map(x => x + x).join('') : c.slice(0, 7);
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    return '#' + m[1].split(',').slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
  }
  function blend(c, op) {                     // 预混到白底
    c = hex(c); if (!c || op >= 1) return c;
    return '#' + [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * op + 255 * (1 - op))
      .toString(16).padStart(2, '0')).join('');
  }
  const opOf = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) o *= num(n, 'opacity', 1); return o; };
  const bw = w => w <= 2 ? 'narrow' : w <= 3 ? 'medium' : 'bold';   // 画板 medium 的箭头头很大，1.8px 线归 narrow
  const dashOf = e => e.getAttribute('stroke-dasharray') ? 'dash' : 'solid';
  const inDefs = e => !!e.closest('defs');
  const fsz = s => Math.max(1, Math.floor(s + 0.5));

  const estW = (s, size) => { let w = 0;
    for (const c of String(s)) w += size * (c.charCodeAt(0) > 127 ? 1.0 : 0.56); return w; };

  function rectNode(x, y, w, h, el, kind) {
    const op = opOf(el), fill = blend(el.getAttribute('fill'), op);
    const stroke = el.getAttribute('stroke');
    const style = { fill_color: fill || '#ffffff', fill_opacity: fill ? 100 : 0 };
    if (stroke && stroke !== 'none') Object.assign(style, { border_style: dashOf(el),
      border_color: blend(stroke, op), border_width: bw(num(el, 'stroke-width', 1)) });
    else style.border_style = 'none';
    nodes.push({ type: 'composite_shape', x: r1(x + OX), y: r1(y + OY), width: r1(w), height: r1(h),
      composite_shape: { type: kind }, style });
  }

  function connector(x1, y1, x2, y2, el, arrowEnd) {
    const op = opOf(el);
    nodes.push({ type: 'connector', x: 0, y: 0, width: 0, height: 0,
      connector: { shape: 'straight',
        start: { position: { x: r1(x1 + OX), y: r1(y1 + OY) }, arrow_style: 'none' },
        end:   { position: { x: r1(x2 + OX), y: r1(y2 + OY) }, arrow_style: arrowEnd ? (el.getAttribute('data-arrow') === 'open' ? 'line_arrow' : 'triangle_arrow') : 'none' } },
      style: { border_color: blend(el.getAttribute('stroke'), op), border_style: dashOf(el),
        border_width: bw(num(el, 'stroke-width', 1)) } });
  }

  /* 只解析模板会用到的绝对命令 M/L/H/V/Z */
  function polyline(d) {
    const pts = []; let x = 0, y = 0, sx = 0, sy = 0;
    const re = /([MLHVZ])([^MLHVZ]*)/gi; let m;
    while ((m = re.exec(d))) {
      const v = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number), c = m[1].toUpperCase();
      if (c === 'M') { x = v[0]; y = v[1]; sx = x; sy = y; pts.push([x, y, 'M']); }
      else if (c === 'L') { for (let i = 0; i < v.length; i += 2) { x = v[i]; y = v[i + 1]; pts.push([x, y]); } }
      else if (c === 'H') { x = v[0]; pts.push([x, y]); }
      else if (c === 'V') { y = v[0]; pts.push([x, y]); }
      else if (c === 'Z') { x = sx; y = sy; pts.push([x, y]); }
    }
    return pts;
  }

  for (const el of svg.querySelectorAll('rect,circle,text,line,path,ellipse,polyline,polygon,g[data-icon]')) {
    if (inDefs(el)) continue;
    /* 图标组：整体打包成一个 svg 节点（内部图元不再逐个翻译） */
    const ig = el.closest('g[data-icon]');
    if (ig && ig !== el) continue;
    if (el.matches('g[data-icon]')) {
      const bb = el.getBBox(), m = el.getCTM(), s = m.a;              // 只有 translate + 等比 scale
      const x = m.e, y = m.f, w = 24 * s, h = 24 * s;
      const col = hex(el.getAttribute('stroke')) || '#2C3441';
      const code = `<svg xmlns="http://www.w3.org/2000/svg" width="${r1(w)}" height="${r1(h)}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${el.innerHTML}</svg>`;
      nodes.push({ type: 'svg', x: r1(x + OX), y: r1(y + OY), width: r1(w), height: r1(h), svg: { svg_code: code } });
      continue;
    }
    const tag = el.tagName.toLowerCase();
    if (!['rect','circle','text','line','path'].includes(tag)) continue;

    if (tag === 'rect') {
      const w = num(el, 'width'), h = num(el, 'height'); if (w <= 0 || h <= 0) continue;
      rectNode(num(el, 'x'), num(el, 'y'), w, h, el, num(el, 'rx') > 0 ? 'round_rect' : 'rect');

    } else if (tag === 'circle') {
      const r = num(el, 'r'), cx = num(el, 'cx'), cy = num(el, 'cy');
      rectNode(cx - r, cy - r, 2 * r, 2 * r, el, 'ellipse');

    } else if (tag === 'text') {
      const s = el.textContent; if (!s.trim()) continue;
      const size = num(el, 'font-size', 12.5), fs = fsz(size);
      const anchor = el.getAttribute('text-anchor') || 'start';
      const w = Math.ceil(estW(s, fs) * 1.12 + 10), h = Math.ceil(fs * 1.6);
      const bx = num(el, 'x'), base = num(el, 'y');
      const x = anchor === 'middle' ? bx - w / 2 : anchor === 'end' ? bx - w : bx - 2;
      const y = base - fs * 0.36 - h / 2;          // 基线 → 文本框垂直居中
      nodes.push({ type: 'text_shape', x: r1(x + OX), y: r1(y + OY), width: w, height: h,
        text: { text: s, font_size: fs, font_weight: num(el, 'font-weight', 400) >= 600 ? 'bold' : 'regular',
          text_color: blend(el.getAttribute('fill') || '#2C3441', opOf(el)),
          horizontal_align: anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left',
          vertical_align: 'mid' } });

    } else if (tag === 'line') {
      connector(num(el, 'x1'), num(el, 'y1'), num(el, 'x2'), num(el, 'y2'), el, !!el.getAttribute('marker-end'));

    } else if (tag === 'path') {
      const fill = el.getAttribute('fill'), stroke = el.getAttribute('stroke');
      if (stroke && stroke !== 'none' && (!fill || fill === 'none')) {
        const pts = polyline(el.getAttribute('d')), arrow = !!el.getAttribute('marker-end');
        for (let i = 1; i < pts.length; i++) {
          if (pts[i][2] === 'M') continue;
          const [a, b] = [pts[i - 1], pts[i]];
          if (a[0] === b[0] && a[1] === b[1]) continue;
          connector(a[0], a[1], b[0], b[1], el, arrow && i === pts.length - 1);
        }
      } else if (fill && fill !== 'none') {
        const bb = el.getBBox(); if (bb.width <= 0 || bb.height <= 0) continue;
        const pad = 1, w = bb.width + 2 * pad, h = bb.height + 2 * pad;
        const code = `<svg xmlns="http://www.w3.org/2000/svg" width="${r1(w)}" height="${r1(h)}" viewBox="${r1(bb.x - pad)} ${r1(bb.y - pad)} ${r1(w)} ${r1(h)}">`
          + `<path d="${el.getAttribute('d')}" fill="${blend(fill, opOf(el))}"/></svg>`;
        nodes.push({ type: 'svg', x: r1(bb.x - pad + OX), y: r1(bb.y - pad + OY), width: r1(w), height: r1(h),
          svg: { svg_code: code } });
      }
    }
  }
  /* 显式层级：画板不保证按上传顺序叠放，必须写 z_index，否则垫片会盖住文字 */
  nodes.forEach((n, i) => { n.z_index = (window.__BOARD_Z0 || 0) + i + 1; });
  return nodes;
})()
