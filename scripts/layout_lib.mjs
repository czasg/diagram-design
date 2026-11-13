#!/usr/bin/env node
/** diagram-design 离线布局工具
 *
 * 只在「不能跑 HTML 模板」的载体（Excalidraw 等）手算坐标时用。
 * HTML 与飞书画板都直接用 assets/ 模板（画板走 scripts/to-board.mjs），不需要本文件。
 * 参数与模板 JS 完全一致，改一处必须同步另一处。
 *
 * 用法：
 *   node scripts/layout_lib.mjs          # 跑内置自测
 *   import { est_w, timeline_ys, pick_label_x } from './layout_lib.mjs'
 */

export const FS = { title: 26, body: 12.5, note: 10 };   // 全图三级字号

/** 单行文本宽度估算：中文 1.0em，西文 0.56em（与模板 estW 同参）。 */
export function est_w(text, size) {
  let w = 0;
  for (const c of String(text)) w += size * (c.codePointAt(0) > 127 ? 1.0 : 0.56);
  return w;
}

/** 飞书画板 font_size 必须整数：12.5 → 13，其余四舍五入。 */
export function font_int(size) {
  return Math.floor(size + 0.5);
}

/** 流程图纵向累积（与 template-flow.html 同参）。
 * msg_counts: 每阶段消息数，如 [4, 4, 3]
 * 返回 [([(y0, y1, [每条消息 y]), ...], 泳道线底 y)] */
export function timeline_ys(msg_counts, top = 184, msg = 62, pad_t = 50, pad_b = 28, gap = 10) {
  const out = [];
  let y = top;
  for (const n of msg_counts) {
    const y0 = y, y1 = y + pad_t + (n - 1) * msg + pad_b;
    out.push([y0, y1, Array.from({ length: n }, (_, i) => y0 + pad_t + i * msg)]);
    y = y1 + gap;
  }
  return [out, out[out.length - 1][1] + 24];
}

/** 跨泳道箭头的标签定位（与模板 pickX 同参）：候选位置打分，压泳道线判负。
 * 返回标签左边缘 x。 */
export function pick_label_x(sx, ex, w, lanes, pad = 6, edge = 4) {
  const lo = Math.min(sx, ex), hi = Math.max(sx, ex);
  const min_x = lo + pad, max_x = hi - w - pad;
  if (max_x < min_x) return (sx + ex) / 2 - w / 2;

  const safe = x => Math.min(max_x, Math.max(min_x, x));
  const dist = x => {
    let d = Infinity;
    for (const L of lanes) {
      if (x + w < L - edge || x > L + edge) d = Math.min(d, Math.abs(x + w / 2 - L));
      else return -1;
    }
    return d;
  };

  const cands = [0.5, 0.34, 0.66, 0.2, 0.8, 0.12, 0.88].map(f => safe(lo + (hi - lo) * f - w / 2));
  let best = cands[0], best_d = -2;
  for (const c of cands) {
    const d = dist(c);
    if (d > best_d) { best_d = d; best = c; }
  }
  return best;
}

/** 离线自检。boxes: [(name, x1, y1, x2, y2)] → [[越界名单], [重叠对]] */
export function check_boxes(boxes, canvas_w, canvas_h) {
  const out = boxes.filter(b => b[1] < 0 || b[2] < 0 || b[3] > canvas_w || b[4] > canvas_h).map(b => b[0]);
  const ov = [];
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a[1] < b[3] && b[1] < a[3] && a[2] < b[4] && b[2] < a[4]) ov.push([a[0], b[0]]);
    }
  return [out, ov];
}

/* 直接执行时跑自测（import 时不跑） */
if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) {
  const eq = (a, b, msg) => {
    if (JSON.stringify(a) !== JSON.stringify(b))
      throw new Error(`${msg}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
  };
  eq(est_w('知识库 RAG', 12.5), 65.5, 'est_w');
  const [st] = timeline_ys([4, 4, 3]);
  eq(st[0], [184, 448, [234, 296, 358, 420]], 'timeline_ys');
  const lanes = [220, 404, 588, 772, 956, 1140];
  const x = pick_label_x(220 + 20, 956 - 10, 120, lanes);
  eq(lanes.filter(L => !(x + 120 < L - 4 || x > L + 4)), [], 'pick_label_x 压线');
  eq(font_int(12.5), 13, 'font_int');
  console.log('layout_lib 自测通过');
}
