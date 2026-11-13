/* lint-data.mjs —— 数据类规则（build 阶段跑，不起 Chrome）
 *
 *   import { lintData } from './lint-data.mjs';
 *   const warnings = lintData('structure'|'flowchart'|'flow', dataSrc);
 *
 * 规则与 assets/engine-*.js 的运行时 lint 同源（红线数字来自 rules-core.mjs）：
 *   - 这里拦「读数据就能判」的：缺常量 / 起止胶囊 / 出口语义 / 密度 / 图标名 / 深度统一…
 *   - 几何类（重叠 / 出画布 / 过宽 / 稀疏）留给渲染后的 check.js，不在此重复
 * 引擎 lint 保留为浏览器运行时镜像（手动开 HTML、绕过 build 时仍能拦）。
 * 结构图支持逃生门：DIAGRAM.lint === false 跳过一致性规则（与引擎一致）。
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIMITS } from './rules-core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const GEOM_KINDS = ['dot', 'sq', 'ring', 'tri'];   // 引擎内置几何块，不算图标名

/* 全量图标名（build 不经浏览器，用 assets/icons.js 而不是裁剪后的引擎子集） */
function allIconNames() {
  try {
    const src = readFileSync(join(here, '..', 'assets', 'icons.js'), 'utf8');
    const m = src.match(/^const ICONS = (\{.*\});$/m);
    return m ? new Set(Object.keys(JSON.parse(m[1]))) : new Set();
  } catch { return new Set(); }
}

/* data 文件是纯 const 脚本（会被内联进 HTML），用 Function 载入并按名导出 */
function loadData(src) {
  const names = ['DIAGRAM', 'LINKS', 'TITLE', 'SUBTITLE', 'LANES', 'TRUNK', 'BRANCHES', 'STAGES'];
  const ret = names.map(n => `${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`);
  return new Function(src + `\n;return { ${ret.join(', ')} };`)();
}

const isBox = n => !!n && Array.isArray(n.children);
const need = (v, msg, w) => { if (v === undefined) w.push(msg); return v !== undefined; };

export function lintData(kind, src) {
  const w = [];
  let v;
  try { v = loadData(src); }
  catch (e) { return [`data 语法/载入错误：${e.message}`]; }

  if (kind === 'structure') lintStructure(v, w);
  else if (kind === 'flowchart') lintFlowchart(v, w);
  else if (kind === 'flow') lintFlow(v, w);
  return w;
}

