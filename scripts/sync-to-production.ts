/**
 * 从本地 DB-data.json 同步数据到生产环境
 */

import * as fs from 'fs';
import * as path from 'path';

const PRODUCTION_API = 'https://8qcfzhhw7t.coze.site';
const ADMIN_KEY = 'vocabulary-admin-2024';
const BATCH_SIZE = 200;

interface Word {
  word: string;
  phonetic: string;
  meaning: string;
  example_sentence: string;
  example_sentence_cn: string | null;
  category: string;
}

interface DBData {
  total: number;
  categories: Array<{ id: number; name: string; description: string }>;
  words: Word[];
}

async function syncToProduction() {
  // 读取本地数据
  const dataPath = path.join(process.cwd(), 'assets', 'DB-data.json');
  console.log('读取数据文件:', dataPath);
  
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const data: DBData = JSON.parse(fileContent);
  
  console.log(`本地数据: ${data.words.length} 个单词, ${data.categories.length} 个分类`);
  
  // 获取生产环境分类
  const categoriesResponse = await fetch(`${PRODUCTION_API}/api/categories`);
  const categoriesData = await categoriesResponse.json();
  const existingCategories = new Map<string, number>();
  
  categoriesData.categories.forEach((c: { id: number; name: string }) => {
    existingCategories.set(c.name, c.id);
  });
  
  console.log('生产环境已有分类:', Array.from(existingCategories.keys()));
  
  // 统计各分类单词数
  const categoryWordCounts: Record<string, number> = {};
  for (const w of data.words) {
    categoryWordCounts[w.category] = (categoryWordCounts[w.category] || 0) + 1;
  }
  console.log('各分类单词数:', categoryWordCounts);
  
  // 获取生产环境已有单词
  const existingWords = new Set<string>();
  
  // 直接查询生产环境数据库获取已有单词数量
  const initResponse = await fetch(`${PRODUCTION_API}/api/admin/init`);
  const initData = await initResponse.json();
  console.log(`生产环境当前单词数: ${initData.wordCount}`);
  
  // 分批获取已有单词列表
  let page = 1;
  const pageSize = 500;
  console.log('获取生产环境已有单词列表...');
  
  while (true) {
    const response = await fetch(`${PRODUCTION_API}/api/vocabulary?limit=${pageSize}&page=${page}`);
    const result = await response.json();
    
    if (result.words && result.words.length > 0) {
      result.words.forEach((w: { word: string }) => existingWords.add(w.word.toLowerCase()));
    }
    
    if (!result.words || result.words.length < pageSize) break;
    page++;
    
    if (page % 5 === 0) {
      console.log(`  已获取 ${existingWords.size} 个单词...`);
    }
    
    // 安全限制
    if (page > 100) break;
  }
  
  console.log(`生产环境已有 ${existingWords.size} 个唯一单词`);
  
  // 过滤出新单词
  const newWords = data.words.filter(w => !existingWords.has(w.word.toLowerCase()));
  console.log(`需要导入 ${newWords.length} 个新单词`);
  
  if (newWords.length === 0) {
    console.log('\n没有新单词需要导入');
    return;
  }
  
  // 准备导入数据（包含分类信息）
  const records = newWords.map(w => ({
    word: w.word.toLowerCase(),
    phonetic: w.phonetic || '',
    meaning: w.meaning,
    example_sentence: w.example_sentence || '',
    example_sentence_cn: w.example_sentence_cn || '',
    category: w.category,
  }));
  
  // 批量导入
  let imported = 0;
  let failed = 0;
  const totalBatches = Math.ceil(records.length / BATCH_SIZE);
  
  console.log(`\n开始导入 ${records.length} 个单词，分 ${totalBatches} 批...`);
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    try {
      const response = await fetch(`${PRODUCTION_API}/api/admin/batch-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_KEY}`,
        },
        body: JSON.stringify({ words: batch }),
      });
      
      const result = await response.json();
      
      if (result.success || result.imported) {
        imported += batch.length;
        console.log(`批次 ${batchNum}/${totalBatches}: 导入成功 (${imported}/${records.length})`);
      } else {
        failed += batch.length;
        console.error(`批次 ${batchNum}/${totalBatches}: 导入失败 -`, result.error || '未知错误');
      }
    } catch (err) {
      failed += batch.length;
      console.error(`批次 ${batchNum}/${totalBatches}: 异常 -`, err);
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n=== 导入完成 ===');
  console.log(`成功: ${imported}`);
  console.log(`失败: ${failed}`);
  
  // 验证最终结果
  const finalInitResponse = await fetch(`${PRODUCTION_API}/api/admin/init`);
  const finalInitData = await finalInitResponse.json();
  console.log(`生产环境最终单词数: ${finalInitData.wordCount}`);
  
  // 检查分类
  const finalCategoriesResponse = await fetch(`${PRODUCTION_API}/api/categories`);
  const finalCategoriesData = await finalCategoriesResponse.json();
  console.log(`生产环境最终分类数: ${finalCategoriesData.categories.length}`);
}

syncToProduction().catch(console.error);
