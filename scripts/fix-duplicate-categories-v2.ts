/**
 * 修复重复的分类数据
 */
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const supabase = getSupabaseClient();

async function fixCategories() {
  // 获取所有分类
  const { data: categories, error } = await supabase
    .from('vocabulary_categories')
    .select('id, name')
    .order('id');
  
  if (error) {
    console.error('获取分类失败:', error);
    return;
  }
  
  console.log('所有分类:', categories);
  
  // 找出重复的分类（保留ID小的）
  const nameToIds: Record<string, number[]> = {};
  categories?.forEach(cat => {
    if (!nameToIds[cat.name]) nameToIds[cat.name] = [];
    nameToIds[cat.name].push(cat.id);
  });
  
  console.log('\n分类ID映射:', nameToIds);
  
  // 对于重复的分类，将单词迁移到第一个ID
  for (const [name, ids] of Object.entries(nameToIds)) {
    if (ids.length > 1) {
      const keepId = ids[0];
      const removeIds = ids.slice(1);
      console.log(`\n处理重复分类: ${name}`);
      console.log(`  保留 ID: ${keepId}`);
      console.log(`  删除 ID: ${removeIds.join(', ')}`);
      
      // 将单词迁移到保留的分类
      for (const removeId of removeIds) {
        const { error: updateError } = await supabase
          .from('words')
          .update({ category_id: keepId })
          .eq('category_id', removeId);
        
        if (updateError) {
          console.error(`  迁移单词失败 (ID ${removeId}):`, updateError);
        } else {
          console.log(`  已迁移 ID ${removeId} 的单词到 ID ${keepId}`);
        }
        
        // 删除重复分类
        const { error: deleteError } = await supabase
          .from('vocabulary_categories')
          .delete()
          .eq('id', removeId);
        
        if (deleteError) {
          console.error(`  删除分类失败 (ID ${removeId}):`, deleteError);
        } else {
          console.log(`  已删除重复分类 ID ${removeId}`);
        }
      }
    }
  }
  
  // 重新统计
  const { data: finalCats } = await supabase
    .from('vocabulary_categories')
    .select('id, name')
    .order('id');
  
  console.log('\n=== 修复后的分类 ===');
  for (const cat of finalCats || []) {
    const { count } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', cat.id);
    console.log(`  ${cat.name} (ID: ${cat.id}): ${count} 个单词`);
  }
  
  // 总单词数
  const { count: totalCount } = await supabase
    .from('words')
    .select('*', { count: 'exact', head: true });
  console.log(`\n总单词数: ${totalCount}`);
}

fixCategories().catch(console.error);