/* ---------------- 结构图（镜像 engine-structure.js lint()） ---------------- */
function lintStructure(v, w) {
  if (!need(v.DIAGRAM, '缺 const DIAGRAM 声明', w)) return;
  need(v.LINKS, '缺 const LINKS 声明（无关系线写 const LINKS = []）', w);

  const root = v.DIAGRAM.root;
  if (!isBox(root)) { w.push('DIAGRAM.root 必须是带 children 数组的盒子'); return; }
  if (!root.children.length) { w.push('DIAGRAM.root.children 为空：图里没有任何块'); return; }

  /* ---- 关系线：格式与端点（引擎静默跳过坏条目，这里拦下） ---- */
  if (v.LINKS !== undefined) {
    if (!Array.isArray(v.LINKS)) w.push('LINKS 必须是数组');
    else {
      const ids = new Set();
      (function walk(n) { if (n.id != null) ids.add(n.id);
        if (isBox(n)) n.children.forEach(walk); })(root);
      v.LINKS.forEach((e, i) => {
        if (!Array.isArray(e) || e.length < 2) { w.push(`LINKS[${i}] 不是 [from, to, label?] 数组`); return; }
        if (!ids.has(e[0])) w.push(`LINKS[${i}] 起点 id「${e[0]}」在树里不存在`);
        if (!ids.has(e[1])) w.push(`LINKS[${i}] 终点 id「${e[1]}」在树里不存在`);
      });
    }
  }

  /* ---- 一致性（与引擎同文案） ---- */
  if (v.DIAGRAM.lint === false) return;   // 逃生门，与引擎一致

  const ICONS = allIconNames();
  const name = n => n.title || (n.tag && n.tag[0]) || (n.children[0] && n.children[0].t) || '?';
  const leaves = [];
  const ids = new Set();
  let dupId = null;
  (function prep(n, flat, idx) {
    if (n.id != null) { if (ids.has(n.id) && dupId == null) dupId = n.id; ids.add(n.id); }
    if (isBox(n)) {
      n.dir = n.dir || 'row';
      n.children.forEach((k, i) => prep(k, n.flat ?? flat, i));   // flat 继承与引擎 prep 一致
    } else {
      n.flat = !!flat;
      n.d = n.d || [];
      if (n.d !== undefined && !Array.isArray(n.d)) {
        w.push(`「${n.t}」的 d 必须是数组（如 ['说明']），现在是 ${typeof n.d} —— 引擎会崩`);
      }
      n.kind = n.icon === false ? null : (n.icon || GEOM_KINDS[idx % 4]);
      leaves.push(n);
    }
  })(root, false, 0);
  if (dupId != null) w.push(`节点 id「${dupId}」重复：LINKS / 查询会指错节点`);

  (function walk(n) {
    if (!isBox(n)) return;
    const lk = n.children.filter(k => !isBox(k) && !k.flat);
    if (lk.length > 1 && new Set(lk.map(k => Array.isArray(k.d) && k.d.length > 0)).size > 1)
      w.push(`「${name(n)}」里有的卡片有说明、有的没有 —— 同组卡片信息量要一致`);
    if (n.dir === 'row' && !n.wrap && !n.flow && n.children.length > LIMITS.structureRowMax)
      w.push(`「${name(n)}」非流水线横排 ${n.children.length} 个子项（>${LIMITS.structureRowMax}）—— 用 wrap:N 换行或拆子分组`);
    n.children.forEach(walk);
  })(root);

  if (new Set(leaves.map(l => l.flat)).size > 1)
    w.push('全图信息深度不统一：有的块是平铺短条（flat），有的是卡片 —— 统一成一种；内容单薄的块先补内容');

  const tops = root.children.filter(k => isBox(k) && !k.bare);
  if (tops.length > 1 && new Set(tops.map(k => !!k.tag)).size > 1)
    w.push('顶层块有的带 tag、有的不带 —— 统一');

  leaves.forEach(l => {
    if (typeof l.kind === 'string' && !GEOM_KINDS.includes(l.kind) && !ICONS.has(l.kind))
      w.push(`图标名不存在：${l.kind}（见 references/icons.md）`);
  });
}

/* ---------------- 流程图（镜像 engine-flowchart.js 数据段 lint，几何类除外） ---------------- */
function lintFlowchart(v, w) {
  if (!need(v.TITLE, '缺 const TITLE 声明', w)) return;
  need(v.TRUNK, '缺 const TRUNK 声明', w);
  need(v.BRANCHES, '缺 const BRANCHES 声明（无侧支写 const BRANCHES = []）', w);
  if (v.LANES !== undefined && !Array.isArray(v.LANES)) { w.push('LANES 必须是数组'); return; }
  if (!Array.isArray(v.TRUNK)) return;
  if (!Array.isArray(v.BRANCHES)) return;
  if (!v.TRUNK.length) { w.push('TRUNK 为空：主干至少要有 start → … → end'); return; }

  const LANES = Array.isArray(v.LANES) ? v.LANES : null;
  const TRUNK = v.TRUNK, BRANCHES = v.BRANCHES;

  const byId = {};
  let dupId = null;
  const reg = n => { if (n.id == null) return; if (byId[n.id] && dupId == null) dupId = n.id; byId[n.id] = n; };
  TRUNK.forEach(n => { reg(n); n.kind = 'trunk'; });
  BRANCHES.forEach(br => (br.nodes || []).forEach(n => { reg(n); n.kind = 'branch'; }));
  if (dupId != null) w.push(`节点 id「${dupId}」重复：分支会挂错位置`);

  if (!TRUNK.some(n => n.shape === 'start')) w.push('缺 start 胶囊：读者不知道从哪开始');
  if (!TRUNK.some(n => n.shape === 'end')) w.push('缺 end 胶囊：分支要有明确终止态');

  const ALL = [...TRUNK, ...BRANCHES.flatMap(b => b.nodes || [])];
  const decs = ALL.filter(n => n.shape === 'decision');
  decs.forEach(n => {
    const outs = BRANCHES.filter(b => b.from === n.id);
    if (!outs.length) w.push(`判断「${n.t}」没有侧支出口：不是判断就改卡片`);
    if (n.kind === 'branch') w.push(`判断「${n.t}」在侧支里：判断必须上主干，主干才是直线`);
    if (!n.yes || n.yes === '是') w.push(`判断「${n.t}」直下出口是裸"是"：补语义，如"是：通过"`);
    outs.forEach(b => { if (!b.label) w.push(`分支 ${b.from}→${b.to} 缺出口标签：条件必须标在箭头上`); });
  });
  BRANCHES.forEach(b => {
    if (!b.nodes || !b.nodes.length) { w.push(`分支 ${b.from}→${b.to} 没有节点`); return; }
    if (!byId[b.from] || !byId[b.to]) { w.push(`分支 ${b.from}→${b.to} 的 id 不存在`); return; }
    if (byId[b.from].shape !== 'decision') w.push(`分支起点「${byId[b.from].t}」不是判断：侧支只能挂在判断出口`);
    if (!['quick', 'err'].includes(b.style)) w.push(`分支 ${b.from}→${b.to} 的 style 只能 quick/err`);
  });

  if (ALL.length > LIMITS.fcNodes) w.push(`节点 ${ALL.length} 个（红线 ${LIMITS.fcNodes}）：拆主图 + 子流程卡`);
  if (decs.length > LIMITS.fcDecisions) w.push(`判断 ${decs.length} 个（红线 ${LIMITS.fcDecisions}）：拆图`);
  if (BRANCHES.length > LIMITS.fcBranches) w.push(`侧支 ${BRANCHES.length} 条（红线 ${LIMITS.fcBranches}）：分支多说明该拆图`);

  if (LANES && LANES.length && (LANES.length < LIMITS.fcLanesMin || LANES.length > LIMITS.fcLanesMax))
    w.push(`责任带 ${LANES.length} 条（${LIMITS.fcLanesMin}–${LIMITS.fcLanesMax}）`);
  if (LANES && LANES.length) ALL.forEach(n => {
    if (n.lane == null || n.lane < 0 || n.lane >= LANES.length)
      w.push(`节点「${n.t}」的 lane 越界/缺失`);
  });
}

