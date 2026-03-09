// Y-Z字母开头的单词
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const supabase = getSupabaseClient();
const WORDS_TABLE = 'words';
const CATEGORIES_TABLE = 'vocabulary_categories';

interface WordData {
  word: string;
  phonetic: string;
  meaning: string;
  category?: string;
}

const wordsYZ: WordData[] = [
  // Y 字母开头的单词
  { word: 'yard', phonetic: '/jɑːrd/', meaning: 'n. 院子；码', category: '托福词汇' },
  { word: 'yawn', phonetic: '/jɔːn/', meaning: 'v./n. 打哈欠', category: '托福词汇' },
  { word: 'yeah', phonetic: '/jeə/', meaning: 'adv. 是的', category: '日常词汇' },
  { word: 'year', phonetic: '/jɪr/', meaning: 'n. 年', category: '日常词汇' },
  { word: 'yearly', phonetic: '/ˈjɪrli/', meaning: 'adj. 每年的 adv. 每年', category: '托福词汇' },
  { word: 'yearn', phonetic: '/jɜːrn/', meaning: 'v. 渴望', category: 'GRE词汇' },
  { word: 'yeast', phonetic: '/jiːst/', meaning: 'n. 酵母', category: 'GRE词汇' },
  { word: 'yell', phonetic: '/jel/', meaning: 'v./n. 大叫', category: '托福词汇' },
  { word: 'yellow', phonetic: '/ˈjeloʊ/', meaning: 'adj. 黄色的 n. 黄色', category: '日常词汇' },
  { word: 'yes', phonetic: '/jes/', meaning: 'adv. 是的', category: '日常词汇' },
  { word: 'yesterday', phonetic: '/ˈjestərdeɪ/', meaning: 'n./adv. 昨天', category: '日常词汇' },
  { word: 'yet', phonetic: '/jet/', meaning: 'adv. 还；但是', category: '托福词汇' },
  { word: 'yield', phonetic: '/jiːld/', meaning: 'v. 产出；屈服 n. 产量', category: 'GRE词汇' },
  { word: 'yoga', phonetic: '/ˈjoʊɡə/', meaning: 'n. 瑜伽', category: '托福词汇' },
  { word: 'yogurt', phonetic: '/ˈjoʊɡərt/', meaning: 'n. 酸奶', category: '托福词汇' },
  { word: 'you', phonetic: '/juː/', meaning: 'pron. 你；你们', category: '日常词汇' },
  { word: 'young', phonetic: '/jʌŋ/', meaning: 'adj. 年轻的', category: '日常词汇' },
  { word: 'youngster', phonetic: '/ˈjʌŋstər/', meaning: 'n. 年轻人', category: '托福词汇' },
  { word: 'your', phonetic: '/jʊr/', meaning: 'pron. 你的；你们的', category: '日常词汇' },
  { word: 'yours', phonetic: '/jʊrz/', meaning: 'pron. 你的（东西）', category: '日常词汇' },
  { word: 'yourself', phonetic: '/jɔːrˈself/', meaning: 'pron. 你自己', category: '日常词汇' },
  { word: 'youth', phonetic: '/juːθ/', meaning: 'n. 青春；年轻人', category: '托福词汇' },
  
  // Z 字母开头的单词
  { word: 'zeal', phonetic: '/ziːl/', meaning: 'n. 热情', category: 'GRE词汇' },
  { word: 'zebra', phonetic: '/ˈziːbrə/', meaning: 'n. 斑马', category: '托福词汇' },
  { word: 'zero', phonetic: '/ˈzɪroʊ/', meaning: 'num. 零', category: '日常词汇' },
  { word: 'zigzag', phonetic: '/ˈzɪɡzæɡ/', meaning: 'n. 之字形 adj. 之字形的', category: 'GRE词汇' },
  { word: 'zinc', phonetic: '/zɪŋk/', meaning: 'n. 锌', category: 'GRE词汇' },
  { word: 'zone', phonetic: '/zoʊn/', meaning: 'n. 区域 v. 分区', category: '托福词汇' },
  { word: 'zoo', phonetic: '/zuː/', meaning: 'n. 动物园', category: '日常词汇' },
  { word: 'zoom', phonetic: '/zuːm/', meaning: 'v. 激增；放大 n. 变焦', category: '托福词汇' },
];

async function getCategoryIds(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from(CATEGORIES_TABLE)
    .select('id, name');
  
  if (error) return new Map();
  
  const map = new Map<string, number>();
  data?.forEach((cat: { id: number; name: string }) => map.set(cat.name, cat.id));
  return map;
}

async function getExistingWords(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from(WORDS_TABLE)
    .select('word');
  
  if (error) return new Set();
  return new Set(data?.map((w: { word: string }) => w.word.toLowerCase()) || []);
}

async function insertWords(words: WordData[], categoryIds: Map<string, number>, existingSet: Set<string>): Promise<number> {
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
    const wordLower = w.word.toLowerCase();
    if (existingSet.has(wordLower)) continue;
    
    const categoryId = categoryIds.get(w.category || '日常词汇') || defaultCategoryId;
    records.push({
      word: w.word,
      phonetic: w.phonetic,
      meaning: w.meaning,
      example_sentence: '',
      category_id: categoryId,
    });
    inserted++;
  }
  
  if (records.length > 0) {
    const { error } = await supabase.from(WORDS_TABLE).insert(records);
    if (error) {
      console.error('插入失败:', error.message);
      return 0;
    }
  }
  
  return inserted;
}

async function main() {
  console.log('=== 开始导入 Y-Z 字母开头的单词 ===');
  console.log(`预定义单词数量: ${wordsYZ.length}`);
  
  const categoryIds = await getCategoryIds();
  const existingSet = await getExistingWords();
  console.log(`已存在单词: ${existingSet.size} 个`);
  
  const inserted = await insertWords(wordsYZ, categoryIds, existingSet);
  
  console.log(`\n=== 导入完成 ===`);
  console.log(`本次导入: ${inserted} 个单词`);
}

main().catch(console.error);
