/* 示例：部署分区（三级嵌套：区 → 集群 → 节点）
 * 建模：两可用区「对称并列」上下堆叠（主区），公共服务「侧挂」右侧 → 控制宽高比；
 *       节点信息量很少 → 全图统一用无说明的矮卡片
 * 说明：深度统一不等于必须有说明——统一「都有」或「都没有」即可
 */
const DIAGRAM = {
  title: '生产环境部署',
  subtitle: '双可用区 + 公共服务区；跨区只画关键链路',
  width: 0,
  root: { dir:'row', children:[
    { bare:true, dir:'col', grow:3, children:[
      { title:'可用区 A', color:'#3E63DD', dir:'col', children:[
        { title:'K8s 集群', wrap:2, children:[
          {t:'gateway ×2', icon:'router'},{t:'api ×4', icon:'server'},
          {t:'worker ×3', icon:'cpu'},{t:'scheduler', icon:'calendar-clock'} ]},
        { title:'数据', children:[ {t:'Redis 主', icon:'zap'},{t:'MySQL 主', id:'dbA', icon:'database'} ]},
      ]},
      { title:'可用区 B', color:'#1B7D57', dir:'col', children:[
        { title:'K8s 集群', wrap:2, children:[
          {t:'gateway ×2', icon:'router'},{t:'api ×4', icon:'server'},
          {t:'worker ×3', icon:'cpu'},{t:'scheduler', icon:'calendar-clock'} ]},
        { title:'数据', children:[ {t:'MySQL 从', id:'dbB', icon:'database'},{t:'Redis 从', icon:'zap'} ]},
      ]},
    ]},
    { title:'公共服务', color:'#5B6B82', tint:true, dir:'col', grow:1, children:[
      {t:'SLB', icon:'network'},{t:'OSS', icon:'archive'},{t:'日志 / 监控', icon:'activity'} ]},
  ]},
};
const LINKS = [ ['dbA','dbB','binlog 同步', 1] ];
