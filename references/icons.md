# 图标索引

> 资源文件：`../assets/icons.js`（模板已内联，`icon:'名称'` 直接引用）
> 可视预览：`../assets/icons-preview.html`（浏览器打开，按分类看图标长相）
> 来源：[Lucide](https://lucide.dev) 子集，ISC 协议可商用；24×24 线性、单色、随所属块的身份色着色
> 已为飞书画板归一化（弧线 → 贝塞尔），HTML 与画板显示一致

## 这些图标通用吗？

**通用。** 它们是语义图标（数据库、搜索、用户、盾牌……），不绑定任何业务。业务差异只体现在**选哪个**——所以本索引按「业务词 → 图标名」组织，选图标时按中文关键词查表即可。

选用规则：
1. 一个条目一个图标，**最接近的即可，不逐条权衡**（同类东西用同一个图标反而更易读，如所有数据库都用 `database`）
2. 表里查不到 → **随手挑一个就行**（有图标比语义准更重要）；**任务内不走「新增」流程**（文末流程是出图后另说的）
3. 全图要么都有图标，要么都没有

## 按分类（名称 · 适用的业务词）

### 人 / 组织
| 图标 | 适用 |
|---|---|
| `user` | 用户、个人、C 端 |
| `users` | 用户群、团队、业务用户、成员 |
| `user-cog` | 管理员、运营、知识管理员 |
| `user-check` | 实名、已认证用户、审核人 |
| `shield-user` | 权限主体、安全管理员 |
| `building` / `building-2` | 企业、租户、组织、B 端 |
| `store` | 商家、店铺、ISV 市场 |

### 终端 / 接入
| 图标 | 适用 |
|---|---|
| `monitor` | Web、控制台、PC 端 |
| `laptop` | 桌面客户端 |
| `smartphone` / `tablet` | 移动端、App、小程序 |
| `globe` | 公网、门户、H5、多地域 |
| `message-circle` / `message-square` | 对话、聊天、客服窗 |
| `message-square-text` / `messages-square` | 问答、多轮对话、会话 |
| `bot` / `bot-message-square` | 机器人、IM Bot、智能体 |
| `mail` | 邮件、通知 |
| `plug` | API、SDK、插件、集成 |
| `webhook` | Webhook、回调、事件推送 |
| `router` | 网关、API Gateway、路由 |
| `network` | 网络、负载均衡、SLB、服务网格 |
| `app-window` | 应用、小程序容器 |

### 应用 / 检索
| 图标 | 适用 |
|---|---|
| `layout-dashboard` | 看板、BI、驾驶舱 |
| `layout-grid` | 应用市场、工作台 |
| `search` | 搜索、检索、混合检索 |
| `text-search` | 全文索引、ES、关键词检索 |
| `scan-search` / `file-search` | 文档检索、语义检索 |
| `file-text` / `files` | 文档、文档助手、文件 |
| `book-open` / `library` | 知识库、百科、手册 |
| `notebook-pen` | 笔记、编辑、写作 |

### AI / 计算
| 图标 | 适用 |
|---|---|
| `sparkles` | 生成、AIGC、答案生成 |
| `wand-sparkles` | 改写、优化、润色、Prompt |
| `brain` / `brain-circuit` | 大模型、LLM、推理、意图识别 |
| `cpu` | 算力、GPU、推理服务、worker |
| `workflow` | 工作流、编排、Agent 流程 |
| `git-branch` / `git-merge` | 分支、路由、合并、版本 |
| `list-checks` | 任务规划、待办、检查项 |

### 数据加工
| 图标 | 适用 |
|---|---|
| `scissors` | 切片、分块、Chunk |
| `layers` / `layers-3` | 分层、上下文组装、多级缓存 |
| `split` / `combine` | 拆分 / 合并、分流 / 汇聚 |
| `filter` / `funnel` | 过滤、清洗、转化漏斗 |
| `arrow-down-wide-narrow` / `sort-desc` | 排序、重排、Rerank |
| `scan-text` | 文档解析、OCR |
| `scan-eye` | 版面分析、视觉识别、审核 |
| `binary` | 向量化、Embedding、编码 |
| `hash` | 哈希、ID、去重 |
| `tags` / `tag` | 标签、元数据、分类、优惠券 |

### 存储
| 图标 | 适用 |
|---|---|
| `database` | 数据库、向量库、MySQL |
| `database-zap` | 索引入库、实时库、写入 |
| `hard-drive` | 磁盘、块存储 |
| `archive` | 对象存储、OSS、归档、原始文件 |
| `table` / `table-2` / `table-properties` | 关系库、数据表、元数据表 |
| `file-spreadsheet` | 表格、报表、Excel |
| `boxes` / `box` / `package` | 库存、商品、制品、打包 |
| `zap` | 缓存、Redis、加速 |

### 基础设施
| 图标 | 适用 |
|---|---|
| `server` / `server-cog` | 服务器、服务、节点 |
| `cloud` / `cloud-cog` | 云、云服务、托管 |
| `container` | 容器、K8s、Docker |
| `inbox` | 消息队列、收件、任务池 |
| `send` | 事件总线、投递、发布 |
| `calendar-clock` / `clock` / `timer` | 任务调度、定时、限时、秒杀 |
| `refresh-cw` / `repeat` | 同步、重试、事务补偿 |
| `rocket` | 部署、发布、加速 |

### 安全
| 图标 | 适用 |
|---|---|
| `shield` / `shield-check` | 安全、权限隔离、合规、质检 |
| `lock` | 加密、私有、锁 |
| `key` / `key-round` | 鉴权、SSO、Token、密钥 |
| `fingerprint` | 身份、生物识别、设备指纹 |

### 观测 / 运营
| 图标 | 适用 |
|---|---|
| `activity` | 可观测、链路追踪、日志、监控 |
| `gauge` | 评估、指标、性能、SLA |
| `chart-line` / `chart-bar` / `chart-pie` | 统计、趋势、报表 |
| `bell` / `bell-ring` | 告警、通知 |
| `eye` / `radar` | 审计、巡检、探测 |
| `thumbs-up` / `badge-check` / `circle-check` | 满意度、反馈、认证、通过 |

### 配置 / 工具
| 图标 | 适用 |
|---|---|
| `settings` / `settings-2` / `cog` | 配置、设置、配置中心 |
| `sliders-horizontal` | 规则、参数、策略 |
| `wrench` / `hammer` | 工具、工具调用、运维 |
| `code` / `braces` / `file-code` | 代码、脚本、函数 |
| `terminal` / `square-terminal` | 开发者、CLI、命令行 |

### 连接 / 地理
| 图标 | 适用 |
|---|---|
| `link` / `link-2` / `cable` | 连接、关联、专线 |
| `share-2` | 分享、分发 |
| `waypoints` / `route` | 路由、链路、调用链 |
| `compass` / `map` | 导航、地址、地域 |

### 交易
| 图标 | 适用 |
|---|---|
| `coins` / `dollar-sign` | 计费、价格、成本 |
| `wallet` / `credit-card` | 支付、账户、钱包 |
| `receipt` | 订单、账单、发票 |

### 其他
`image` `file-image`（图片、多模态）· `quote`（引用溯源）· `list`（列表、目录）

## 通用兜底

| 情况 | 用 |
|---|---|
| 某种"服务"，说不清具体做什么 | `server` |
| 某种"数据"，说不清存哪 | `database` |
| 某种"能力 / 模块" | `box` |
| 某种"处理步骤" | `cog` |

## 场景速查（常见架构图的推荐组合）

| 场景 | 推荐 |
|---|---|
| RAG / 知识库 | 解析 `scan-text` · 切片 `scissors` · 向量化 `binary` · 入库 `database-zap` · 改写 `wand-sparkles` · 检索 `search` · 重排 `arrow-down-wide-narrow` · 组装 `layers` · 生成 `sparkles` · 向量库 `database` · 全文 `text-search` |
| Agent 平台 | 智能体 `bot` · 规划 `list-checks` · 工具调用 `wrench` · 记忆 `brain` · 编排 `workflow` · MCP/插件 `plug` |
| 电商 | 订单 `receipt` · 支付 `credit-card` · 商品 `package` · 库存 `boxes` · 优惠 `tag` · 秒杀 `timer` |
| 微服务 / 部署 | 网关 `router` · 服务 `server` · 容器 `container` · 队列 `inbox` · 配置 `settings` · 监控 `activity` |

## 新增 / 优化图标

```bash
# 1. 准备 Lucide 源（任意临时目录）
npm i lucide-static svgpath
# 2. 在 https://lucide.dev/icons 找到名字，追加生成（已有图标会保留）
node <skill>/scripts/build-icons.mjs node_modules/lucide-static/dist/svg  new-icon-a new-icon-b
#    → 重写 assets/icons.js，注入 engine-structure.js，并重建 template-structure.html 参考产物
# 3. 在本文件对应分类里登记「名称 · 适用业务词」
# 4. 重新生成预览页
node <skill>/scripts/build-icons.mjs --preview
```

> lucide-static 的 svg 目录因版本不同可能是 `icons/` 或 `dist/svg/`，以实际为准。
