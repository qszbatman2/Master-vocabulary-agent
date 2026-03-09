import { getSupabaseClient } from '../src/storage/database/supabase-client';

const client = getSupabaseClient();

async function fixCategoryIds() {
  try {
    // 更新单词的 category_id
    // id 1-10 应该是雅思词汇 (category_id: 1)
    // id 11-20 应该是托福词汇 (category_id: 2)
    // id 21-30 应该是 GRE 词汇 (category_id: 3)
    // id 31-40 应该是日常词汇 (category_id: 4)

    console.log('更新雅思词汇...');
    const { error: error1 } = await client
      .from('words')
      .update({ category_id: 1 })
      .gte('id', 1)
      .lte('id', 10);

    if (error1) console.error('雅思词汇更新失败:', error1);

    console.log('更新托福词汇...');
    const { error: error2 } = await client
      .from('words')
      .update({ category_id: 2 })
      .gte('id', 11)
      .lte('id', 20);

    if (error2) console.error('托福词汇更新失败:', error2);

    console.log('更新 GRE 词汇...');
    const { error: error3 } = await client
      .from('words')
      .update({ category_id: 3 })
      .gte('id', 21)
      .lte('id', 30);

    if (error3) console.error('GRE词汇更新失败:', error3);

    console.log('更新日常词汇...');
    const { error: error4 } = await client
      .from('words')
      .update({ category_id: 4 })
      .gte('id', 31)
      .lte('id', 40);

    if (error4) console.error('日常词汇更新失败:', error4);

    console.log('验证数据...');
    const { data, error } = await client
      .from('words')
      .select('id, word, category_id')
      .order('id');

    if (error) {
      console.error('查询失败:', error);
      return;
    }

    console.log('更新后的数据（前5条）:', data?.slice(0, 5));
    console.log('更新后的数据（后5条）:', data?.slice(-5));
  } catch (error) {
    console.error('修复数据失败:', error);
  }
}

fixCategoryIds();
