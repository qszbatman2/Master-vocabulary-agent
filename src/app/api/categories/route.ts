import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { initializeDatabase } from '@/lib/db-init';

export async function GET() {
  try {
    // 自动初始化数据库
    await initializeDatabase();
    
    const client = getSupabaseClient();
    
    // 获取所有分类
    const { data: categories, error } = await client
      .from('vocabulary_categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取每个分类的词汇数，过滤掉没有词汇的分类
    const categoriesWithWords = [];
    
    for (const category of categories || []) {
      const { count } = await client
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);
      
      if (count && count > 0) {
        categoriesWithWords.push({
          ...category,
          word_count: count
        });
      }
    }

    return NextResponse.json({ categories: categoriesWithWords });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
