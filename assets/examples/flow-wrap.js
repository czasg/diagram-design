/* 示例：长流水线蛇形折行（flow + wrap）
 *
 * 建模：一次 Run / 一次处理链路步骤多（本例 8 步），单行会把画布拉成横幅、
 *       其他层被等宽拉出大片空白 → 必须 wrap:N。
 * 蛇形（boustrophedon）：模板自动处理——
 *   **固定列宽按 wrap 算**（不按行内个数），偶数行占列 0,1,2…，
 *   奇数行从右往左占列 wrap-1,wrap-2… → 行末卡与下行首卡列对列、中心重合：
 *
 *     1 → 2 → 3 → 4          8 步 wrap:4 → 4+4，两行都满
 *                   ↓         7 步 wrap:4 → 4+3，下行靠右占 1–3 列，
 *     8 ← 7 ← 6 ← 5          左侧空 1 列——④⑤ 仍在最右列，回折都是纯竖线
 *
 * 数据仍按语义顺序平铺 children，不要自己反序；反序由渲染完成。
 * 何时用：步骤 >5 且估宽会撑破画布的 flow；箭头不能断（不能拆成两个独立 flow）。
 */
const DIAGRAM = {
  title: '示例 · 长流水线蛇形折行',
  subtitle: '语法演示：flow + wrap:N —— 步骤多时折成多行，蛇形回折保持箭头不断',
  width: 0,
  root: { dir:'col', children:[

    { tag:['入口'], color:'#3E63DD', children:[
      {t:'Web 控制台', d:['嵌入式对话窗'], icon:'monitor'},
      {t:'OpenAPI', d:['REST · SDK'], icon:'plug'},
      {t:'IM 机器人', d:['飞书 · 企微'], icon:'bot'} ]},

    { tag:['处理 链路'], color:'#7B4A9E', children:[
      /* 8 步 + wrap:4 → 两行等宽蛇形（4+4）；children 仍按 1→8 语义顺序写 */
      { title:'一次请求的处理链路 · 8 步', flow:true, wrap:4, children:[
        {t:'① 意图识别', d:['分类 · 槽位'], icon:'brain'},
        {t:'② 查询改写', d:['补全 · 拆解'], icon:'wand-sparkles'},
        {t:'③ 知识检索', d:['向量 + 关键词'], icon:'search'},
        {t:'④ 重排序', d:['Rerank 精排'], icon:'arrow-down-wide-narrow'},
        {t:'⑤ 上下文组装', d:['去重 · 截断'], icon:'layers'},
        {t:'⑥ 答案生成', d:['LLM · 附引用'], icon:'sparkles'},
        {t:'⑦ 结果校验', d:['引用核实 · 格式'], icon:'badge-check'},
        {t:'⑧ 会话归档', d:['快照 · 续聊'], icon:'archive'} ]},
      { title:'旁路', tint:true, dir:'col', grow:1, children:[
        {t:'限流重试', d:['指数退避'], icon:'refresh-cw'},
        {t:'人工接管', d:['排队 · 分配'], icon:'users'} ]},
    ]},

    { tag:['数据'], color:'#0E9AA7', wrap:3, children:[
      {t:'会话库', d:['全量对话记录'], icon:'database'},
      {t:'知识库', d:['FAQ · 文档向量'], icon:'library'},
      {t:'用户画像', d:['标签 · 历史'], icon:'users'},
      {t:'向量索引', d:['Embedding 批写'], icon:'binary'},
      {t:'审计日志', d:['操作 · 决策'], icon:'file-text'},
      {t:'缓存', d:['热问答命中'], icon:'zap'} ]},
  ]},
};
const LINKS = [];
