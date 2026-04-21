import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../src/storage/database/supabase-client';
import { fetchAllFromSupabase } from '../src/lib/supabase-fetch-all';

const supabase = getSupabaseClient();
const llmClient = new LLMClient(new Config());

const WORDS_TABLE = 'words';
const CATEGORIES_TABLE = 'vocabulary_categories';

interface WordData {
  word: string;
  phonetic: string;
  meaning: string;
  example_sentence: string;
  category: string;
}

// 获取已存在的单词
async function getExistingWords(): Promise<string[]> {
  const { data, error } = await fetchAllFromSupabase(
    supabase.from(WORDS_TABLE).select('word')
  );
  
  if (error || !data) return [];
  return data.map((w: { word: string }) => w.word.toLowerCase());
}

// 获取分类ID映射
async function getCategoryIds(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from(CATEGORIES_TABLE)
    .select('id, name');
  
  if (error) return new Map();
  
  const map = new Map<string, number>();
  data?.forEach((cat: { id: number; name: string }) => map.set(cat.name, cat.id));
  return map;
}

// 使用LLM生成单词
async function generateWordsWithLLM(
  batchNumber: number,
  existingWords: string[],
  targetCategory: string,
  count: number = 40
): Promise<WordData[]> {
  // 显示部分已存在单词作为提示
  const existingSample = existingWords.slice(-200).join(', ');
  
  const prompt = `Generate ${count} UNCOMMON English vocabulary words for advanced learners.

Category: ${targetCategory}

IMPORTANT RULES:
1. Generate UNCOMMON words (not basic words like "good", "bad", "make", "take")
2. Words should be at intermediate to advanced level
3. Do NOT generate any of these existing words: ${existingSample}

For each word, provide:
- word: the English word
- phonetic: IPA phonetic transcription
- meaning: Chinese meaning with part of speech (e.g., "v. 坚持；强调")
- example_sentence: a natural English sentence using the word
- category: "${targetCategory}"

Return ONLY a JSON array:
[{"word":"meticulous","phonetic":"/məˈtɪkjələs/","meaning":"adj. 一丝不苟的；细致的","example_sentence":"She is meticulous in her work.","category":"${targetCategory}"}]`;

  try {
    const response = await llmClient.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.7 }
    );
    
    let content = response.content.trim();
    
    // 提取JSON数组
    const startIdx = content.indexOf('[');
    const endIdx = content.lastIndexOf(']');
    
    if (startIdx === -1 || endIdx === -1) {
      console.error(`批次 ${batchNumber}: 未找到JSON数组`);
      return [];
    }
    
    const jsonStr = content.substring(startIdx, endIdx + 1)
      .replace(/,\s*]/g, ']')
      .replace(/}\s*{/g, '},{');
    
    try {
      const words: WordData[] = JSON.parse(jsonStr);
      return words.filter(w => w.word && w.meaning);
    } catch {
      // 尝试逐个解析
      const objects = jsonStr.match(/\{[^{}]*"word"[^{}]*\}/g) || [];
      const results: WordData[] = [];
      
      for (const obj of objects) {
        try {
          results.push(JSON.parse(obj));
        } catch {}
      }
      return results.filter(w => w.word && w.meaning);
    }
  } catch (error) {
    console.error(`批次 ${batchNumber} 失败:`, error);
    return [];
  }
}

// 插入单词
async function insertWords(words: WordData[], categoryIds: Map<string, number>, existingSet: Set<string>): Promise<number> {
  if (words.length === 0) return 0;
  
  const defaultCategoryId = categoryIds.get('日常词汇') || 1;
  let inserted = 0;
  
  for (const w of words) {
    const word = w.word.toLowerCase().trim();
    if (!word || !w.meaning || existingSet.has(word)) continue;
    
    const record = {
      word,
      phonetic: w.phonetic || '',
      meaning: w.meaning.trim(),
      exampleSentence: w.example_sentence || '',
      categoryId: categoryIds.get(w.category) || defaultCategoryId,
    };
    
    const { error } = await supabase.from(WORDS_TABLE).insert(record);
    if (!error) {
      existingSet.add(word);
      inserted++;
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
  console.log('=== 开始扩展单词库到2000个 ===');
  const startTime = Date.now();
  
  const categoryIds = await getCategoryIds();
  const categoryNames = Array.from(categoryIds.keys());
  console.log('分类:', categoryNames);
  
  let existingWords = await getExistingWords();
  let existingSet = new Set(existingWords);
  let currentCount = existingWords.length;
  
  console.log(`当前单词数量: ${currentCount}`);
  
  const targetCount = 2000;
  const batchSize = 40;
  let batchIndex = 0;
  let totalInserted = 0;
  let noNewWordsCount = 0;
  
  while (currentCount < targetCount && noNewWordsCount < 10) {
    batchIndex++;
    const category = categoryNames[batchIndex % categoryNames.length];
    
    console.log(`\n[${batchIndex}] ${category} | 进度: ${currentCount}/${targetCount}`);
    
    const words = await generateWordsWithLLM(batchIndex, existingWords, category, batchSize);
    console.log(`生成了 ${words.length} 个单词`);
    
    const inserted = await insertWords(words, categoryIds, existingSet);
    
    if (inserted > 0) {
      totalInserted += inserted;
      noNewWordsCount = 0;
      currentCount += inserted;
      existingWords = Array.from(existingSet);
    } else {
      noNewWordsCount++;
    }
    
    console.log(`本批插入: ${inserted} | 总新增: ${totalInserted} | 总数: ${currentCount}`);
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== 完成 ===`);
  console.log(`新增: ${totalInserted} | 最终总数: ${await getCurrentCount()}`);
  console.log(`耗时: ${elapsed} 分钟`);
}

main().catch(console.error);
