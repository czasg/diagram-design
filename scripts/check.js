/* diagram-design 自检脚本
   用法（推荐）：node check-cli.mjs <diagram.html> [--shot] —— 无头自动跑本文件。
   手动：浏览器打开成品 HTML 后，把本文件全文作为 eval 执行（或粘到控制台）。
   返回 { pass, canvas, sizes, …各失败字段, fix } —— fix 是「字段 → 一句修法」映射，
   pass=false 时按 fix 改，不必回查 SKILL；仍不懂再读本文件规则本体。

   检查项：
   1. sizes      字号分布，必须 ⊆ {26, 12.5, 10}（ALLOWED 可按母版调整）
   2. offCanvas  超出 SVG 画布的文字
   3. overlaps   文字与文字互相重叠（容差 1px）
   4. outOfBox   文字超出它所在的最小卡片 rect（左右各留 2px）
   5. linkHits   结构图关系线穿过了无关卡片（模板写入 svg.dataset.linkHits）
   6. lint       一致性规则（各模板自己写入 svg.dataset.lint，本脚本只负责汇总拦截）：
                 结构图——深度不统一 / 同组说明有无不一 / 图标名不存在 / 非流水线横排 >5 个子项；
                 流程图——缺起止胶囊 / 出口缺语义标签 / 判断进侧支 / 密度红线 / 节点过近
   7. tooWide    结构图内容自然宽度（顶破 960 下限）且宽高比 > 2.5 —— 按病因：wrap:N / 拆子分组 / 多列改堆叠
   8. sparseCards 结构图卡片过空：卡很宽但文字只占左侧一小截（等宽铺满被最宽行拉爆）
*/
(() => {
  const ALLOWED = [26, 12.5, 10];
  /* 字段 → 一句修法（与 SKILL Step 4 同源；改修法只改这里和 SKILL 指针） */
  const FIX = {
    badSizes: '渲染段被改过 → 还原引擎内联段，不要手改字号',
    offCanvas: '文字出画布 → 缩短文案，或回 Step 1 调整信息深度/宽度策略',
    overlaps: '文字互压 → 缩短标签语义，或按建模调整 children 顺序',
    outOfBox: '文字溢出卡片 → 说明一行放不下，缩短该行 d 或拆层',
    lint: '一致性问题 → 回 Step 1 看建模与布局策略是否真写进数据（规则本体：引擎 lint / lint-data.mjs）',
    empty: '画布为空 → 引擎渲染前崩了：看 build 是否被 lint 拦过；控制台找 Uncaught',
    linkHits: '关系线穿无关卡 → 调整 children 顺序，让关系线两端卡片相邻',
    tooWide: '内容过宽 → wrap:N / 拆子分组 / 多列改堆叠（structure.md「条目数与竖版」）',
    sparseCards: '宽卡过空 → 给撑宽的长 flow 加 wrap:N 折行；或缩短该行文案/拆层（structure.md）',
  };
  const svg = document.querySelector('svg');
  const W = +svg.getAttribute('width'), H = +svg.getAttribute('height');
  const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim());
  /* 空画布守卫：引擎中途抛错时 svg 无尺寸、无文字 —— 以前所有数组全空会侥幸 pass:true。
     这种情况直接不过，并给出排查方向。 */
  if (!(W > 0) || !(H > 0) || !texts.length) {
    return { pass: false, canvas: [W || 0, H || 0], sizes: {},
      empty: '画布为空：引擎可能在渲染前就崩了（控制台看 Uncaught；常见原因——data 缺 const 声明、d 不是数组）',
      fix: FIX,
      badSizes: [], offCanvas: [], overlaps: [], outOfBox: [], linkHits: [], lint: [], tooWide: [], sparseCards: [] };
  }
  const box = e => e.getBBox();
  const name = t => t.textContent.trim().slice(0, 16);

  const sizes = {};
  texts.forEach(t => { const s = +t.getAttribute('font-size'); sizes[s] = (sizes[s] || 0) + 1; });
  const badSizes = Object.keys(sizes).map(Number).filter(s => !ALLOWED.includes(s));

  const tb = texts.map(t => ({ t, b: box(t) }));
  const offCanvas = tb.filter(({ b }) => b.x < 0 || b.y < 0 || b.x + b.width > W || b.y + b.height > H)
    .map(({ t }) => name(t));

  const overlaps = [];
  for (let i = 0; i < tb.length; i++) for (let j = i + 1; j < tb.length; j++) {
    const a = tb[i].b, c = tb[j].b, e = 1;
    if (a.x + e < c.x + c.width && c.x + e < a.x + a.width &&
        a.y + e < c.y + c.height && c.y + e < a.y + a.height)
      overlaps.push([name(tb[i].t), name(tb[j].t)]);
  }

  /* 卡片 = 带描边的 rect。叶子卡恒有描边；depth≥3 或 dashed 容器也有虚线描边 → 同样参与判定；
     depth<3 且非 dashed 的容器底色无描边，不参与 */
  const rects = [...svg.querySelectorAll('rect')].map(r => ({
    x: +r.getAttribute('x'), y: +r.getAttribute('y'),
    w: +r.getAttribute('width'), h: +r.getAttribute('height'),
    stroke: r.getAttribute('stroke') || '' }))
    .filter(r => r.w > 0 && r.h > 0);
  const outOfBox = [];
  tb.forEach(({ t, b }) => {
    const cx = b.x + 2, cy = b.y + b.height / 2;
    const hosts = rects.filter(r => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h)
      .filter(r => !(r.w >= W - 1 && r.h >= H - 1))
      .sort((p, q) => p.w * p.h - q.w * q.h);
    const r = hosts[0];
    if (r && r.w > b.width * 0.6 && (b.x < r.x - 2 || b.x + b.width > r.x + r.w + 2))
      outOfBox.push(name(t));
  });

  const linkHits = svg.dataset.linkHits ? svg.dataset.linkHits.split('|') : [];
  const lint = svg.dataset.lint ? svg.dataset.lint.split('|') : [];

  /* 结构图过宽：内容自然宽度把画布拉成横幅才拦。宽度没顶破 960 下限时，
     "宽"来自下限而非横排堆叠，拦了也给不出正确修法（补内容 / 加层才是正解）。
     流程图（泳道时序）天然可宽，不查。 */
  const tooWide = [];
  if (svg.dataset.kind === 'structure' && W > 960 && H > 0 && W / H > 2.5)
    tooWide.push(`画布宽高比 ${(W / H).toFixed(2)} > 2.5 —— 内容自然过宽：` +
      `横排堆太多 → wrap:N 或拆子分组；多列并排 → 改上下堆叠；长流水线 → wrap:N 折多行（箭头会回折，不断）`);

  /* 卡片过空：宽卡里文字只贴左边一小截 —— 画布被最宽一行撑开后等宽铺满的副作用 */
  const sparseCards = [];
  if (svg.dataset.kind === 'structure') {
    const hosts = new Map();
    tb.forEach(({ t, b }) => {
      const cx = b.x + 2, cy = b.y + b.height / 2;
      const rs = rects.filter(r => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h)
        .filter(r => !(r.w >= W - 1 && r.h >= H - 1) && r.w >= 220 && r.w < W * 0.92
          && r.stroke && r.stroke !== 'none')
        .sort((p, q) => p.w * p.h - q.w * q.h);
      if (!rs[0]) return;
      const r = rs[0];
      const key = `${r.x},${r.y},${r.w},${r.h}`;
      const prev = hosts.get(key);
      const right = b.x + b.width;
      if (!prev || right > prev.right) hosts.set(key, { r, right, label: name(t) });
    });
    hosts.forEach(({ r, right, label }, key) => {
      /* 从卡左缘到最右文字。等宽行里短文案卡天然偏空，只拦「又宽又几乎没字」：
         卡 ≥320px 且文字占不到 22% —— 典型是被最宽行拉爆的铺满 */
      const fill = (right - r.x) / r.w;
      if (r.w >= 320 && fill < 0.22)
        sparseCards.push(`卡 ${Math.round(r.w)}px 文字只到 ${(fill * 100).toFixed(0)}%（${label} · ${key}）`);
    });
  }

  const pass = !badSizes.length && !offCanvas.length && !overlaps.length &&
    !outOfBox.length && !linkHits.length && !lint.length && !tooWide.length && !sparseCards.length;
  return { pass, canvas: [W, H], sizes, fix: FIX,
    badSizes, offCanvas, overlaps: overlaps.slice(0, 20), outOfBox, linkHits, lint, tooWide, sparseCards };
})()
