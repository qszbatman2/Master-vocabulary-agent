/**
 * 通过生产环境 API 去重数据
 * 策略：分析重复数据后，删除重复记录
 */

const PRODUCTION_API = 'https://8qcfzhhw7t.coze.site';
const ADMIN_KEY = 'vocabulary-admin-2024';

interface Word {
  id: number;
  word: string;
  category_id: number;
  created_at: string;
}

async function deduplicateViaAPI() {
  console.log('=== 通过 API 分析生产环境数据 ===\n');
  
  // 1. 获取所有单词数据
  console.log('1. 获取所有单词数据...');
  const allWords: Word[] = [];
  const categories = [1, 2, 3, 4, 5, 6, 7, 8]; // 8个分类
  
  for (const catId of categories) {
    let page = 1;
    const pageSize = 500;
    
    while (true) {
      const response = await fetch(`${PRODUCTION_API}/api/vocabulary?categoryId=${catId}&limit=${pageSize}&page=${page}`);
      const data = await response.json();
      
      if (data.words && data.words.length > 0) {
        const words = data.words.map((w: any) => ({
          id: w.id,
          word: w.word.toLowerCase(),
          category_id: w.category_id,
          created_at: w.created_at,
        }));
        allWords.push(...words);
      }
      
      if (!data.words || data.words.length < pageSize) break;
      page++;
      
      if (page > 100) break;
    }
    
    console.log(`   分类 ${catId}: 已获取 ${allWords.length} 条记录`);
  }
  
  console.log(`\n总记录数: ${allWords.length}`);
  
  // 2. 分析重复情况
  console.log('\n2. 分析重复情况...');
  const grouped = new Map<string, Word[]>();
  
  for (const w of allWords) {
    const key = `${w.category_id}:${w.word}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(w);
  }
  
  // 找出同一分类中重复的单词
  const duplicates: Array<{ word: string; categoryId: number; toDelete: number[]; toKeep: number }> = [];
  
  for (const [key, records] of grouped.entries()) {
    if (records.length > 1) {
      const [catId, word] = key.split(':');
      const sorted = records.sort((a, b) => a.id - b.id);
      duplicates.push({
        word,
        categoryId: parseInt(catId),
        toKeep: sorted[0].id,
        toDelete: sorted.slice(1).map(r => r.id),
      });
    }
  }
  
  console.log(`唯一组合: ${grouped.size}`);
  console.log(`重复组数: ${duplicates.length}`);
  
  const totalToDelete = duplicates.reduce((sum, d) => sum + d.toDelete.length, 0);
  console.log(`需要删除: ${totalToDelete} 条记录`);
  
  if (duplicates.length === 0) {
    console.log('\n没有发现重复数据！');
    return;
  }
  
  // 3. 显示重复示例
  console.log('\n3. 重复数据示例（前10组）:');
  duplicates.slice(0, 10).forEach(d => {
    console.log(`   "${d.word}" (分类 ${d.categoryId}): 保留 ID ${d.toKeep}, 删除 IDs [${d.toDelete.slice(0, 3).join(', ')}${d.toDelete.length > 3 ? '...' : ''}]`);
  });
  
  // 4. 检查生产环境是否有删除 API
  console.log('\n4. 检查删除 API...');
  const deleteCheckResponse = await fetch(`${PRODUCTION_API}/api/admin/delete-words`, {
    method: 'OPTIONS',
  });
  
  if (deleteCheckResponse.ok) {
    console.log('   ✓ 删除 API 可用');
    
    // 执行删除
    const allIdsToDelete = duplicates.flatMap(d => d.toDelete);
    console.log(`\n5. 开始删除 ${allIdsToDelete.length} 条重复记录...`);
    
    const response = await fetch(`${PRODUCTION_API}/api/admin/delete-words`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_KEY}`,
      },
      body: JSON.stringify({ wordIds: allIdsToDelete }),
    });
    
    const result = await response.json();
    console.log('   删除结果:', JSON.stringify(result, null, 2));
  } else {
    console.log('   ✗ 删除 API 不可用');
    console.log('   需要先部署新代码到生产环境');
  }
}

deduplicateViaAPI().catch(console.error);
