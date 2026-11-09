#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""diagram-design 离线布局工具

只在「不能跑 HTML 模板」的载体（Excalidraw 等）手算坐标时用。
HTML 与飞书画板都直接用 assets/ 模板（画板走 scripts/to-board.mjs），不需要本文件。
参数与模板 JS 完全一致，改一处必须同步另一处。
"""

FS = {"title": 26, "body": 12.5, "note": 10}       # 全图三级字号


def est_w(text, size):
    """单行文本宽度估算：中文 1.0em，西文 0.56em（与模板 estW 一致）。"""
    return sum(size * (1.0 if ord(c) > 127 else 0.56) for c in str(text))


def font_int(size):
    """飞书画板 font_size 必须整数：12.5 → 13，其余四舍五入。"""
    return int(size + 0.5)


def timeline_ys(msg_counts, top=184, msg=62, pad_t=50, pad_b=28, gap=10):
    """流程图纵向累积（与 template-flow.html 同参）。
    msg_counts: 每阶段消息数，如 [4, 4, 3]
    返回 ([(y0, y1, [每条消息 y]), ...], 泳道线底 y)"""
    out, y = [], top
    for n in msg_counts:
        y0, y1 = y, y + pad_t + (n - 1) * msg + pad_b
        out.append((y0, y1, [y0 + pad_t + i * msg for i in range(n)]))
        y = y1 + gap
    return out, out[-1][1] + 24


def pick_label_x(sx, ex, w, lanes, pad=6, edge=4):
    """跨泳道箭头的标签定位（与模板 pickX 同参）：候选位置打分，压泳道线判负。
    返回标签左边缘 x。"""
    lo, hi = min(sx, ex), max(sx, ex)
    min_x, max_x = lo + pad, hi - w - pad
    if max_x < min_x:
        return (sx + ex) / 2.0 - w / 2.0

    def safe(x):
        return min(max_x, max(min_x, x))

    def dist(x):
        d = float("inf")
        for L in lanes:
            if x + w < L - edge or x > L + edge:
                d = min(d, abs(x + w / 2.0 - L))
            else:
                return -1
        return d

    cands = [safe(lo + (hi - lo) * f - w / 2.0) for f in (0.5, 0.34, 0.66, 0.2, 0.8, 0.12, 0.88)]
    best, best_d = cands[0], -2
    for c in cands:
        d = dist(c)
        if d > best_d:
            best_d, best = d, c
    return best


def check_boxes(boxes, canvas_w, canvas_h):
    """离线自检。boxes: [(name, x1, y1, x2, y2)] → (越界名单, 重叠对)"""
    out = [b[0] for b in boxes if b[1] < 0 or b[2] < 0 or b[3] > canvas_w or b[4] > canvas_h]
    ov = [(a[0], b[0]) for i, a in enumerate(boxes) for b in boxes[i + 1:]
          if a[1] < b[3] and b[1] < a[3] and a[2] < b[4] and b[2] < a[4]]
    return out, ov


if __name__ == "__main__":
    assert est_w("知识库 RAG", 12.5) == 65.5, est_w("知识库 RAG", 12.5)
    st, bot = timeline_ys([4, 4, 3])
    assert st[0] == (184, 448, [234, 296, 358, 420]), st[0]
    lanes = [220, 404, 588, 772, 956, 1140]
    x = pick_label_x(220 + 20, 956 - 10, 120, lanes)
    assert not [L for L in lanes if not (x + 120 < L - 4 or x > L + 4)], "压线"
    assert font_int(12.5) == 13
    print("layout_lib 自测通过")
