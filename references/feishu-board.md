# 飞书画板

> 原则：**画板不是另一套设计**。先按模板做出 HTML、check.js 通过，再导出交给飞书。
> 本技能**只负责产出**，不绑定任何飞书工具；写入画板由你环境里已有的飞书技能 / CLI 完成。

## 两种中间产物（选一种，按你的飞书工具能吃什么）

| 产物 | 命令 | 适用的飞书通道 |
|---|---|---|
| **静态 SVG**（推荐，通用） | `node scripts/export-svg.mjs diagram.html` → `diagram.svg` | 任何支持 SVG 的通道：`lark-cli whiteboard +update --input_format svg`、lark-doc 的 `<whiteboard type="svg">`、飞书官方 `whiteboard-cli` |
| **画板节点 JSON**（OpenAPI 原生格式） | `node scripts/to-board.mjs diagram.html` → `diagram.board.json` | 只支持原生节点的通道：`feishu board create-notes -f`、`lark-cli whiteboard +update --input_format raw` |

两个脚本都依赖 Node 18+，以及本机的 Chrome 或 Edge（找不到时用环境变量 `CHROME` 指定路径）。

**怎么选**：你的飞书工具能接收 SVG 就用 SVG。飞书服务端的解析器会把它转成可编辑节点，效果最稳。只有在工具不接收 SVG 时，才用节点 JSON。

## 常见写入方式（示例，以你环境里实际有的为准）

```bash
# A. lark-cli（lark-doc / lark-whiteboard 技能）——直接吃 SVG
node scripts/export-svg.mjs diagram.html
lark-cli whiteboard +update --whiteboard-token <token> --input_format svg \
  --source @./diagram.svg --overwrite --as user

#    写进文档时：把 diagram.svg 的 <svg>…</svg> 全文放进 lark-doc 的
#    <whiteboard type="svg"> … </whiteboard> 块（去掉首行 <?xml …?>）

# B. feishu CLI（feishu 技能）——没有 SVG 入口，用节点 JSON
node scripts/to-board.mjs diagram.html --board <whiteboard_id>   # 内置调用 create-notes，分批上传

# C. 只要一张图：直接把 diagram.svg（或浏览器截图 PNG）当图片插入文档
```

**写入前预检**（可选，有飞书官方工具时）：

```bash
npx -y @larksuite/whiteboard-cli@^0.2.12 -i diagram.svg -f svg -o preview.png   # 按画板规则渲染
npx -y @larksuite/whiteboard-cli@^0.2.12 -i diagram.svg -f svg --check          # 文字溢出 / 遮挡检查
```

`--check` 报的 `node-overlap` 是正常现象：圆点外圈、标签底色块本来就是叠放的，只要 `textOverflow` 和 `textOcclusion` 为 0 就算通过。

## 模板为适配画板做的约束（改模板时别破坏）

1. **只用解析器认识的元素**：`rect` / `circle` / `line` / `path`（M/L/H/V/Z） / `text`。不用 `filter`、渐变、`clipPath`、`mask`、`pattern`。
   图标（`g[data-icon]`）里的 path 已经由 `scripts/build-icons.mjs` 归一化：转为绝对坐标、椭圆弧转为贝塞尔曲线（飞书解析 rx≠ry 的弧会出错，database 一类图标会变形）。新增图标必须经过这个脚本处理。
2. **箭头一律用 `marker-end`**，不要单独画填充三角形，否则飞书解析器会把它转成朝上的三角形节点，方向就错了。
3. **文字必须是 `<text>`**，不能转成 path；画板会统一用 Noto Sans SC 重新排版，中文按约 1em、西文按约 0.6em 估宽，模板已经留了余量。
4. **字号**：12.5 在节点 JSON 通道里会取整成 13；SVG 通道由飞书服务端自己处理。

## 节点 JSON 通道的已知限制（to-board / svg2board.js）

1. **层级**：每个节点都写了显式 `z_index`，否则画板不保证按上传顺序叠放，标签底色会盖住文字（已处理）。
2. **线宽**：只有 `narrow / medium / bold` 三档，medium 的箭头头部过大，所以 ≤2px 的线都映射成 narrow。
3. **能创建的节点类型**：只用 `composite_shape / text_shape / connector / svg` 这四种。
4. **重复上传**：重复执行会在已有内容下方追加一份；需要覆盖时，先手动删掉旧图，或者改用 lark-cli 的 `--overwrite`。
