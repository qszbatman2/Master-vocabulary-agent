/**
 * 深入分析生产环境数据 - 检查同一分类中的重复
 */

const PRODUCTION_API = 'https://8qcfzhhw7t.coze.site';

async function analyzeDuplicates() {
  console.log('=== 深入分析生产环境重复数据 ===\n');
  
  // 获取托福词汇分类（最多记录）的详细信息
  console.log('分析托福词汇分类（19423条记录）...\n');
  
  const pageSize = 500;
  const allRecords: Array<{ id: number; word: string }> = [];
  
  // 获取前几页数据
  for (let page = 1; page <= 3; page++) {
    const response = await fetch(`${PRODUCTION_API}/api/vocabulary?categoryId=2&limit=${pageSize}&page=${page}`);
    const data = await response.json();
    
    if (data.words && data.words.length > 0) {
      console.log(`第 ${page} 页数据示例（前5个）:`);
      data.words.slice(0, 5).forEach((w: any) => {
        console.log(`  ID: ${w.id}, 单词: "${w.word}"`);
      });
      
      allRecords.push(...data.words.map((w: any) => ({ id: w.id, word: w.word.toLowerCase() })));
    }
  }
  
  // 分析重复
  console.log(`\n已获取 ${allRecords.length} 条记录`);
  
  const wordCounts = new Map<string, number>();
  for (const r of allRecords) {
    wordCounts.set(r.word, (wordCounts.get(r.word) || 0) + 1);
  }
  
  // 找出重复最多的单词
  const sorted = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]);
  
  console.log('\n重复次数最多的单词（前10个）:');
  sorted.slice(0, 10).forEach(([word, count]) => {
    console.log(`  "${word}": ${count} 次`);
  });
  
  // 统计唯一单词
  console.log(`\n前 ${allRecords.length} 条记录中:`);
  console.log(`  唯一单词数: ${wordCounts.size}`);
  console.log(`  平均每词出现: ${(allRecords.length / wordCounts.size).toFixed(2)} 次`);
  
  // 检查数据库是否有大量重复 ID
  const uniqueIds = new Set(allRecords.map(r => r.id));
  console.log(`  唯一 ID 数: ${uniqueIds.size}`);
  
  // 检查是否有 ID 重复
  if (uniqueIds.size < allRecords.length) {
    console.log(`  ⚠️ 警告: 有重复 ID！`);
  }
  
  // 检查数据格式
  console.log('\n检查数据格式...');
  const response = await fetch(`${PRODUCTION_API}/api/vocabulary?categoryId=2&limit=5&page=1`);
  const data = await response.json();
  
  if (data.words && data.words.length > 0) {
    console.log('\n完整单词记录示例:');
    console.log(JSON.stringify(data.words[0], null, 2));
  }
  
  // 分析结论
  console.log('\n=== 问题诊断 ===');
  if (wordCounts.size < allRecords.length * 0.5) {
    console.log('⚠️ 发现严重重复问题！');
    console.log('可能原因:');
    console.log('  1. 同一单词被多次导入到同一分类');
    console.log('  2. 批量导入时缺少去重逻辑');
    console.log('  3. 数据库约束未生效');
  } else {
    console.log('数据看起来正常，继续分析...');
  }
}

analyzeDuplicates().catch(console.error);
