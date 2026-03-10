/**
 * 完全重置生产环境数据
 * 警告：此操作会清空生产环境的单词数据
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

async function resetProduction() {
  console.log('=== 完全重置生产环境数据 ===\n');
  console.log('⚠️  警告：此操作将清空生产环境的所有单词数据！\n');
  
  // 1. 读取本地数据
  const dataPath = path.join(process.cwd(), 'assets', 'DB-data.json');
  console.log('1. 读取本地数据:', dataPath);
  
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const data: DBData = JSON.parse(fileContent);
  
  console.log(`   本地数据: ${data.words.length} 个单词, ${data.categories.length} 个分类`);
  
  // 2. 检查生产环境当前状态
  console.log('\n2. 检查生产环境当前状态...');
  const initResponse = await fetch(`${PRODUCTION_API}/api/admin/init`);
  const initData = await initResponse.json();
  console.log(`   当前单词数: ${initData.wordCount}`);
  console.log(`   当前分类数: ${initData.categories.length}`);
  
  // 3. 尝试清空数据（需要生产环境有对应的 API）
  console.log('\n3. 尝试清空旧数据...');
  
  const clearResponse = await fetch(`${PRODUCTION_API}/api/admin/delete-words`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_KEY}`,
    },
    body: JSON.stringify({ action: 'clear-all' }),
  });
  
  const clearResult = await clearResponse.json();
  
  if (clearResult.success) {
    console.log(`   ✓ 清空了 ${clearResult.cleared} 条记录`);
  } else {
    console.log(`   ✗ 清空失败: ${clearResult.error}`);
    console.log('   将尝试增量导入...');
  }
  
  // 4. 导入新数据
  console.log('\n4. 开始导入数据...');
  
  const records = data.words.map(w => ({
    word: w.word.toLowerCase(),
    phonetic: w.phonetic || '',
    meaning: w.meaning,
    example_sentence: w.example_sentence || '',
    example_sentence_cn: w.example_sentence_cn || '',
    category: w.category,
  }));
  
  let imported = 0;
  let failed = 0;
  const totalBatches = Math.ceil(records.length / BATCH_SIZE);
  
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
      
      if (result.success || result.inserted) {
        imported += batch.length;
        console.log(`   批次 ${batchNum}/${totalBatches}: 导入成功 (${imported}/${records.length})`);
      } else {
        failed += batch.length;
        console.error(`   批次 ${batchNum}/${totalBatches}: 导入失败 - ${result.error || '未知错误'}`);
      }
    } catch (err) {
      failed += batch.length;
      console.error(`   批次 ${batchNum}/${totalBatches}: 异常 -`, err);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // 5. 验证结果
  console.log('\n5. 验证结果...');
  const finalResponse = await fetch(`${PRODUCTION_API}/api/admin/init`);
  const finalData = await finalResponse.json();
  
  console.log('\n=== 完成 ===');
  console.log(`成功导入: ${imported}`);
  console.log(`失败: ${failed}`);
  console.log(`生产环境最终单词数: ${finalData.wordCount}`);
  console.log(`生产环境最终分类数: ${finalData.categories.length}`);
  
  // 检查是否匹配预期
  if (finalData.wordCount === data.words.length) {
    console.log('\n✓ 数据完全匹配！');
  } else {
    console.log(`\n⚠️ 数据不匹配！预期 ${data.words.length}，实际 ${finalData.wordCount}`);
  }
}

resetProduction().catch(console.error);
