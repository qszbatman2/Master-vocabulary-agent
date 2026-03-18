#!/usr/bin/env node
/**
 * 词库数据同步脚本
 * 用于将生产环境词库数据同步到测试环境
 * 
 * 使用方法：
 *   node scripts/sync-vocabulary.js <source-env> <target-env>
 *   
 * 参数说明：
 *   source-env: 生产环境 URL，例如 https://8qcfzhhw7t.coze.site
 *   target-env: 测试环境 URL，例如 http://localhost:5000
 */

const fs = require('fs');
const path = require('path');

const ADMIN_TOKEN = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
const OUTPUT_DIR = path.join(__dirname, '../exports');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ 用法: node scripts/sync-vocabulary.js <source-env> <target-env>');
    console.error('');
    console.error('示例:');
    console.error('  node scripts/sync-vocabulary.js https://8qcfzhhw7t.coze.site http://localhost:5000');
    process.exit(1);
  }
  
  return {
    sourceEnv: args[0].replace(/\/$/, ''),
    targetEnv: args[1].replace(/\/$/, ''),
  };
}

// 从源环境导出词库数据
async function exportVocabulary(sourceEnv) {
  console.log(`\n📤 正在从生产环境导出词库数据...`);
  console.log(`   源地址: ${sourceEnv}`);
  
  const response = await fetch(`${sourceEnv}/api/admin/export-vocabulary`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`导出失败 (${response.status}): ${error}`);
  }
  
  const data = await response.json();
  
  console.log(`✅ 导出成功!`);
  console.log(`   - 分类数量: ${data.stats.totalCategories}`);
  console.log(`   - 单词数量: ${data.stats.totalWords}`);
  console.log(`   - 导出时间: ${data.exportedAt}`);
  
  return data;
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
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deleteAll: true }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`清空失败 (${response.status}): ${error}`);
  }
  
  const result = await response.json();
  console.log(`✅ 清空成功! 删除了 ${result.deletedWords} 个单词和 ${result.deletedCategories} 个分类`);
  
  return result;
}

// 导入数据到目标环境
async function importVocabulary(targetEnv, data) {
  console.log(`\n📥 正在导入数据到测试环境...`);
  console.log(`   目标地址: ${targetEnv}`);
  
  // 先导入分类
  if (data.categories && data.categories.length > 0) {
    console.log(`\n   导入分类...`);
    
    // 提取分类名称和描述
    const categories = data.categories.map(cat => ({
      name: cat.name,
      description: cat.description || '',
    }));
    
    const catResponse = await fetch(`${targetEnv}/api/admin/batch-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'categories',
        categories: categories,
      }),
    });
    
    if (!catResponse.ok) {
      const error = await catResponse.text();
      console.error(`   ⚠️  分类导入失败: ${error}`);
    } else {
      const result = await catResponse.json();
      console.log(`   ✅ 导入了 ${result.importedCategories} 个分类`);
    }
  }
  
  // 再导入单词
  if (data.words && data.words.length > 0) {
    console.log(`\n   导入单词...`);
    
    // 获取目标环境的分类映射
    const catResponse = await fetch(`${targetEnv}/api/admin/words?limit=1000`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
    });
    
    let categoryMap = {};
    if (catResponse.ok) {
      const catData = await catResponse.json();
      if (catData.categories) {
        catData.categories.forEach(cat => {
          categoryMap[cat.name] = cat.id;
        });
      }
    }
    
    // 分批导入单词（每批500个）
    const BATCH_SIZE = 500;
    let importedCount = 0;
    
    for (let i = 0; i < data.words.length; i += BATCH_SIZE) {
      const batch = data.words.slice(i, i + BATCH_SIZE);
      
      // 转换单词数据格式
      const wordsToImport = batch.map(word => {
        // 查找原始分类名称
        let categoryId = word.category_id;
        if (!categoryId && word.category_name) {
          categoryId = categoryMap[word.category_name];
        }
        
        return {
          word: word.word,
          phonetic: word.phonetic || '',
          meaning: word.meaning || '',
          example_sentence: word.example_sentence || '',
          example_sentence_cn: word.example_sentence_cn || '',
          category_id: categoryId,
        };
      });
      
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
        console.error(`   ⚠️  批次 ${Math.floor(i / BATCH_SIZE) + 1} 导入失败: ${error}`);
      } else {
        const result = await response.json();
        importedCount += result.imported || batch.length;
        console.log(`   📊 进度: ${importedCount}/${data.words.length} (${Math.round(importedCount / data.words.length * 100)}%)`);
      }
    }
    
    console.log(`\n✅ 导入完成! 共导入 ${importedCount} 个单词`);
  }
}

// 验证同步结果
async function verifySync(targetEnv, expectedStats) {
  console.log(`\n🔍 验证同步结果...`);
  
  const response = await fetch(`${targetEnv}/api/admin/export-vocabulary`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`验证失败: 无法获取目标环境数据`);
  }
  
  const data = await response.json();
  
  console.log(`\n📊 同步结果对比:`);
  console.log(`   分类: 期望 ${expectedStats.totalCategories} 个, 实际 ${data.stats.totalCategories} 个 ${data.stats.totalCategories === expectedStats.totalCategories ? '✅' : '❌'}`);
  console.log(`   单词: 期望 ${expectedStats.totalWords} 个, 实际 ${data.stats.totalWords} 个 ${data.stats.totalWords === expectedStats.totalWords ? '✅' : '❌'}`);
  
  if (data.stats.totalCategories === expectedStats.totalCategories && 
      data.stats.totalWords === expectedStats.totalWords) {
    console.log(`\n🎉 同步验证通过!`);
    return true;
  } else {
    console.log(`\n⚠️  同步验证失败，数据不一致!`);
    return false;
  }
}

// 主函数
async function main() {
  console.log('═'.repeat(60));
  console.log('        词库数据同步工具');
  console.log('═'.repeat(60));
  
  const { sourceEnv, targetEnv } = parseArgs();
  
  try {
    // 1. 从源环境导出数据
    const exportData = await exportVocabulary(sourceEnv);
    
    // 2. 保存到本地文件（备份）
    const filepath = await saveToFile(exportData);
    
    // 3. 清空目标环境
    await clearTargetDatabase(targetEnv);
    
    // 4. 导入数据到目标环境
    await importVocabulary(targetEnv, exportData);
    
    // 5. 验证同步结果
    const success = await verifySync(targetEnv, exportData.stats);
    
    console.log('\n' + '═'.repeat(60));
    if (success) {
      console.log('✅ 同步完成!');
    } else {
      console.log('⚠️  同步完成，但数据不一致，请检查!');
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
