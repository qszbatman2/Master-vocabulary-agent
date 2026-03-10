/**
 * 详细分析生产环境数据
 * 使用不同方式获取数据以找出问题
 */

const PRODUCTION_API = 'https://8qcfzhhw7t.coze.site';
const ADMIN_KEY = 'vocabulary-admin-2024';

async function analyzeProductionDetailed() {
  console.log('=== 生产环境数据详细分析 ===\n');
  
  // 1. 获取基础统计
  console.log('1. 基础统计信息:');
  const initResponse = await fetch(`${PRODUCTION_API}/api/admin/init`);
  const initData = await initResponse.json();
  console.log(`   总记录数: ${initData.wordCount}`);
  console.log(`   分类数: ${initData.categories.length}`);
  console.log(`   分类列表: ${initData.categories.map((c: any) => c.name).join(', ')}`);
  
  // 2. 按分类获取单词数量
  console.log('\n2. 按分类统计:');
  const categories = initData.categories;
  const categoryStats: Array<{ id: number; name: string; count: number }> = [];
  
  for (const cat of categories) {
    const response = await fetch(`${PRODUCTION_API}/api/vocabulary?categoryId=${cat.id}&limit=1`);
    const data = await response.json();
    categoryStats.push({
      id: cat.id,
      name: cat.name,
      count: data.total || 0,
    });
    console.log(`   分类 ${cat.id} (${cat.name}): ${data.total} 个单词`);
  }
  
  // 3. 获取所有分类的总和
  const totalByCategory = categoryStats.reduce((sum, c) => sum + c.count, 0);
  console.log(`\n   各分类总和: ${totalByCategory}`);
  console.log(`   与总数差异: ${initData.wordCount - totalByCategory}`);
  
  // 4. 获取所有单词（使用大limit）
  console.log('\n3. 尝试获取所有单词数据...');
  
  // 使用批量导入 API 的 GET 来获取统计
  const batchImportResponse = await fetch(`${PRODUCTION_API}/api/admin/batch-import`);
  const batchImportData = await batchImportResponse.json();
  console.log(`   API 返回的状态: ${batchImportData.status}`);
  console.log(`   API 返回的单词数: ${batchImportData.wordCount}`);
  console.log(`   可用单词数（内置）: ${batchImportData.availableWords}`);
  
  // 5. 分析数据来源
  console.log('\n4. 数据差异分析:');
  console.log(`   生产环境总记录: ${initData.wordCount}`);
  console.log(`   沙箱环境记录: 13220`);
  console.log(`   差异: ${initData.wordCount - 13220}`);
  
  if (initData.wordCount > 13220) {
    console.log(`\n   可能原因:`);
    console.log(`   1. 同一单词存在于多个分类中（正常情况）`);
    console.log(`   2. 生产环境之前有旧数据`);
    console.log(`   3. 导入时产生了重复记录`);
  }
  
  // 6. 尝试获取所有分类的单词并去重
  console.log('\n5. 获取各分类单词进行去重分析...');
  const allWords = new Map<string, Array<{ id: number; category: string }>>();
  
  for (const cat of categories) {
    let page = 1;
    const pageSize = 500;
    
    while (true) {
      const response = await fetch(`${PRODUCTION_API}/api/vocabulary?categoryId=${cat.id}&limit=${pageSize}&page=${page}`);
      const data = await response.json();
      
      if (data.words && data.words.length > 0) {
        for (const w of data.words) {
          const word = w.word.toLowerCase();
          if (!allWords.has(word)) {
            allWords.set(word, []);
          }
          allWords.get(word)!.push({
            id: w.id,
            category: cat.name,
          });
        }
      }
      
      if (!data.words || data.words.length < pageSize) break;
      page++;
      
      // 安全限制
      if (page > 100) break;
    }
  }
  
  // 分析重复情况
  console.log(`\n   唯一单词数: ${allWords.size}`);
  
  const duplicates: Array<{ word: string; records: Array<{ id: number; category: string }> }> = [];
  for (const [word, records] of allWords.entries()) {
    if (records.length > 1) {
      duplicates.push({ word, records });
    }
  }
  
  console.log(`   在多个分类中的单词数: ${duplicates.length}`);
  
  // 显示重复示例
  if (duplicates.length > 0) {
    console.log('\n   重复单词示例（前10个）:');
    duplicates.slice(0, 10).forEach(d => {
      const categories = d.records.map(r => r.category).join(', ');
      console.log(`     "${d.word}": 在 [${categories}]`);
    });
  }
  
  // 7. 总结
  console.log('\n=== 总结 ===');
  console.log(`生产环境:`);
  console.log(`  - 总记录数: ${initData.wordCount}`);
  console.log(`  - 唯一单词: ${allWords.size}`);
  console.log(`  - 多分类单词: ${duplicates.length}`);
  console.log(`  - 平均每词记录: ${(initData.wordCount / allWords.size).toFixed(2)}`);
  
  console.log(`\n沙箱环境:`);
  console.log(`  - 总记录数: 13220`);
  console.log(`  - 分类数: 16`);
  
  return {
    productionTotal: initData.wordCount,
    productionUnique: allWords.size,
    multiCategoryWords: duplicates.length,
  };
}

analyzeProductionDetailed().catch(console.error);
