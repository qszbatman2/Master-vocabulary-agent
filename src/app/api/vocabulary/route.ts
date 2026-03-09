import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    // 获取词库分类
    const { data: categories, error: categoriesError } = await client
      .from('vocabulary_categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 });
    }

    // 构建单词查询
    let query = client
      .from('words')
      .select('*')
      .order('created_at', { ascending: true });

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', parseInt(categoryId));
    }

    if (search) {
      query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
    }

    const { data: words, error: wordsError } = await query;

    if (wordsError) {
      return NextResponse.json({ error: wordsError.message }, { status: 500 });
    }

    // 关联分类名称
    const wordsWithCategory = words?.map((word) => {
      const category = categories?.find((c) => c.id === word.category_id);
      return {
        ...word,
        vocabulary_categories: { name: category?.name || '' },
      };
    });

    return NextResponse.json({
      categories,
      words: wordsWithCategory,
    });
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    );
  }
}
