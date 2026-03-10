/**
 * 检查生产环境用户数据
 */

const PRODUCTION_API = 'https://8qcfzhhw7t.coze.site';

async function checkProductionUsers() {
  console.log('=== 检查生产环境用户数据 ===\n');
  
  // 尝试获取用户统计（如果有这个 API）
  try {
    const response = await fetch(`${PRODUCTION_API}/api/admin/init`);
    const data = await response.json();
    console.log('基础信息:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('获取基础信息失败');
  }
  
  // 检查是否有练习记录 API
  try {
    const response = await fetch(`${PRODUCTION_API}/api/practice/stats`);
    const data = await response.json();
    console.log('\n练习统计:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('\n没有练习统计 API');
  }
  
  // 检查登录/注册
  try {
    const response = await fetch(`${PRODUCTION_API}/api/auth/me`);
    const data = await response.json();
    console.log('\n用户状态:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('\n没有用户状态 API');
  }
}

checkProductionUsers().catch(console.error);
