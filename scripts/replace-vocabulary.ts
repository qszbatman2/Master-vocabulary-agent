/**
 * 替换词库脚本
 * 从 DB-data.json 文件导入词库数据到数据库
 */

import { getSupabaseClient } from '../src/storage/database/supabase-client';
import * as fs from 'fs';
import * as path from 'path';

const BATCH_SIZE = 500; // 每批导入的单词数量

interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface Word {
  word: string;
  phonetic: string;
  meaning: string;
  example_sentence: string;
  example_sentence_cn: string | null;
  category: string;
}

interface DBData {
  exportTime: string;
  total: number;
  categories: Category[];
  stats: Record<string, number>;
  words: Word[];
}

async function replaceVocabulary() {
  const client = getSupabaseClient();
  
  // 读取数据文件
  const dataPath = path.join(process.cwd(), 'assets', 'DB-data.json');
  console.log('读取数据文件:', dataPath);
  
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const data: DBData = JSON.parse(fileContent);
  
  console.log('数据统计:');
  console.log('- 分类数:', data.categories.length);
  console.log('- 单词总数:', data.words.length);
  console.log('- 导出时间:', data.exportTime);
  
  // Step 1: 清空现有数据
  console.log('\n=== Step 1: 清空现有数据 ===');
  
  // 删除单词状态记录
  const { error: deleteStatusError } = await client
    .from('user_word_status')
    .delete()
    .neq('id', 0);
  
  if (deleteStatusError) {
    console.error('删除单词状态失败:', deleteStatusError);
  } else {
    console.log('✓ 已清空单词状态记录');
  }
  
  // 删除单词
  const { error: deleteWordsError } = await client
    .from('words')
    .delete()
    .neq('id', 0);
  
  if (deleteWordsError) {
    console.error('删除单词失败:', deleteWordsError);
  } else {
    console.log('✓ 已清空单词表');
  }
  
  // 删除分类
  const { error: deleteCategoriesError } = await client
    .from('vocabulary_categories')
    .delete()
    .neq('id', 0);
  
  if (deleteCategoriesError) {
    console.error('删除分类失败:', deleteCategoriesError);
  } else {
    console.log('✓ 已清空分类表');
  }
  
  // Step 2: 导入分类
  console.log('\n=== Step 2: 导入分类 ===');
  
  const categoriesToInsert = data.categories.map(cat => ({
    name: cat.name,
    description: cat.description,
  }));
  
  const { data: insertedCategories, error: insertCategoriesError } = await client
    .from('vocabulary_categories')
    .insert(categoriesToInsert)
    .select('id, name');
  
  if (insertCategoriesError) {
    console.error('导入分类失败:', insertCategoriesError);
    process.exit(1);
  }
  
  console.log('✓ 已导入', insertedCategories?.length || 0, '个分类');
  
  // 创建分类名称到 ID 的映射
  const categoryNameToId = new Map<string, number>();
  insertedCategories?.forEach(cat => {
    categoryNameToId.set(cat.name, cat.id);
  });
  
  // Step 3: 导入单词（分批）
  console.log('\n=== Step 3: 导入单词 ===');
  
  const totalWords = data.words.length;
  let importedCount = 0;
  let failedCount = 0;
  
  // 准备单词数据
  const wordsToInsert = data.words.map(word => ({
    word: word.word,
    phonetic: word.phonetic || '',
    meaning: word.meaning,
    example_sentence: word.example_sentence || '',
    example_sentence_cn: word.example_sentence_cn || null,
    category_id: categoryNameToId.get(word.category) || 1,
  }));
  
  // 分批导入
  for (let i = 0; i < wordsToInsert.length; i += BATCH_SIZE) {
    const batch = wordsToInsert.slice(i, i + BATCH_SIZE);
    
    const { error: insertError } = await client
      .from('words')
      .insert(batch);
    
    if (insertError) {
      console.error(`导入第 ${i + 1} - ${i + batch.length} 条失败:`, insertError.message);
      failedCount += batch.length;
    } else {
      importedCount += batch.length;
      const progress = Math.round(((i + batch.length) / totalWords) * 100);
      process.stdout.write(`\r进度: ${importedCount}/${totalWords} (${progress}%)`);
    }
  }
  
  console.log('\n');
  console.log('=== 导入完成 ===');
  console.log('成功导入:', importedCount, '个单词');
  if (failedCount > 0) {
    console.log('失败:', failedCount, '个单词');
  }
  
  // 验证
  const { count: finalWordCount } = await client
    .from('words')
    .select('*', { count: 'exact', head: true });
  
  const { count: finalCategoryCount } = await client
    .from('vocabulary_categories')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n=== 最终统计 ===');
  console.log('分类总数:', finalCategoryCount);
  console.log('单词总数:', finalWordCount);
  
  process.exit(0);
}

replaceVocabulary().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
