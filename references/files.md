# 文件清单

> 按需查表；日常出图只需 SKILL.md Step 3 的「形态 → 模板/build」速查。

| 文件 | 用途 |
|---|---|
| `references/structure.md` | 结构图：盒子树写法、字段、三种范式、坑 |
| `references/flowchart.md` | 流程图：主干直行设计核心、数据格式、参数、坑 |
| `references/flow.md` | 泳道时序图：泳道时序写法、参数、坑 |
| `references/icons.md` | 图标：业务词 → 图标名索引、场景推荐组合、新增流程 |
| `references/feishu-board.md` | 飞书画板：转换流程、节点映射、已知限制 |
| `assets/template-structure.data.js` | **结构图 DATA**：模型只写这个（Step 1 注释 + DIAGRAM/LINKS） |
| `assets/template-flowchart.data.js` | **流程图 DATA**：模型只写这个（TRUNK/BRANCHES 等） |
| `assets/template-flow.data.js` | **泳道时序 DATA**：模型只写这个（STAGES 等） |
| `assets/engine-structure.js` / `engine-flowchart.js` / `engine-flow.js` | 三种图渲染引擎（勿读勿改；由 build 内联） |
| `assets/_shell-structure.html` / `_shell-flowchart.html` / `_shell-flow.html` | HTML 壳 + 占位（勿改；build 用） |
| `scripts/build-diagram.mjs` | 通用：`structure\|flowchart\|flow` + data → 自包含 HTML；**`--check` build 完直接跑自检**，`--shot` 透传截图 |
| `scripts/build-structure.mjs` | 结构图别名 → `build-diagram.mjs structure`（同样支持 `--check`） |
| `assets/template-structure.html` / `template-flowchart.html` / `template-flow.html` | **整文件参考产物**（与 build 等价；日常勿复制它） |
| `assets/examples/rag.js` | **内容建模的完整范例**（顶部注释示范 Step 1 怎么写）：分组 + 双流水线 + 侧挂治理 |
| `assets/examples/flow-wrap.js` | **长流水线蛇形折行**：`flow` + `wrap:N`（1→2→3→4 ↓ 7←6←5），固定列宽、转向侧对齐，回折恒为纯竖线；children 仍按语义顺序写 |
| `assets/examples/flow-fragments.js` | 时序图带 alt / loop / 注释 / 异步的克制用法（片段默认不用，见 flow.md） |
| `assets/icons.js` / `icons-preview.html` | 图标资源（模板已内联）/ 可视预览 |
| `scripts/build-icons.mjs` | 新增图标、重建预览（含飞书兼容归一化） |
| `scripts/check.js` | 自检规则本体 + `fix` 修法映射（被 check-cli 注入执行；也可手动在浏览器 eval） |
| `scripts/check-cli.mjs` | 单独自检：无头 Chrome 跑 check.js，`--shot` 出目检 PNG（日常走 `build-* --check`，本命令用于不重建的复查） |
| `scripts/lint-data.mjs` | **数据类 lint**（build 阶段跑，不起 Chrome）：缺常量 / 起止胶囊 / 密度红线 / 图标名等 |
| `scripts/rules-core.mjs` | **红线数字单源**：lint-data 与引擎共用；改红线只改这里 |
| `scripts/export-svg.mjs` | 模板 HTML → 静态自包含 SVG（飞书 SVG 通道 / 插图通用） |
| `scripts/to-board.mjs` | 模板 HTML → 画板节点 JSON；加 `--board` 时用 feishu CLI 分批上传 |
| `scripts/svg2board.js` | SVG → 画板节点 JSON 翻译器（被 to-board 注入；也可单独在浏览器 eval） |
| `scripts/layout_lib.mjs` | Excalidraw 等非 HTML 载体手算坐标用；参数与模板一致；`node scripts/layout_lib.mjs` 跑自测 |

## 非 HTML 载体

| 载体 | 怎么做 |
|---|---|
| **飞书画板** | 同一份模板 HTML 转 SVG 或节点 JSON → 见 `references/feishu-board.md` |
| Excalidraw | 手算坐标，用 `scripts/layout_lib.mjs` 的 `est_w` / `timeline_ys` / `pick_label_x`；`roughness:0`、`fontFamily:2` |
| Mermaid | 只出草图，不交付成品 |
