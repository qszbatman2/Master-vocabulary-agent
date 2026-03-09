import { getSupabaseClient } from '../src/storage/database/supabase-client';

const client = getSupabaseClient();

async function fixData() {
  try {
    // 删除重复的分类数据（保留 id 1-4）
    console.log('删除重复的分类数据...');
    const { error: deleteError } = await client
      .from('vocabulary_categories')
      .delete()
      .gt('id', 4);

    if (deleteError) {
      console.error('删除失败:', deleteError);
      return;
    }

    console.log('删除成功！');

    // 验证数据
    const { data: categories, error: selectError } = await client
      .from('vocabulary_categories')
      .select('*');

    if (selectError) {
      console.error('查询失败:', selectError);
      return;
    }

    console.log('当前分类数据:', categories);
  } catch (error) {
    console.error('修复数据失败:', error);
  }
}

fixData();
