#!/usr/bin/env node
/**
 * 词库数据同步脚本 v2
 * 使用现有的 /api/admin/words API 分批获取数据
 * 
 * 使用方法：
 *   node scripts/sync-vocabulary-v2.js <source-env> <target-env>
 */

const fs = require('fs');
const path = require('path');

const ADMIN_TOKEN = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
const OUTPUT_DIR = path.join(__dirname, '../exports');
const BATCH_SIZE = 500; // 每批处理的单词数

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ 用法: node scripts/sync-vocabulary-v2.js <source-env> <target-env>');
    console.error('');
    console.error('示例:');
    console.error('  node scripts/sync-vocabulary-v2.js https://8qcfzhhw7t.coze.site http://localhost:5000');
    process.exit(1);
  }
  
  return {
    sourceEnv: args[0].replace(/\/$/, ''),
    targetEnv: args[1].replace(/\/$/, ''),
  };
}

// 延迟函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 从源环境获取所有分类
async function fetchCategories(sourceEnv) {
  console.log(`\n📂 正在获取分类列表...`);
  
  const response = await fetch(`${sourceEnv}/api/admin/words?page=1&pageSize=1`, {
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
  });
  
  if (!response.ok) {
    throw new Error(`获取分类失败: ${response.status}`);
  }
  
  const data = await response.json();
  const categories = data.categories || [];
  
  console.log(`✅ 获取到 ${categories.length} 个分类`);
  return categories;
}

// 从源环境分批获取所有单词
async function fetchAllWords(sourceEnv) {
  console.log(`\n📥 正在从生产环境获取单词数据...`);
  
  const pageSize = 1000;
  
  // 先获取总数
  const firstResponse = await fetch(`${sourceEnv}/api/admin/words?page=1&pageSize=1`, {
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
  });
  
  if (!firstResponse.ok) {
    throw new Error(`获取单词失败: ${firstResponse.status}`);
  }
  
  const firstData = await firstResponse.json();
  const total = firstData.total || 0;
  
  console.log(`   总单词数: ${total}`);
  
  // 分批获取所有单词
  const allWords = [];
  const batches = Math.ceil(total / pageSize);
  
  for (let i = 0; i < batches; i++) {
    const page = i + 1;
    process.stdout.write(`\r   进度: ${allWords.length}/${total} (${Math.round(allWords.length / total * 100)}%)`);
    
    const response = await fetch(`${sourceEnv}/api/admin/words?page=${page}&pageSize=${pageSize}`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    });
    
    if (!response.ok) {
      console.error(`\n   ⚠️ 批次 ${page} 获取失败`);
      continue;
    }
    
    const data = await response.json();
    if (data.words && data.words.length > 0) {
      allWords.push(...data.words);
    }
    
    // 避免请求过快
    if (i < batches - 1) {
      await delay(100);
    }
  }
  
  console.log(`\n✅ 获取完成! 共 ${allWords.length} 个单词`);
  return allWords;
}

// 保存导出数据到本地文件
async function saveToFile(data) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `vocabulary-${timestamp}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  
  console.log(`\n💾 数据已保存到: ${filepath}`);
  return filepath;
}

// 清空目标环境词库数据
async function clearTargetDatabase(targetEnv) {
  console.log(`\n🗑️  正在清空测试环境词库数据...`);
  
  const response = await fetch(`${targetEnv}/api/admin/delete-words`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'clear-all' }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`清空失败: ${error}`);
  }
  
  const result = await response.json();
  console.log(`✅ 清空成功! 删除了 ${result.cleared} 个单词`);
  
  return result;
}

// 导入分类到目标环境
async function importCategories(targetEnv, categories) {
  if (!categories || categories.length === 0) return;
  
  console.log(`\n📂 导入分类...`);
  
  const categoriesData = categories.map(cat => ({
    name: cat.name,
    description: cat.description || '',
  }));
  
  const response = await fetch(`${targetEnv}/api/admin/batch-import`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'categories',
      categories: categoriesData,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`   ⚠️ 分类导入失败: ${error}`);
    return;
  }
  
  const result = await response.json();
  console.log(`✅ 导入了 ${result.importedCategories} 个分类`);
}

// 导入单词到目标环境
async function importWords(targetEnv, words, categories) {
  if (!words || words.length === 0) return;
  
  console.log(`\n📥 导入单词...`);
  
  // 构建分类名称到ID的映射
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });
  
  let importedCount = 0;
  const total = words.length;
  
  // 分批导入
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    
    const wordsToImport = batch.map(word => ({
      word: word.word,
      phonetic: word.phonetic || '',
      meaning: word.meaning || '',
      example_sentence: word.example_sentence || '',
      example_sentence_cn: word.example_sentence_cn || '',
      category_id: word.category_id || categoryMap[word.category_name] || 1,
    }));
    
    const response = await fetch(`${targetEnv}/api/admin/update-words`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'upsert',
        words: wordsToImport,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`\n   ⚠️ 批次 ${Math.floor(i / BATCH_SIZE) + 1} 导入失败: ${error}`);
    } else {
      const result = await response.json();
      importedCount += result.results?.inserted || 0;
      importedCount += result.results?.updated || 0;
    }
    
    process.stdout.write(`\r   进度: ${Math.min(i + BATCH_SIZE, total)}/${total} (${Math.round(Math.min(i + BATCH_SIZE, total) / total * 100)}%)`);
    
    // 避免请求过快
    if (i + BATCH_SIZE < words.length) {
      await delay(50);
    }
  }
  
  console.log(`\n✅ 导入完成!`);
}

// 验证同步结果
async function verifySync(targetEnv, expectedWords) {
  console.log(`\n🔍 验证同步结果...`);
  
  const response = await fetch(`${targetEnv}/api/admin/words?page=1&pageSize=1`, {
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
  });
  
  if (!response.ok) {
    throw new Error(`验证失败: 无法获取目标环境数据`);
  }
  
  const data = await response.json();
  const actualWords = data.total || 0;
  
  console.log(`\n📊 同步结果:`);
  console.log(`   单词: 期望 ${expectedWords} 个, 实际 ${actualWords} 个 ${actualWords === expectedWords ? '✅' : '⚠️'}`);
  
  if (actualWords >= expectedWords * 0.99) {
    console.log(`\n🎉 同步成功!`);
    return true;
  } else {
    console.log(`\n⚠️  数据量差异较大，请检查!`);
    return false;
  }
}

// 主函数
async function main() {
  console.log('═'.repeat(60));
  console.log('        词库数据同步工具 v2');
  console.log('═'.repeat(60));
  
  const { sourceEnv, targetEnv } = parseArgs();
  
  try {
    // 1. 获取分类
    const categories = await fetchCategories(sourceEnv);
    
    // 2. 获取所有单词
    const words = await fetchAllWords(sourceEnv);
    
    // 3. 保存到本地（备份）
    await saveToFile({ categories, words, exportedAt: new Date().toISOString() });
    
    // 4. 清空目标环境
    await clearTargetDatabase(targetEnv);
    
    // 5. 导入分类
    await importCategories(targetEnv, categories);
    
    // 6. 重新获取目标环境的分类（获取新的ID）
    const targetCategories = await fetchCategories(targetEnv);
    
    // 7. 导入单词
    await importWords(targetEnv, words, targetCategories);
    
    // 8. 验证
    const success = await verifySync(targetEnv, words.length);
    
    console.log('\n' + '═'.repeat(60));
    if (success) {
      console.log('✅ 同步完成!');
    } else {
      console.log('⚠️  同步完成，但数据可能不完整!');
    }
    console.log('═'.repeat(60));
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ 同步失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