/* ---------------- 泳道时序（镜像 engine-flow.js 克制规则） ---------------- */
function lintFlow(v, w) {
  if (!need(v.TITLE, '缺 const TITLE 声明', w)) return;
  if (!need(v.LANES, '缺 const LANES 声明（参与者列表，时序图必须有）', w)) return;
  if (!need(v.STAGES, '缺 const STAGES 声明', w)) return;
  if (!Array.isArray(v.LANES) || !v.LANES.length) { w.push('LANES 必须是非空数组'); return; }
  if (!Array.isArray(v.STAGES) || !v.STAGES.length) { w.push('STAGES 必须是非空数组'); return; }

  let frags = 0, notes = 0, fragDepth = 0;
  const walk = (list, depth) => {
    if (!Array.isArray(list)) { w.push('msgs / branches.msgs 必须是数组'); return; }
    list.forEach(m => {
      if (Array.isArray(m)) return;                                   // 普通消息
      if (m == null || typeof m !== 'object') { w.push(`msgs 条目必须是数组或 {note|frag} 对象（收到 ${typeof m}）`); return; }
      if (m.note != null) { notes++; return; }
      if (m.frag) {
        frags++; fragDepth = Math.max(fragDepth, depth + 1);
        const brs = m.branches || [{ msgs: m.msgs || [] }];
        brs.forEach(b => walk(b.msgs || [], depth + 1));
        return;
      }
      w.push(`msgs 对象条目必须有 note 或 frag 字段（否则被静默丢弃）：${JSON.stringify(m).slice(0, 60)}`);
    });
  };
  v.STAGES.forEach(s => {
    if (!s || typeof s !== 'object') { w.push('STAGES 条目必须是 {no, name, msgs} 对象'); return; }
    if (s.msgs == null) { w.push(`阶段「${s.name ?? s.no}」缺 msgs 数组`); return; }
    walk(s.msgs, 0);
  });

  if (frags > LIMITS.flowFrags) w.push(`片段 ${frags} 个（建议 ≤ ${LIMITS.flowFrags}）：只框真正影响理解的分支 / 重试，其余写进注释或拆图`);
  if (fragDepth > LIMITS.flowFragDepth) w.push(`片段嵌套 ${fragDepth} 层（建议 ≤ ${LIMITS.flowFragDepth}）`);
  if (notes > LIMITS.flowNotes) w.push(`注释 ${notes} 条（建议 ≤ ${LIMITS.flowNotes}）：注释多说明消息标签没写清`);
}
