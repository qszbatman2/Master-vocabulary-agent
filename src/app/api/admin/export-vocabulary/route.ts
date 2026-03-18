import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const ADMIN_TOKEN = process.env.ADMIN_KEY || 'vocabulary-admin-2024';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseClient();

    // 获取所有分类
    const { data: categories, error: catError } = await client
      .from('vocabulary_categories')
      .select('*')
      .order('id');

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    // 获取所有单词
    const { data: words, error: wordsError } = await client
      .from('words')
      .select('*')
      .order('id');

    if (wordsError) {
      return NextResponse.json({ error: wordsError.message }, { status: 500 });
    }

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      categories: categories || [],
      words: words || [],
      stats: {
        totalCategories: categories?.length || 0,
        totalWords: words?.length || 0,
      }
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
