/**
 * 清理重复单词 - 改进版
 * 使用更可靠的方式获取所有数据
 */
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const supabase = getSupabaseClient();

async function cleanDuplicates() {
  console.log('=== 开始清理重复单词 ===\n');
  
  // 获取总数
  const { count: totalCount } = await supabase
    .from('words')
    .select('*', { count: 'exact', head: true });
  console.log('当前总记录数:', totalCount);
  
  // 使用游标方式获取所有单词，避免分页问题
  const allWords: Array<{id: number, word: string}> = [];
  let lastId = 0;
  const fetchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('words')
      .select('id, word')
      .gt('id', lastId)
      .order('id', { ascending: true })
      .limit(fetchSize);
    
    if (error) {
      console.error('查询失败:', error);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allWords.push(...data);
    lastId = data[data.length - 1].id;
    console.log('已获取:', allWords.length, '/', totalCount);
  }
  
  console.log('\n获取记录数:', allWords.length);
  
  // 找出重复单词及其ID
  const wordToIds: Record<string, number[]> = {};
  allWords.forEach(w => {
    if (!wordToIds[w.word]) wordToIds[w.word] = [];
    wordToIds[w.word].push(w.id);
  });
  
  // 找出需要删除的ID（保留最小ID）
  const idsToDelete: number[] = [];
  let duplicateWordCount = 0;
  
  for (const [word, ids] of Object.entries(wordToIds)) {
    if (ids.length > 1) {
      duplicateWordCount++;
      // 保留最小ID，删除其他
      const sortedIds = ids.sort((a, b) => a - b);
      const removeIds = sortedIds.slice(1);
      idsToDelete.push(...removeIds);
    }
  }
  
  console.log('唯一单词数:', Object.keys(wordToIds).length);
  console.log('重复单词数:', duplicateWordCount);
  console.log('需删除记录数:', idsToDelete.length);
  
  if (idsToDelete.length === 0) {
    console.log('\n✅ 没有重复单词需要清理！');
    return;
  }
  
  // 批量删除
  console.log('\n开始删除重复记录...');
  const deleteBatchSize = 500;
  let deleted = 0;
  
  for (let i = 0; i < idsToDelete.length; i += deleteBatchSize) {
    const batch = idsToDelete.slice(i, i + deleteBatchSize);
    const { error } = await supabase
      .from('words')
      .delete()
      .in('id', batch);
    
    if (error) {
      console.error('批量删除失败，逐个删除:', error.message);
      for (const id of batch) {
        const { error: singleError } = await supabase
          .from('words')
          .delete()
          .eq('id', id);
        if (!singleError) deleted++;
      }
    } else {
      deleted += batch.length;
      console.log(`已删除 ${deleted}/${idsToDelete.length} 条记录`);
    }
  }
  
  // 验证结果
  const { count: finalCount } = await supabase
    .from('words')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n=== 清理完成 ===');
  console.log('删除记录数:', deleted);
  console.log('最终记录数:', finalCount);
}

cleanDuplicates().catch(console.error);
