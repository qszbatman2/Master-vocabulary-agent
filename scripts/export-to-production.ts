/**
 * 从开发环境导出数据并导入到生产环境
 * 运行方式: npx ts-node scripts/export-to-production.ts
 */

import { getSupabaseClient } from '../src/storage/database/supabase-client';

const PRODUCTION_API = 'https://8qcfzhhw7t.coze.site';
const ADMIN_KEY = 'vocabulary-admin-2024';
const BATCH_SIZE = 200;

async function exportAndImport() {
  const client = getSupabaseClient();
  
  console.log('正在从开发环境获取所有单词...');
  
  // 获取所有单词（不使用 join）
  const { data: allWords, error } = await client
    .from('words')
    .select(`
      word,
      phonetic,
      meaning,
      example_sentence,
      example_sentence_cn,
      category_id
    `)
    .order('id');
  
  if (error) {
    console.error('获取数据失败:', error);
    return;
  }
  
  const totalCount = allWords?.length || 0;
  console.log(`开发环境共有 ${totalCount} 个单词`);
  
  // 获取分类列表用于反向映射
  const { data: categories } = await client
    .from('vocabulary_categories')
    .select('id, name');
  
  const categoryIdToName: Record<number, string> = {};
  categories?.forEach(c => {
    categoryIdToName[c.id] = c.name;
  });
  
  // 获取生产环境已有单词
  const prodResponse = await fetch(`${PRODUCTION_API}/api/vocabulary?limit=1`);
  const prodData = await prodResponse.json();
  console.log(`生产环境当前有 ${prodData.total} 个单词`);
  
  // 获取生产环境已有单词列表
  const existingSet = new Set<string>();
  let page = 1;
  const pageSize = 500;
  
  console.log('正在获取生产环境已有单词列表...');
  while (true) {
    const response = await fetch(`${PRODUCTION_API}/api/vocabulary?limit=${pageSize}&page=${page}`);
    const data = await response.json();
    
    if (data.words && data.words.length > 0) {
      data.words.forEach((w: { word: string }) => existingSet.add(w.word.toLowerCase()));
    }
    
    if (!data.words || data.words.length < pageSize) break;
    page++;
  }
  
  console.log(`生产环境已有 ${existingSet.size} 个唯一单词`);
  
  // 过滤出新单词
  const newWords = allWords.filter(w => !existingSet.has(w.word.toLowerCase()));
  console.log(`需要导入 ${newWords.length} 个新单词`);
  
  if (newWords.length === 0) {
    console.log('没有新单词需要导入');
    return;
  }
  
  // 获取生产环境分类映射
  const categoriesResponse = await fetch(`${PRODUCTION_API}/api/categories`);
  const categoriesData = await categoriesResponse.json();
  const categoryMap: Record<string, number> = {};
  
  categoriesData.categories.forEach((c: { id: number; name: string }) => {
    categoryMap[c.name] = c.id;
  });
  
  console.log('分类映射:', categoryMap);
  
  // 准备导入数据
  const records = newWords.map(w => {
    const catName = categoryIdToName[w.category_id] || '托福词汇';
    return {
      word: w.word.toLowerCase(),
      phonetic: w.phonetic || '',
      meaning: w.meaning,
      example_sentence: w.example_sentence || `This is an example using the word "${w.word}".`,
      example_sentence_cn: w.example_sentence_cn || '',
      category_id: categoryMap[catName] || 1,
    };
  });
  
  // 批量导入
  let imported = 0;
  const batches = Math.ceil(records.length / BATCH_SIZE);
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    try {
      const response = await fetch(`${PRODUCTION_API}/api/admin/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_KEY}`,
        },
        body: JSON.stringify({ words: batch }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        imported += batch.length;
        console.log(`批次 ${batchNum}/${batches} 导入成功，已导入 ${imported}/${records.length}`);
      } else {
        console.error(`批次 ${batchNum} 导入失败:`, result.error);
      }
    } catch (err) {
      console.error(`批次 ${batchNum} 导入异常:`, err);
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n导入完成！共导入 ${imported} 个单词`);
  
  // 验证最终结果
  const finalResponse = await fetch(`${PRODUCTION_API}/api/vocabulary?limit=1`);
  const finalData = await finalResponse.json();
  console.log(`生产环境最终单词数: ${finalData.total}`);
}

exportAndImport().catch(console.error);
