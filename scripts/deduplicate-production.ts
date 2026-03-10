/**
 * 生产环境单词去重脚本
 * 删除重复单词，保留每个单词的第一个记录
 */

const PRODUCTION_API = 'https://8qcfzhhw7t.coze.site';
const ADMIN_KEY = 'vocabulary-admin-2024';

interface Word {
  id: number;
  word: string;
  category_id: number;
}

async function deduplicateProduction() {
  console.log('=== 生产环境单词去重 ===\n');
  
  // 1. 获取所有单词
  console.log('步骤 1: 获取所有单词...');
  const allWords: Word[] = [];
  let page = 1;
  const pageSize = 500;
  
  while (true) {
    const response = await fetch(`${PRODUCTION_API}/api/vocabulary?limit=${pageSize}&page=${page}`);
    const result = await response.json();
    
    if (result.words && result.words.length > 0) {
      // 提取关键信息
      const words = result.words.map((w: { id: number; word: string; category_id: number }) => ({
        id: w.id,
        word: w.word.toLowerCase(),
        category_id: w.category_id,
      }));
      allWords.push(...words);
    }
    
    if (!result.words || result.words.length < pageSize) break;
    page++;
    
    if (page % 10 === 0) {
      console.log(`  已获取 ${allWords.size} 个单词...`);
    }
    
    // 安全限制
    if (page > 100) break;
  }
  
  console.log(`总共获取 ${allWords.length} 条单词记录\n`);
  
  // 2. 分析重复情况
  console.log('步骤 2: 分析重复情况...');
  const wordMap = new Map<string, Word[]>();
  
  for (const w of allWords) {
    if (!wordMap.has(w.word)) {
      wordMap.set(w.word, []);
    }
    wordMap.get(w.word)!.push(w);
  }
  
  const duplicates: Array<{ word: string; count: number; ids: number[] }> = [];
  
  for (const [word, records] of wordMap.entries()) {
    if (records.length > 1) {
      duplicates.push({
        word,
        count: records.length,
        ids: records.map(r => r.id),
      });
    }
  }
  
  console.log(`唯一单词数: ${wordMap.size}`);
  console.log(`重复单词数: ${duplicates.length}`);
  
  const totalDuplicates = duplicates.reduce((sum, d) => sum + d.count - 1, 0);
  console.log(`需要删除的记录数: ${totalDuplicates}\n`);
  
  if (duplicates.length === 0) {
    console.log('没有重复数据，无需去重');
    return;
  }
  
  // 显示前10个重复单词示例
  console.log('重复单词示例（前10个）:');
  duplicates.slice(0, 10).forEach(d => {
    console.log(`  "${d.word}": ${d.count} 条记录, IDs: [${d.ids.slice(0, 5).join(', ')}${d.ids.length > 5 ? '...' : ''}]`);
  });
  console.log('');
  
  // 3. 删除重复记录
  console.log('步骤 3: 删除重复记录...');
  
  // 收集需要删除的ID（保留每个单词的第一个记录）
  const idsToDelete: number[] = [];
  
  for (const dup of duplicates) {
    // 保留第一个ID，删除其余的
    const idsToRemove = dup.ids.slice(1);
    idsToDelete.push(...idsToRemove);
  }
  
  console.log(`需要删除 ${idsToDelete.length} 条记录`);
  
  // 4. 批量删除
  console.log('\n步骤 4: 执行批量删除...');
  
  const batchSize = 100;
  let deleted = 0;
  
  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);
    
    try {
      const response = await fetch(`${PRODUCTION_API}/api/admin/delete-words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_KEY}`,
        },
        body: JSON.stringify({ wordIds: batch }),
      });
      
      const result = await response.json();
      
      if (result.success || result.deleted) {
        deleted += batch.length;
        console.log(`批次 ${Math.floor(i / batchSize) + 1}: 删除成功 (${deleted}/${idsToDelete.length})`);
      } else {
        console.error(`批次删除失败:`, result.error);
      }
    } catch (err) {
      console.error(`批次删除异常:`, err);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n=== 去重完成 ===`);
  console.log(`删除记录: ${deleted}`);
  
  // 5. 验证结果
  const finalResponse = await fetch(`${PRODUCTION_API}/api/admin/init`);
  const finalData = await finalResponse.json();
  console.log(`最终单词数: ${finalData.wordCount}`);
}

deduplicateProduction().catch(console.error);
