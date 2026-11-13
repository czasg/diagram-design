/* ── Step 1 内容建模（写出来，不在心里做）──
 * 主线：编排引擎只负责调度——上层调用方发起任务，中层框架零业务依赖（调度循环 + 扩展点接口），
 *       能力全部外挂在扩展层（装饰器包节点 / 切面插时机），最底层是外部依赖。
 * 各块关系类型：
 *   调用方          → 并列 4 项（同步/异步发起 + 多轮续跑 + 事件消费端）
 *   框架层          → 分组两行：① 一次任务的执行链是**流水线**（8 步，flow 画箭头；单行会把画布拉爆 →
 *                      wrap:4 蛇形折行：1→2→3→4 ↓ 8←7←6←5，回折是竖线）+ 侧挂「状态与事件」(tint)；
 *                      ② core 与扩展点接口并列 6 项 → wrap:3（>5 必须换行）
 *   扩展层          → 三个带 title 的子分组（provider / decorator / hook），**上下堆叠**（dir:col，
 *                      避免「组宽×组数」相乘超宽，见 structure.md 坑 11）；切面 11 项 → wrap:4，
 *                      且按语义排行：人机中断 → 注入治理 → 上下文/工具
 *   外部依赖        → 并列 3 项（被扩展层调用，堆叠表达依赖，不画线）
 * 信息深度：全图统一「卡片 = 图标 + 名称 + 一行说明」（B 级），无 flat。
 * 布局策略：层用 tag 左标签；执行链用 flow；状态事件用 tint 侧挂（grow:1）；
 *   超 5 项的两处用 wrap（核心包 wrap:3、切面 wrap:4）；LINKS 留空——层间依赖靠堆叠表达。
 */
const DIAGRAM = {
  title: '示例 · 智能体编排引擎',
  subtitle: '语法演示完整成品：分层 tag + 8 步流水线蛇形（flow+wrap）+ 侧挂 tint + 多子分组 wrap + 图标',
  width: 0,
  root: { dir:'col', children:[

    { tag:['调用方'], color:'#3E63DD', children:[
      {t:'同步调用', d:['单轮 · 阻塞返回'], icon:'send'},
      {t:'异步调用', d:['事件通道 · 非阻塞'], icon:'activity'},
      {t:'多轮会话', d:['携带上下文续跑'], icon:'messages-square'},
      {t:'渲染层 / UI', d:['消费事件 · 回传决策'], icon:'monitor'} ]},

    { tag:['框架层'], color:'#7B4A9E', dir:'col', children:[
      { bare:true, dir:'row', children:[
        { title:'一次任务的执行链 · 引擎只负责调度', flow:true, grow:3, wrap:4, children:[
          {t:'① 前置钩子', d:['注入工具 · 修理上下文'], icon:'package'},
          {t:'模型节点', d:['②→③ 装饰链包裹'], icon:'brain'},
          {t:'④ 工具准入', d:['并发判定 · 短路中止'], icon:'filter'},
          {t:'工具泳道', d:['每调用独立 · 全并发执行'], icon:'wrench'},
          {t:'⑤ 工具回收', d:['随调用并发 · 可改写结果'], icon:'layers'},
          {t:'⑥ 回边钩子', d:['回边 · 迭代守卫'], icon:'repeat'},
          {t:'⑦ 收尾钩子', d:['摘要 · 会话快照'], icon:'archive'},
          {t:'最终输出', d:['状态 + 事件流返回'], icon:'sparkles'} ]},
        { title:'状态与事件', tint:true, dir:'col', grow:1, children:[
          {t:'运行状态', d:['可序列化 · 可恢复'], icon:'database'},
          {t:'事件流', d:['订阅 / 异步实时推送'], icon:'activity'} ]},
      ]},
      { title:'core 与扩展点接口 · 零扩展依赖', wrap:3, children:[
        {t:'core', d:['组装 · 调度引擎 · 分叉'], icon:'workflow'},
        {t:'types', d:['State · Message · Tool'], icon:'boxes'},
        {t:'hook', d:['7 小接口 · 短路返回'], icon:'list-checks'},
        {t:'decorator', d:['Handler + Chain 装饰'], icon:'box'},
        {t:'provider', d:['Model / Stream 抽象'], icon:'brain'},
        {t:'event', d:['事件定义 · 出口'], icon:'webhook'} ]},
    ]},

    { tag:['扩展层'], color:'#0E9AA7', dir:'col', children:[
      { title:'ext/provider · 模型接入', children:[
        {t:'openai', d:['Invoke + SSE 流式'], icon:'brain'},
        {t:'anthropic', d:['Claude 系列接入'], icon:'brain'},
        {t:'responses', d:['Responses 协议'], icon:'brain'},
        {t:'provutil', d:['公共工具集'], icon:'wrench'} ]},
      { title:'ext/decorator · 节点装饰', children:[
        {t:'retry', d:['指数退避重试'], icon:'refresh-cw'},
        {t:'limit', d:['跨工具并发闸'], icon:'sliders-horizontal'},
        {t:'safetool', d:['panic 防护'], icon:'shield-check'} ]},
      { title:'ext/hook · 流程切面 ×11', wrap:4, children:[
        {t:'approve', d:['工具审批 · 决策中断'], icon:'user-check'},
        {t:'askuser', d:['提问中断 · 等回答'], icon:'message-circle'},
        {t:'taskplan', d:['规划中断 · 可修订'], icon:'notebook-pen'},
        {t:'task', d:['并行分身'], icon:'git-branch'},
        {t:'mcp', d:['单工具封装 · 热加载'], icon:'plug'},
        {t:'skill', d:['技能注入 · *.md'], icon:'book-open'},
        {t:'summary', d:['结束摘要入 Metadata'], icon:'file-text'},
        {t:'contextfix', d:['修理上下文 · 协议完整'], icon:'wrench'},
        {t:'offload', d:['大结果卸载留摘要'], icon:'package'},
        {t:'filetools', d:['读写改执行四件套'], icon:'terminal'},
        {t:'session', d:['滚动快照 · 续跑'], icon:'hard-drive'} ]},
    ]},

    { tag:['外部 依赖'], color:'#5B6B82', children:[
      {t:'LLM API', d:['OpenAI · Anthropic · DeepSeek'], icon:'brain'},
      {t:'MCP Server', d:['stdio / SSE 协议'], icon:'server'},
      {t:'本地资源', d:['FileSystem · terminal · sessions'], icon:'files'} ]},
  ]},
};

/* 可选：叶子之间的少量关系线 [起点id, 终点id, '标签', 是否虚线]。≤ 8 条 */
const LINKS = [];
