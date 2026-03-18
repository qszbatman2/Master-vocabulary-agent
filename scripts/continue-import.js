#!/usr/bin/env node
/**
 * 从备份文件导入单词
 */

const fs = require('fs');
const path = require('path');

const ADMIN_TOKEN = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
const BATCH_SIZE = 500;
const TARGET_ENV = 'http://localhost:5000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importWords(words, categories) {
  console.log(`\n📥 导入单词...`);
  
  // 构建分类名称到ID的映射
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });
  
  // 获取已导入的单词列表
  console.log('   检查已导入的单词...');
  const existingWords = new Set();
  let page = 1;
  while (true) {
    const response = await fetch(`${TARGET_ENV}/api/admin/words?page=${page}&pageSize=1000`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    });
    const data = await response.json();
    if (!data.words || data.words.length === 0) break;
    data.words.forEach(w => existingWords.add(w.word.toLowerCase()));
    if (data.words.length < 1000) break;
    page++;
  }
  console.log(`   已存在 ${existingWords.size} 个单词`);
  
  // 过滤出需要导入的单词
  const wordsToImport = words.filter(w => !existingWords.has(w.word.toLowerCase()));
  console.log(`   需要导入 ${wordsToImport.length} 个新单词`);
  
  if (wordsToImport.length === 0) {
    console.log('   ✅ 所有单词已导入!');
    return;
  }
  
  let importedCount = 0;
  const total = wordsToImport.length;
  
  // 分批导入
  for (let i = 0; i < wordsToImport.length; i += BATCH_SIZE) {
    const batch = wordsToImport.slice(i, i + BATCH_SIZE);
    
    const records = batch.map(word => ({
      word: word.word,
      phonetic: word.phonetic || '',
      meaning: word.meaning || '',
      example_sentence: word.example_sentence || '',
      example_sentence_cn: word.example_sentence_cn || '',
      category_id: word.category_id || categoryMap[word.category_name] || 1,
    }));
    
    const response = await fetch(`${TARGET_ENV}/api/admin/update-words`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'upsert',
        words: records,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`\n   ⚠️ 批次导入失败: ${error.substring(0, 100)}`);
    } else {
      const result = await response.json();
      importedCount += result.results?.inserted || 0;
      importedCount += result.results?.updated || 0;
    }
    
    process.stdout.write(`\r   进度: ${Math.min(i + BATCH_SIZE, total)}/${total} (${Math.round(Math.min(i + BATCH_SIZE, total) / total * 100)}%)`);
    
    if (i + BATCH_SIZE < wordsToImport.length) {
      await delay(50);
    }
  }
  
  console.log(`\n✅ 导入完成! 本轮导入 ${importedCount} 个单词`);
}

async function main() {
  // 读取备份文件
  const backupFile = process.argv[2] || '/workspace/projects/exports/vocabulary-2026-03-13T07-44-46-722Z.json';
  console.log(`📂 读取备份文件: ${backupFile}`);
  
  const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log(`   单词数: ${data.words.length}`);
  console.log(`   分类数: ${data.categories.length}`);
  
  // 导入
  await importWords(data.words, data.categories);
  
  // 验证
  const response = await fetch(`${TARGET_ENV}/api/admin/words?page=1&pageSize=1`, {
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
  });
  const result = await response.json();
  console.log(`\n📊 最终统计: ${result.total} 个单词`);
}

main().catch(console.error);
