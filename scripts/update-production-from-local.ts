/**
 * 从 DB-data.json 读取数据并更新生产环境
 * 分批处理，避免请求过大
 */

import * as fs from 'fs';
import * as path from 'path';

const PRODUCTION_API = 'https://8qcfzhhw7t.coze.site';
const ADMIN_KEY = 'vocabulary-admin-2024';
const BATCH_SIZE = 100; // 每批处理100个单词

interface WordData {
  word: string;
  phonetic: string;
  meaning: string;
  example_sentence: string;
  example_sentence_cn: string | null;
  category: string;
}

interface DBData {
  total: number;
  words: WordData[];
}

async function updateProductionFromLocal() {
  console.log('=== 从本地数据更新生产环境 ===\n');
  
  // 1. 读取本地数据
  const dataPath = path.join(process.cwd(), 'assets', 'DB-data.json');
  console.log('读取数据文件:', dataPath);
  
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const data: DBData = JSON.parse(fileContent);
  
  console.log(`本地数据: ${data.words.length} 个单词\n`);
  
  // 2. 获取生产环境当前数据对比
  console.log('获取生产环境当前数据...');
  const currentResponse = await fetch(`${PRODUCTION_API}/api/admin/init`);
  const currentData = await currentResponse.json();
  console.log(`生产环境当前单词数: ${currentData.wordCount}\n`);
  
  // 3. 准备更新数据
  const words = data.words.map(w => ({
    word: w.word,
    phonetic: w.phonetic || '',
    meaning: w.meaning || '',
    example_sentence: w.example_sentence || '',
    example_sentence_cn: w.example_sentence_cn || '',
    category: w.category,
  }));
  
  // 4. 分批更新
  console.log(`开始分批更新，每批 ${BATCH_SIZE} 个单词...\n`);
  
  let updated = 0;
  let inserted = 0;
  let errors: string[] = [];
  const totalBatches = Math.ceil(words.length / BATCH_SIZE);
  
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    try {
      const response = await fetch(`${PRODUCTION_API}/api/admin/update-words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_KEY}`,
        },
        body: JSON.stringify({ 
          words: batch, 
          action: 'update' // 使用 update 模式，只更新已存在的单词
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        updated += result.results.updated || 0;
        inserted += result.results.inserted || 0;
        console.log(`批次 ${batchNum}/${totalBatches}: 更新 ${result.results.updated || 0}, 插入 ${result.results.inserted || 0}`);
      } else {
        console.error(`批次 ${batchNum}/${totalBatches}: 失败 - ${result.error}`);
      }
      
      if (result.results?.errors?.length > 0) {
        errors.push(...result.results.errors);
      }
    } catch (err) {
      console.error(`批次 ${batchNum}/${totalBatches}: 异常 -`, err);
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 5. 验证结果
  console.log('\n=== 更新完成 ===');
  console.log(`总更新: ${updated}`);
  console.log(`总插入: ${inserted}`);
  console.log(`错误数: ${errors.length}`);
  
  if (errors.length > 0 && errors.length <= 10) {
    console.log('\n错误详情:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
  
  // 6. 最终验证
  const finalResponse = await fetch(`${PRODUCTION_API}/api/admin/init`);
  const finalData = await finalResponse.json();
  console.log(`\n生产环境最终单词数: ${finalData.wordCount}`);
}

updateProductionFromLocal().catch(console.error);
