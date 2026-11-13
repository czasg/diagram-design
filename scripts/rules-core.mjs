/* rules-core.mjs —— 红线数字单源
 *
 * 使用方：
 *   - scripts/lint-data.mjs        直接 import（build 阶段跑数据 lint）
 *   - assets/engine-*.js           顶部 LIMITS 占位（__LIMITS__ 标记）由
 *                                  build-diagram.mjs 用本文件的 JSON 覆盖注入
 * 改红线只改这里，然后重新 build（模板参考产物会一并刷新）。
 */
export const LIMITS = {
  structureRowMax: 5,   // 结构图：非流水线横排子项上限（超了 wrap:N / 拆子分组）
  fcNodes: 15,          // 流程图：节点总数红线（超了拆主图 + 子流程卡）
  fcDecisions: 5,       // 流程图：判断总数红线
  fcBranches: 4,        // 流程图：侧支总数红线
  fcLanesMin: 2,        // 流程图：责任带条数下限（声明了 LANES 才查）
  fcLanesMax: 7,        // 流程图：责任带条数上限
  flowFrags: 3,         // 时序图：片段数建议上限
  flowFragDepth: 2,     // 时序图：片段嵌套层建议上限
  flowNotes: 3,         // 时序图：注释条数建议上限
};
