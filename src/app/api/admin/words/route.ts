import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 授权检查
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
  return authHeader === `Bearer ${adminKey}`;
}

/**
 * 获取所有单词（分页）- 管理员用
 * GET /api/admin/words?page=1&pageSize=50&category=&search=&hasEmptyExample=false
 * 
 * 查询参数：
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认50
 * - category: 分类ID或名称（可选）
 * - search: 搜索单词或释义（可选）
 * - hasEmptyExample: 只显示例句或翻译为空的单词（可选）
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const hasEmptyExample = searchParams.get('hasEmptyExample') === 'true';

    // 构建查询
    let query = client
      .from('words')
      .select(`
        id,
        word,
        phonetic,
        meaning,
        example_sentence,
        example_sentence_cn,
        category_id,
        created_at,
        vocabulary_categories (
          id,
          name
        )
      `, { count: 'exact' });

    // 分类筛选
    if (category && category !== 'all') {
      // 先检查是ID还是名称
      const categoryId = parseInt(category);
      if (!isNaN(categoryId)) {
        query = query.eq('category_id', categoryId);
      } else {
        // 按名称查找分类ID
        const { data: catData } = await client
          .from('vocabulary_categories')
          .select('id')
          .eq('name', category)
          .single();
        if (catData) {
          query = query.eq('category_id', catData.id);
        }
      }
    }

    // 搜索
    if (search) {
      query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
    }

    // 只显示空例句或空翻译的
    if (hasEmptyExample) {
      query = query.or('example_sentence.is.null,example_sentence.eq.,example_sentence_cn.is.null,example_sentence_cn.eq.');
    }

    // 按单词排序
    query = query.order('word', { ascending: true });

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: words, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取所有分类列表
    const { data: categories } = await client
      .from('vocabulary_categories')
      .select('id, name')
      .order('name');

    return NextResponse.json({
      success: true,
      words: words || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      categories: categories || [],
    });
  } catch (error) {
    console.error('获取单词失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

/**
 * 更新单个单词 - 管理员用
 * PUT /api/admin/words
 * 
 * Body: {
 *   id: number,           // 单词ID（必填）
 *   word?: string,        // 单词（可选）
 *   phonetic?: string,    // 音标（可选）
 *   meaning?: string,     // 释义（可选）
 *   example_sentence?: string,      // 例句（可选）
 *   example_sentence_cn?: string,   // 例句中文翻译（可选）
 *   category_id?: number  // 分类ID（可选）
 * }
 */
export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, word, phonetic, meaning, example_sentence, example_sentence_cn, category_id } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少单词ID' }, { status: 400 });
    }

    // 构建更新对象
    const updateData: Record<string, any> = {};
    if (word !== undefined) updateData.word = word.toLowerCase().trim();
    if (phonetic !== undefined) updateData.phonetic = phonetic;
    if (meaning !== undefined) updateData.meaning = meaning;
    if (example_sentence !== undefined) updateData.example_sentence = example_sentence;
    if (example_sentence_cn !== undefined) updateData.example_sentence_cn = example_sentence_cn;
    if (category_id !== undefined) updateData.category_id = category_id;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 });
    }

    const { data, error } = await client
      .from('words')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        word,
        phonetic,
        meaning,
        example_sentence,
        example_sentence_cn,
        category_id,
        vocabulary_categories (
          id,
          name
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      word: data,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新单词失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

/**
 * 批量更新单词 - 管理员用
 * PATCH /api/admin/words
 * 
 * Body: {
 *   updates: Array<{
 *     id: number,
 *     example_sentence?: string,
 *     example_sentence_cn?: string,
 *     ...其他字段
 *   }>
 * }
 */
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates 必须是非空数组' }, { status: 400 });
    }

    const results = {
      total: updates.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const update of updates) {
      const { id, ...fields } = update;
      
      if (!id) {
        results.failed++;
        results.errors.push('缺少单词ID');
        continue;
      }

      const { error } = await client
        .from('words')
        .update(fields)
        .eq('id', id);

      if (error) {
        results.failed++;
        results.errors.push(`ID ${id}: ${error.message}`);
      } else {
        results.success++;
      }
    }

    return NextResponse.json({
      success: true,
      total: results.total,
      updated: results.success,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('批量更新失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
