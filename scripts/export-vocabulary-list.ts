/**
 * 从数据库导出词汇表
 */
import { getSupabaseClient } from '../src/storage/database/supabase-client';
import * as fs from 'fs';

async function exportVocabulary() {
  const client = getSupabaseClient();
  
  // 获取所有分类
  const { data: categories, error: catError } = await client
    .from('vocabulary_categories')
    .select('*')
    .order('id');
  
  if (catError) {
    console.error('获取分类失败:', catError);
    return;
  }
  
  console.log('分类列表:', categories?.map(c => c.name).join(', '));
  
  // 分页获取所有单词
  const allWords: any[] = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: words, error } = await client
      .from('words')
      .select('*')
      .order('word')
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      console.error('获取单词失败:', error);
      break;
    }
    
    if (!words || words.length === 0) {
      break;
    }
    
    allWords.push(...words);
    console.log(`已获取 ${allWords.length} 个单词...`);
    
    if (words.length < pageSize) {
      break;
    }
    
    offset += pageSize;
  }
  
  console.log(`\n总计: ${allWords.length} 个单词`);
  
  // 按分类统计
  const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);
  const stats: Record<string, number> = {};
  allWords.forEach(w => {
    const catName = categoryMap.get(w.category_id) || '未分类';
    stats[catName] = (stats[catName] || 0) + 1;
  });
  
  console.log('\n分类统计:');
  Object.entries(stats).forEach(([name, count]) => {
    console.log(`  ${name}: ${count} 个`);
  });
  
  // 构建导出数据
  const exportData = {
    exportTime: new Date().toISOString(),
    total: allWords.length,
    categories: categories,
    stats: stats,
    words: allWords.map(w => ({
      word: w.word,
      phonetic: w.phonetic,
      meaning: w.meaning,
      example_sentence: w.example_sentence,
      example_sentence_cn: w.example_sentence_cn,
      category: categoryMap.get(w.category_id) || ''
    }))
  };
  
  // 保存为 JSON
  const outputPath = '/tmp/vocabulary-export.json';
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`\n已导出到: ${outputPath}`);
  
  // 同时导出 CSV 格式
  const csvLines = [
    '单词,音标,释义,例句,例句翻译,分类',
    ...allWords.map(w => {
      const escapeCsv = (s: string | null) => {
        if (!s) return '';
        // 如果包含逗号、引号或换行，用引号包裹
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };
      return [
        escapeCsv(w.word),
        escapeCsv(w.phonetic),
        escapeCsv(w.meaning),
        escapeCsv(w.example_sentence),
        escapeCsv(w.example_sentence_cn),
        escapeCsv(categoryMap.get(w.category_id) || '')
      ].join(',');
    })
  ];
  
  const csvPath = '/tmp/vocabulary-export.csv';
  fs.writeFileSync(csvPath, '\uFEFF' + csvLines.join('\n'), 'utf-8'); // 添加 BOM 支持 Excel 打开
  console.log(`CSV 已导出到: ${csvPath}`);
  
  // 输出前10个单词预览
  console.log('\n前10个单词预览:');
  allWords.slice(0, 10).forEach(w => {
    console.log(`  ${w.word} - ${w.meaning} [${categoryMap.get(w.category_id)}]`);
  });
}

exportVocabulary().catch(console.error);
