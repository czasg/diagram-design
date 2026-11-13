const TITLE    = '报销审批流程';
const SUBTITLE = '大额走审批 · 小额直通 · 驳回重提';

/* 责任带（可选）：省略 LANES = 无责任带。带名纯文字，颜色按顺序自动取四色 */
const LANES = [ {t:'员工'}, {t:'系统'}, {t:'经理'}, {t:'财务'} ];

/* 主干：自上而下一条直线，判断的“是”出口直下
   shape：'action'（默认·卡片）| 'decision'（菱形）| 'start' | 'end'（胶囊）
   yes：判断直下出口标签（必填且补语义如 '是：大额'，裸 '是' lint 拦） */
const TRUNK = [
  { id:'s',  t:'开始',          shape:'start', lane:0 },
  { id:'a',  t:'提交报销单',    lane:0 },
  { id:'d1', t:'金额 > 1000？', shape:'decision', lane:1, yes:'是：大额' },
  { id:'b',  t:'部门经理审批',  lane:2 },
  { id:'d2', t:'通过？',        shape:'decision', lane:2, yes:'是：通过' },
  { id:'c',  t:'打款',          lane:3 },
  { id:'e',  t:'完成',          shape:'end', lane:3 },
];

/* 侧支：挂在主干判断的左/右出口，汇回主干节点
   side:'l'|'r'（缺省 quick→l、err→r）· style:'quick'（琥珀）| 'err'（红）
   label：出口标签（必填，补语义）· toSide：汇回接口侧（缺省按左右方向）
   back:true = 汇回边虚线（回边/重试）· toLabel：汇回边标签 */
const BRANCHES = [
  { from:'d1', side:'l', label:'否：小额', style:'quick',
    nodes:[{ id:'q1', t:'自动通过', lane:1 }], to:'c', toSide:'l' },
  { from:'d2', side:'r', label:'否：驳回', style:'err', back:true, toLabel:'重提≤3次',
    nodes:[{ id:'x1', t:'退回修改', lane:0 }], to:'a', toSide:'r' },
];
