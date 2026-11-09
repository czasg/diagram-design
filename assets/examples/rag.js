/* 云知识库 RAG 平台 · 结构图 v2
 *
 * ── Step 1 内容建模（写出来，不在心里做）──
 * 主线：文档进来被加工成可检索的知识，问题进来走检索链路拿到有出处的答案；底下是存储与模型。
 * 各块关系类型：
 *   用户 / 入口     → 并列，谁在用 & 从哪进 —— 合成一层「使用方」，两组并列（原图两层都只有 3–5 个短词，太薄）
 *   应用            → 并列，4 种能力
 *   RAG 引擎        → 两条**流水线**（离线加工、在线检索）+ 一组侧挂**治理**
 *                     → 流水线必须画箭头，这是这张图区别于普通分层图的核心
 *   存储 / 模型     → 并列，且与引擎是「被依赖」关系（堆叠表达，不画线）
 *   基础设施        → 并列，6 个 → wrap:3 分两行（>5 不单行堆）
 * 信息深度：统一为「卡片 = 图标 + 名称 + 一行说明」。原图用户/接入/基础设施只有名字 → 补说明。
 * 补料：用户补职责；入口补协议；基础设施补用途；离线链路补「入库」一步，使它与在线链路对称（各 5 步）。
 */
const DIAGRAM = {
  title: '云知识库 RAG 平台 · 系统架构',
  subtitle: '文档经离线链路加工入库，问题经在线链路检索生成带出处的答案；下层为存储、模型与基础设施',
  width: 0,
  root: { dir:'col', children:[

    { tag:['使用方'], color:'#3E63DD', children:[
      { title:'用户', grow:3, children:[
        {t:'知识管理员', d:['建库 · 授权 · 审核'], icon:'user-cog'},
        {t:'业务用户', d:['提问 · 检索 · 反馈'], icon:'users'},
        {t:'开发者 / ISV', d:['集成 · 二次开发'], icon:'square-terminal'} ]},
      { title:'接入渠道', grow:4, children:[
        {t:'Web 控制台', d:['知识库管理'], icon:'monitor'},
        {t:'对话助手', d:['网页 · 移动端'], icon:'message-circle'},
        {t:'IM 机器人', d:['飞书 · 企微'], icon:'bot'},
        {t:'OpenAPI', d:['REST · SDK'], icon:'plug'} ]},
    ]},

    { tag:['应用层'], color:'#0E9AA7', children:[
      {t:'知识问答', d:['多轮对话 · 引用溯源'], icon:'message-square-text'},
      {t:'智能检索', d:['语义搜索 · 结果摘要'], icon:'search'},
      {t:'文档助手', d:['总结 · 对比 · 改写'], icon:'file-text'},
      {t:'Agent 工作流', d:['工具调用 · 编排'], icon:'workflow'} ]},

    { tag:['RAG 引擎'], color:'#7B4A9E', children:[
      { bare:true, dir:'col', grow:4, children:[
        { title:'离线 · 知识加工', flow:true, children:[
          {t:'文档解析', d:['PDF · Office · OCR'], icon:'scan-text'},
          {t:'智能切片', d:['结构 · 语义切分'], icon:'scissors'},
          {t:'元数据抽取', d:['标签 · 权限 · 时效'], icon:'tags'},
          {t:'向量化', d:['Embedding 批量'], icon:'binary'},
          {t:'索引入库', d:['向量 + 全文双写'], icon:'database-zap'} ]},
        { title:'在线 · 检索生成', flow:true, children:[
          {t:'查询改写', d:['补全 · 拆解'], icon:'wand-sparkles'},
          {t:'混合检索', d:['向量 + 关键词'], icon:'search'},
          {t:'重排序', d:['Rerank 精排'], icon:'arrow-down-wide-narrow'},
          {t:'上下文组装', d:['去重 · 截断'], icon:'layers'},
          {t:'答案生成', d:['LLM · 附引用'], icon:'sparkles'} ]},
      ]},
      { title:'治理与评估', tint:true, dir:'col', grow:1, children:[
        {t:'权限隔离', d:['租户 · 空间 · ACL'], icon:'shield-check'},
        {t:'效果评估', d:['召回率 · 忠实度'], icon:'gauge'},
        {t:'可观测', d:['链路追踪 · 成本'], icon:'activity'} ]},
    ]},

    { tag:['数据存储'], color:'#C4713F', children:[
      {t:'向量库', d:['Milvus'], icon:'database'},
      {t:'全文索引', d:['Elasticsearch'], icon:'text-search'},
      {t:'对象存储', d:['原始文档'], icon:'archive'},
      {t:'关系库', d:['元数据 · 权限'], icon:'table'},
      {t:'缓存', d:['Redis'], icon:'zap'} ]},

    { tag:['模型服务'], color:'#1B7D57', children:[
      {t:'大语言模型', d:['生成 · 改写'], icon:'brain'},
      {t:'Embedding', d:['文本向量化'], icon:'binary'},
      {t:'Rerank', d:['精排打分'], icon:'arrow-down-wide-narrow'},
      {t:'版面解析', d:['OCR · 表格识别'], icon:'scan-eye'} ]},

    { tag:['基础设施'], color:'#5B6B82', wrap:3, children:[
      {t:'开放网关', d:['鉴权 · 限流'], icon:'router'},
      {t:'K8s 容器', d:['弹性伸缩'], icon:'container'},
      {t:'消息队列', d:['加工任务分发'], icon:'inbox'},
      {t:'任务调度', d:['定时 · 重试'], icon:'calendar-clock'},
      {t:'统一鉴权', d:['SSO · Token'], icon:'key-round'},
      {t:'监控告警', d:['指标 · 日志'], icon:'bell-ring'} ]},
  ]},
};
const LINKS = [];
