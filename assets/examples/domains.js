/* 示例：业务域并列（不分层）
 * 建模：四个域是「并列」关系，各自包含服务 → 一个横排放 4 个竖排域；共享底座是「被依赖」→ 下方单独一行
 * 深度统一：全部「卡片 + 一行说明」
 */
const DIAGRAM = {
  title: '电商中台 · 业务域划分',
  subtitle: '四个业务域并列，各自包含若干服务；共享底座单独成行',
  width: 0,
  root: { dir:'col', children:[
    { bare:true, dir:'row', children:[
      { title:'交易域', color:'#3E63DD', dir:'col', children:[
        {t:'购物车', d:['加购 · 合并'], icon:'inbox'},
        {t:'订单服务', d:['下单 · 拆单'], id:'order', icon:'receipt'},
        {t:'支付网关', d:['微信 · 支付宝'], icon:'credit-card'} ]},
      { title:'商品域', color:'#0E9AA7', dir:'col', children:[
        {t:'商品中心', d:['SPU / SKU'], icon:'package'},
        {t:'库存服务', d:['预占 · 扣减'], id:'stock', icon:'boxes'},
        {t:'价格引擎', d:['定价 · 促销价'], icon:'dollar-sign'} ]},
      { title:'用户域', color:'#7B4A9E', dir:'col', children:[
        {t:'账号', d:['注册 · 登录'], icon:'user'},
        {t:'会员等级', d:['积分 · 权益'], icon:'badge-check'},
        {t:'地址簿', d:['收货地址'], icon:'map'} ]},
      { title:'营销域', color:'#C4713F', dir:'col', children:[
        {t:'优惠券', d:['发放 · 核销'], icon:'tag'},
        {t:'满减活动', d:['规则引擎'], icon:'sliders-horizontal'},
        {t:'秒杀', d:['限流 · 排队'], icon:'timer'} ]},
    ]},
    { tag:['共享底座'], color:'#5B6B82', children:[
      {t:'消息队列', d:['事件总线'], id:'mq', icon:'send'},
      {t:'配置中心', d:['动态配置'], icon:'settings'},
      {t:'分布式事务', d:['TCC · Saga'], icon:'repeat'},
      {t:'搜索', d:['商品检索'], icon:'search'} ]},
  ]},
};
const LINKS = [ ['order','stock','预占库存'], ['order','mq','订单事件', 1] ];
