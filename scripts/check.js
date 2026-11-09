/* diagram-design 自检脚本
   用法（推荐）：node check-cli.mjs <diagram.html> [--shot] —— 无头自动跑本文件。
   手动：浏览器打开成品 HTML 后，把本文件全文作为 eval 执行（或粘到控制台）。
   返回 { pass, sizes, offCanvas, overlaps, outOfBox, canvas }，pass=false 就按条目改。

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
*/
(() => {
  const ALLOWED = [26, 12.5, 10];
  const svg = document.querySelector('svg');
  const W = +svg.getAttribute('width'), H = +svg.getAttribute('height');
  const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim());
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

  /* 卡片 = 带描边的 rect，或白底 rect；找包含文字起点的最小那个 */
  const rects = [...svg.querySelectorAll('rect')].map(r => ({
    x: +r.getAttribute('x'), y: +r.getAttribute('y'),
    w: +r.getAttribute('width'), h: +r.getAttribute('height') }))
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
      `横排堆太多 → wrap:N 或拆子分组；多列并排 → 改上下堆叠；长流水线 → 补上下文分层加高（勿 wrap，会断箭头）`);

  const pass = !badSizes.length && !offCanvas.length && !overlaps.length &&
    !outOfBox.length && !linkHits.length && !lint.length && !tooWide.length;
  return { pass, canvas: [W, H], sizes, badSizes, offCanvas, overlaps: overlaps.slice(0, 20), outOfBox, linkHits, lint, tooWide };
})()
