/**
 * 使用 pg 库直接查询数据库
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:35n7KexN4q6dBKDK7O@cp-spicy-veil-43160cfe.pg4.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require&channel_binding=require',
});

async function queryDatabase() {
  console.log('=== 直接查询数据库 ===\n');
  
  try {
    // 1. 查询总记录数
    console.log('1. 查询总记录数...');
    const countResult = await pool.query('SELECT COUNT(*) FROM words');
    console.log(`   总记录数: ${countResult.rows[0].count}`);
    
    // 2. 查询各分类记录数
    console.log('\n2. 查询各分类记录数...');
    const catResult = await pool.query(`
      SELECT c.name, COUNT(w.id) as count 
      FROM words w 
      JOIN vocabulary_categories c ON w.category_id = c.id 
      GROUP BY c.name, c.id
      ORDER BY count DESC
    `);
    catResult.rows.forEach(row => {
      console.log(`   ${row.name}: ${row.count}`);
    });
    
    // 3. 查询唯一单词数
    console.log('\n3. 查询唯一单词数...');
    const uniqueResult = await pool.query('SELECT COUNT(DISTINCT LOWER(word)) as unique_count FROM words');
    console.log(`   唯一单词数: ${uniqueResult.rows[0].unique_count}`);
    
    // 4. 查询同一分类中的重复单词
    console.log('\n4. 查询同一分类中的重复单词（前10个）...');
    const dupResult = await pool.query(`
      SELECT word, category_id, COUNT(*) as cnt 
      FROM words 
      GROUP BY word, category_id 
      HAVING COUNT(*) > 1 
      ORDER BY cnt DESC 
      LIMIT 10
    `);
    
    if (dupResult.rows.length > 0) {
      dupResult.rows.forEach(row => {
        console.log(`   "${row.word}" in category ${row.category_id}: ${row.cnt} 条记录`);
      });
    } else {
      console.log('   没有发现同一分类中的重复');
    }
    
    // 5. 统计重复记录总数
    console.log('\n5. 统计重复记录总数...');
    const totalDupResult = await pool.query(`
      SELECT SUM(cnt - 1) as to_delete FROM (
        SELECT word, category_id, COUNT(*) as cnt 
        FROM words 
        GROUP BY word, category_id 
        HAVING COUNT(*) > 1
      ) t
    `);
    console.log(`   需要删除的重复记录: ${totalDupResult.rows[0].to_delete || 0}`);
    
    // 6. 分析重复原因
    console.log('\n6. 分析重复示例（查看具体记录）...');
    const sampleResult = await pool.query(`
      SELECT id, word, category_id, created_at 
      FROM words 
      WHERE word = (SELECT word FROM words GROUP BY word, category_id HAVING COUNT(*) > 1 LIMIT 1)
      ORDER BY id
      LIMIT 10
    `);
    
    if (sampleResult.rows.length > 0) {
      console.log(`   单词 "${sampleResult.rows[0].word}" 的记录:`);
      sampleResult.rows.forEach(row => {
        console.log(`     ID: ${row.id}, 分类: ${row.category_id}, 创建时间: ${row.created_at}`);
      });
    }
    
  } finally {
    await pool.end();
  }
}

queryDatabase().catch(console.error);
