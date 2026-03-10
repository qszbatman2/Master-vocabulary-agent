/**
 * 直接查询生产环境数据库
 */

const { execSync } = require('child_process');

// 从环境变量获取数据库连接
const pgUrl = 'postgresql://postgres:35n7KexN4q6dBKDK7O@cp-spicy-veil-43160cfe.pg4.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require&channel_binding=require';

async function queryProductionDB() {
  console.log('=== 直接查询生产环境数据库 ===\n');
  
  // 1. 查询总记录数
  console.log('1. 查询总记录数...');
  const countResult = execSync(`psql "${pgUrl}" -t -c "SELECT COUNT(*) FROM words;"`, { encoding: 'utf-8' });
  console.log(`   总记录数: ${countResult.trim()}`);
  
  // 2. 查询各分类记录数
  console.log('\n2. 查询各分类记录数...');
  const catResult = execSync(`psql "${pgUrl}" -t -c "
    SELECT c.name, COUNT(w.id) as count 
    FROM words w 
    JOIN vocabulary_categories c ON w.category_id = c.id 
    GROUP BY c.name 
    ORDER BY count DESC;"`, { encoding: 'utf-8' });
  console.log(catResult);
  
  // 3. 查询唯一单词数
  console.log('3. 查询唯一单词数...');
  const uniqueResult = execSync(`psql "${pgUrl}" -t -c "SELECT COUNT(DISTINCT LOWER(word)) FROM words;"`, { encoding: 'utf-8' });
  console.log(`   唯一单词数: ${uniqueResult.trim()}`);
  
  // 4. 查询重复情况
  console.log('\n4. 查询同一分类中的重复单词...');
  const dupResult = execSync(`psql "${pgUrl}" -t -c "
    SELECT word, category_id, COUNT(*) as cnt 
    FROM words 
    GROUP BY word, category_id 
    HAVING COUNT(*) > 1 
    ORDER BY cnt DESC 
    LIMIT 10;"`, { encoding: 'utf-8' });
  console.log(dupResult || '   没有重复');
  
  // 5. 查询重复总数
  console.log('5. 统计重复记录总数...');
  const totalDupResult = execSync(`psql "${pgUrl}" -t -c "
    SELECT SUM(cnt - 1) as to_delete FROM (
      SELECT word, category_id, COUNT(*) as cnt 
      FROM words 
      GROUP BY word, category_id 
      HAVING COUNT(*) > 1
    ) t;"`, { encoding: 'utf-8' });
  console.log(`   需要删除的重复记录: ${totalDupResult.trim()}`);
}

queryProductionDB().catch(console.error);
