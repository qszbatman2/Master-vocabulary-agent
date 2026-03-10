/**
 * 深入分析生产环境数据
 * 通过多次 API 调用获取更多信息
 */

const PRODUCTION_API = 'https://8qcfzhhw7t.coze.site';

async function analyzeProductionDeep() {
  console.log('=== 深入分析生产环境数据 ===\n');
  
  // 1. 获取分类统计
  console.log('1. 各分类记录数（通过 API 返回的 total）:');
  const categories = [1, 2, 3, 4, 5, 6, 7, 8];
  const categoryNames: Record<number, string> = {
    1: '雅思词汇', 2: '托福词汇', 3: 'GRE词汇', 4: '日常词汇',
    5: '商务词汇', 6: '科技词汇', 7: '医学词汇', 8: '法律词汇',
  };
  
  let totalRecords = 0;
  
  for (const catId of categories) {
    const response = await fetch(`${PRODUCTION_API}/api/vocabulary?categoryId=${catId}&limit=1`);
    const data = await response.json();
    console.log(`   ${categoryNames[catId]}: ${data.total} 条`);
    totalRecords += data.total;
  }
  
  console.log(`\n   总计: ${totalRecords} 条`);
  
  // 2. 获取托福词汇的详细信息（最多记录的分类）
  console.log('\n2. 分析托福词汇数据...');
  
  // 获取不同页面的数据，检查是否有重复
  const allWords = new Map<string, number>();
  let page = 1;
  const pageSize = 50;
  let duplicatesFound = 0;
  
  // 只获取前5页数据进行分析
  for (page = 1; page <= 10; page++) {
    const response = await fetch(`${PRODUCTION_API}/api/vocabulary?categoryId=2&limit=${pageSize}&page=${page}`);
    const data = await response.json();
    
    if (!data.words || data.words.length === 0) break;
    
    for (const w of data.words) {
      const key = w.word.toLowerCase();
      if (allWords.has(key)) {
        duplicatesFound++;
      } else {
        allWords.set(key, w.id);
      }
    }
    
    console.log(`   第 ${page} 页: ${data.words.length} 条数据, 累计唯一: ${allWords.size}`);
  }
  
  console.log(`\n   前 10 页共 ${allWords.size + duplicatesFound} 条记录`);
  console.log(`   唯一单词: ${allWords.size}`);
  console.log(`   重复出现: ${duplicatesFound}`);
  
  // 3. 分析数据分布
  console.log('\n3. 分析数据分布...');
  
  // 检查不同页返回的数据是否有重叠
  const page1Words = new Set<string>();
  const page2Words = new Set<string>();
  
  const resp1 = await fetch(`${PRODUCTION_API}/api/vocabulary?categoryId=2&limit=50&page=1`);
  const data1 = await resp1.json();
  data1.words?.forEach((w: any) => page1Words.add(w.word.toLowerCase()));
  
  const resp2 = await fetch(`${PRODUCTION_API}/api/vocabulary?categoryId=2&limit=50&page=2`);
  const data2 = await resp2.json();
  data2.words?.forEach((w: any) => page2Words.add(w.word.toLowerCase()));
  
  const overlap = [...page1Words].filter(w => page2Words.has(w));
  console.log(`   第1页和第2页重叠单词数: ${overlap.length}`);
  
  if (overlap.length > 0) {
    console.log(`   重叠示例: ${overlap.slice(0, 5).join(', ')}`);
    console.log('   ⚠️ 可能存在分页问题或数据重复');
  }
  
  // 4. 结论
  console.log('\n=== 分析结论 ===');
  console.log(`生产环境总记录数: ${totalRecords}`);
  console.log(`沙箱环境记录数: 13220`);
  console.log(`差异: ${totalRecords - 13220}`);
  
  console.log('\n可能的问题:');
  console.log('  1. 同一单词被多次导入到同一分类（重复记录）');
  console.log('  2. API 分页逻辑有问题');
  console.log('  3. 数据库中有大量冗余数据');
  
  console.log('\n解决方案:');
  console.log('  1. 部署新代码到生产环境（包含去重和清空 API）');
  console.log('  2. 调用 /api/admin/deduplicate 或清空后重新导入');
}

analyzeProductionDeep().catch(console.error);
