import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { initializeDatabase } from '@/lib/db-init';

export async function GET() {
  try {
    // 自动初始化数据库
    await initializeDatabase();
    
    const client = getSupabaseClient();
    const { data: categories, error } = await client
      .from('vocabulary_categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
