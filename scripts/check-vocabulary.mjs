import { createClient } from '@supabase/supabase-js';

const url = process.env.COZE_SUPABASE_URL;
const key = process.env.COZE_SUPABASE_ANON_KEY;

const client = createClient(url, key);

async function fetchAll(query, pageSize = 1000) {
  const all = [];
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await query.range(from, to);
    if (error) throw error;
    const batch = data || [];
    all.push(...batch);
    if (batch.length < pageSize) break;
  }
  return all;
}

// 1. 获取所有分类及其词汇数量
const { data: categories } = await client
  .from('categories')
  .select('id, name');

console.log('\n=== 各分类词汇数量 ===\n');

for (const cat of categories || []) {
  const { count } = await client
    .from('words')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', cat.id);
  console.log(`${cat.name}: ${count || 0} 词`);
}

// 2. 获取总词汇数
const { count: totalWords } = await client
  .from('words')
  .select('*', { count: 'exact', head: true });

console.log(`\n总记录数: ${totalWords}`);

// 3. 获取去重后的词汇数
const allWords = await fetchAll(
  client.from('words').select('word')
);

const uniqueWords = new Set(allWords?.map(w => w.word) || []);
console.log(`去重后词汇数: ${uniqueWords.size}`);

// 4. 找出存在于多个分类的词
const wordsWithCategory = await fetchAll(
  client.from('words').select('word, category_id, categories(name)')
);

const wordCategoryMap = new Map();
wordsWithCategory?.forEach(w => {
  const cats = wordCategoryMap.get(w.word) || [];
  const catName = w.categories?.name || `ID:${w.category_id}`;
  if (!cats.includes(catName)) {
    cats.push(catName);
  }
  wordCategoryMap.set(w.word, cats);
});

const multiCategoryWords = [];
wordCategoryMap.forEach((cats, word) => {
  if (cats.length > 1) {
    multiCategoryWords.push({ word, categories: cats });
  }
});

console.log(`\n存在于多个分类的词数量: ${multiCategoryWords.length}`);

if (multiCategoryWords.length > 0) {
  console.log('\n示例（前10个）:');
  multiCategoryWords.slice(0, 10).forEach(item => {
    console.log(`  ${item.word}: [${item.categories.join(', ')}]`);
  });
  
  // 分类交叉统计
  console.log('\n=== 分类交叉统计 ===\n');
  
  const crossStats = new Map();
  multiCategoryWords.forEach(item => {
    const key = item.categories.sort().join(' & ');
    crossStats.set(key, (crossStats.get(key) || 0) + 1);
  });
  
  const sortedCross = Array.from(crossStats.entries()).sort((a, b) => b[1] - a[1]);
  sortedCross.slice(0, 10).forEach(([key, count]) => {
    console.log(`${key}: ${count} 词`);
  });
}
