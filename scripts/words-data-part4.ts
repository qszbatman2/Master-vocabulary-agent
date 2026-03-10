// Part 4/4 - 单词数据 Part 4 + 主脚本
import { getSupabaseClient } from '../src/storage/database/supabase-client';
import { wordsData } from './words-data-part1';
import { wordsDataPart2 } from './words-data-part2';
import { wordsDataPart3 } from './words-data-part3';

const supabase = getSupabaseClient();

const WORDS_TABLE = 'words';
const CATEGORIES_TABLE = 'vocabulary_categories';

// 合并所有单词数据
const allWords = [...wordsData, ...wordsDataPart2, ...wordsDataPart3];

// 获取分类ID映射
async function getCategoryIds(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from(CATEGORIES_TABLE)
    .select('id, name');
  
  if (error) {
    console.error('获取分类失败:', error);
    return new Map();
  }
  
  const map = new Map<string, number>();
  data?.forEach((cat: { id: number; name: string }) => map.set(cat.name, cat.id));
  return map;
}

// 获取已存在的单词
async function getExistingWords(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from(WORDS_TABLE)
    .select('word');
  
  if (error) return new Set();
  return new Set(data?.map((w: { word: string }) => w.word.toLowerCase()) || []);
}

// 插入单词
async function insertWords(words: typeof allWords, categoryIds: Map<string, number>, existingSet: Set<string>): Promise<number> {
  const defaultCategoryId = categoryIds.get('日常词汇') || 1;
  let inserted = 0;
  const records: Array<{
    word: string;
    phonetic: string;
    meaning: string;
    example_sentence: string;
    category_id: number;
  }> = [];
  
  for (const w of words) {
    const word = w.word.toLowerCase().trim();
    if (!word || !w.meaning || existingSet.has(word)) continue;
    
    records.push({
      word,
      phonetic: w.phonetic || '',
      meaning: w.meaning.trim(),
      example_sentence: `This is an example using the word "${w.word}".`,
      category_id: categoryIds.get(w.category) || defaultCategoryId,
    });
    existingSet.add(word);
  }
  
  // 批量插入
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from(WORDS_TABLE).insert(batch);
    if (!error) {
      inserted += batch.length;
      console.log(`已插入 ${inserted}/${records.length} 个单词`);
    } else {
      console.error('批量插入失败，尝试逐个插入:', error.message);
      for (const record of batch) {
        const { error: singleError } = await supabase.from(WORDS_TABLE).insert(record);
        if (!singleError) inserted++;
      }
    }
  }
  
  return inserted;
}

// 获取当前单词总数
async function getCurrentCount(): Promise<number> {
  const { count } = await supabase
    .from(WORDS_TABLE)
    .select('*', { count: 'exact', head: true });
  return count || 0;
}

async function main() {
  console.log('=== 开始导入单词数据 ===');
  console.log(`预定义单词数量: ${allWords.length}`);
  
  // 获取分类
  const categoryIds = await getCategoryIds();
  console.log('分类:', Object.fromEntries(categoryIds));
  
  // 获取已存在的单词
  const existingSet = await getExistingWords();
  console.log(`已存在单词: ${existingSet.size} 个`);
  
  // 插入新单词
  const inserted = await insertWords(allWords, categoryIds, existingSet);
  
  console.log(`\n=== 导入完成 ===`);
  console.log(`本次导入: ${inserted} 个单词`);
  console.log(`总单词数: ${await getCurrentCount()} 个`);
}

main().catch(console.error);
