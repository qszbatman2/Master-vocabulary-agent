/**
 * 分析生产环境数据差异
 */

const PRODUCTION_API = 'https://8qcfzhhw7t.coze.site';

interface Word {
  id: number;
  word: string;
  category_id: number;
  meaning: string;
  created_at: string;
}

async function analyzeProduction() {
  console.log('=== 分析生产环境数据 ===\n');
  
  // 1. 获取所有单词
  console.log('获取所有单词...');
  const allWords: Word[] = [];
  let page = 1;
  const pageSize = 500;
  
  while (true) {
    const response = await fetch(`${PRODUCTION_API}/api/vocabulary?limit=${pageSize}&page=${page}`);
    const result = await response.json();
    
    if (result.words && result.words.length > 0) {
      const words = result.words.map((w: any) => ({
        id: w.id,
        word: w.word.toLowerCase(),
        category_id: w.category_id,
        meaning: w.meaning,
        created_at: w.created_at,
      }));
      allWords.push(...words);
    }
    
    if (!result.words || result.words.length < pageSize) break;
    page++;
    if (page > 100) break;
  }
  
  console.log(`总记录数: ${allWords.length}\n`);
  
  // 2. 按单词分组
  const wordGroups = new Map<string, Word[]>();
  for (const w of allWords) {
    const key = w.word;
    if (!wordGroups.has(key)) {
      wordGroups.set(key, []);
    }
    wordGroups.get(key)!.push(w);
  }
  
  console.log(`唯一单词数: ${wordGroups.size}`);
  
  // 3. 分析重复情况
  const stats = {
    unique: 0,
    inMultipleCategories: 0,
    duplicateInSameCategory: 0,
  };
  
  const duplicatesInSameCategory: Array<{ word: string; records: Word[] }> = [];
  const wordsInMultipleCategories: Array<{ word: string; categories: number[] }> = [];
  
  for (const [word, records] of wordGroups.entries()) {
    if (records.length === 1) {
      stats.unique++;
    } else {
      // 检查是否在不同分类中
      const categories = [...new Set(records.map(r => r.category_id))];
      
      if (categories.length > 1) {
        // 在多个分类中 - 这是正常的
        stats.inMultipleCategories++;
        wordsInMultipleCategories.push({
          word,
          categories: categories.sort((a, b) => a - b),
        });
      } else {
        // 在同一分类中重复 - 这是问题
        stats.duplicateInSameCategory++;
        duplicatesInSameCategory.push({
          word,
          records: records.sort((a, b) => a.id - b.id),
        });
      }
    }
  }
  
  console.log('\n=== 分析结果 ===');
  console.log(`唯一单词（只出现1次）: ${stats.unique}`);
  console.log(`在多个分类中的单词: ${stats.inMultipleCategories}`);
  console.log(`在同一分类中重复的单词: ${stats.duplicateInSameCategory}`);
  
  // 4. 按分类统计
  console.log('\n=== 各分类单词数 ===');
  const categoryCounts = new Map<number, number>();
  for (const w of allWords) {
    categoryCounts.set(w.category_id, (categoryCounts.get(w.category_id) || 0) + 1);
  }
  
  const categoryNames: Record<number, string> = {
    1: '雅思词汇', 2: '托福词汇', 3: 'GRE词汇', 4: '日常词汇',
    5: '商务词汇', 6: '科技词汇', 7: '医学词汇', 8: '法律词汇',
  };
  
  for (const [catId, count] of categoryCounts.entries()) {
    console.log(`  分类 ${catId} (${categoryNames[catId] || '未知'}): ${count} 个单词`);
  }
  
  // 5. 显示同一分类中的重复示例
  if (duplicatesInSameCategory.length > 0) {
    console.log('\n=== 同一分类中重复的单词示例（前20个）===');
    duplicatesInSameCategory.slice(0, 20).forEach(d => {
      console.log(`  "${d.word}": ${d.records.length} 条记录 in 分类 ${d.records[0].category_id}`);
      console.log(`    IDs: ${d.records.map(r => r.id).join(', ')}`);
    });
    
    // 统计需要删除的数量
    const toDelete = duplicatesInSameCategory.reduce((sum, d) => sum + d.records.length - 1, 0);
    console.log(`\n需要删除的重复记录数: ${toDelete}`);
  }
  
  // 6. 分析创建时间
  console.log('\n=== 创建时间分析 ===');
  const byDate = new Map<string, number>();
  for (const w of allWords) {
    const date = w.created_at.split('T')[0];
    byDate.set(date, (byDate.get(date) || 0) + 1);
  }
  
  const sortedDates = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [date, count] of sortedDates) {
    console.log(`  ${date}: ${count} 个单词`);
  }
  
  // 7. 返回重复数据供后续处理
  return {
    totalRecords: allWords.length,
    uniqueWords: wordGroups.size,
    duplicatesInSameCategory,
    wordsInMultipleCategories,
  };
}

analyzeProduction()
  .then(data => {
    console.log('\n=== 数据差异原因分析 ===');
    console.log(`生产环境总记录: ${data.totalRecords}`);
    console.log(`生产环境唯一单词: ${data.uniqueWords}`);
    console.log(`沙箱环境单词数: 13220`);
    console.log(`差异: ${data.totalRecords - 13220} 条记录`);
    
    if (data.duplicatesInSameCategory.length > 0) {
      console.log(`\n发现 ${data.duplicatesInSameCategory.length} 个单词在同一分类中重复`);
    }
  })
  .catch(console.error);
