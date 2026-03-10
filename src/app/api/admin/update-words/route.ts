import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 授权检查
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
  return authHeader === `Bearer ${adminKey}`;
}

interface WordData {
  word: string;
  phonetic?: string;
  meaning?: string;
  example_sentence?: string;
  example_sentence_cn?: string;
  category?: string; // 分类名称
  category_id?: number; // 或分类ID
  action?: 'upsert' | 'insert' | 'update' | 'delete'; // 操作类型
}

/**
 * 单词更新API
 * POST /api/admin/update-words
 * 
 * Body: {
 *   words: WordData[],
 *   action: 'upsert' | 'insert' | 'update' | 'delete'  // 默认 upsert
 * }
 * 
 * 单词格式:
 * {
 *   word: "abandon",           // 必填
 *   phonetic: "/əˈbændən/",    // 可选
 *   meaning: "v. 放弃",         // 可选
 *   example_sentence: "...",   // 可选
 *   example_sentence_cn: "...",// 可选
 *   category: "托福词汇"        // 分类名称（可选，默认托福词汇）
 * }
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { words, action = 'upsert' } = body as { words: WordData[]; action?: string };

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: 'words 必须是非空数组' }, { status: 400 });
    }

    console.log(`收到 ${words.length} 个单词更新请求，操作类型: ${action}`);

    // 1. 获取分类映射
    const { data: categories } = await client
      .from('vocabulary_categories')
      .select('id, name');

    const categoryMap = new Map<string, number>();
    categories?.forEach(c => categoryMap.set(c.name, c.id));

    // 默认分类
    const defaultCategoryId = categoryMap.get('托福词汇') || 1;

    // 2. 根据操作类型处理
    const results = {
      total: words.length,
      inserted: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      errors: [] as string[],
    };

    if (action === 'delete') {
      // 删除模式：按单词文本删除
      const wordsToDelete = words.map(w => w.word.toLowerCase());
      
      const { error, count } = await client
        .from('words')
        .delete()
        .in('word', wordsToDelete);

      if (error) {
        results.errors.push(error.message);
      } else {
        results.deleted = count || words.length;
      }
    } else {
      // 插入/更新模式
      const records = [];
      
      for (const w of words) {
        if (!w.word) {
          results.skipped++;
          continue;
        }

        const categoryId = w.category_id || (w.category ? categoryMap.get(w.category) : undefined) || defaultCategoryId;

        records.push({
          word: w.word.toLowerCase().trim(),
          phonetic: w.phonetic || '',
          meaning: w.meaning || '',
          example_sentence: w.example_sentence || '',
          example_sentence_cn: w.example_sentence_cn || '',
          category_id: categoryId,
        });
      }

      if (records.length === 0) {
        return NextResponse.json({ error: '没有有效的单词数据' }, { status: 400 });
      }

      if (action === 'insert') {
        // 仅插入（跳过已存在的）
        const { data, error } = await client
          .from('words')
          .insert(records)
          .select();

        if (error) {
          results.errors.push(error.message);
        } else {
          results.inserted = data?.length || 0;
        }
      } else if (action === 'update') {
        // 仅更新（必须存在）
        for (const record of records) {
          const { error } = await client
            .from('words')
            .update({
              phonetic: record.phonetic,
              meaning: record.meaning,
              example_sentence: record.example_sentence,
              example_sentence_cn: record.example_sentence_cn,
              category_id: record.category_id,
            })
            .eq('word', record.word);

          if (error) {
            results.errors.push(`${record.word}: ${error.message}`);
          } else {
            results.updated++;
          }
        }
      } else {
        // upsert 模式（默认）：存在则更新，不存在则插入
        for (const record of records) {
          // 先检查是否存在
          const { data: existing } = await client
            .from('words')
            .select('id')
            .eq('word', record.word)
            .limit(1);

          if (existing && existing.length > 0) {
            // 更新
            const { error } = await client
              .from('words')
              .update({
                phonetic: record.phonetic,
                meaning: record.meaning,
                example_sentence: record.example_sentence,
                example_sentence_cn: record.example_sentence_cn,
              })
              .eq('word', record.word);
            
            if (error) {
              results.errors.push(`${record.word}: ${error.message}`);
            } else {
              results.updated++;
            }
          } else {
            // 插入
            const { error } = await client
              .from('words')
              .insert(record);
            
            if (error) {
              results.errors.push(`${record.word}: ${error.message}`);
            } else {
              results.inserted++;
            }
          }
        }
      }
    }

    // 3. 获取最终统计
    const { count: finalCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      action,
      results,
      totalWords: finalCount,
    });

  } catch (error) {
    console.error('更新失败:', error);
    return NextResponse.json({ error: '更新失败', details: String(error) }, { status: 500 });
  }
}

/**
 * 获取单词更新模板和当前统计
 */
export async function GET() {
  const { count: totalWords } = await client
    .from('words')
    .select('*', { count: 'exact', head: true });

  const { data: categories } = await client
    .from('vocabulary_categories')
    .select('id, name')
    .order('id');

  return NextResponse.json({
    totalWords,
    categories,
    template: {
      words: [
        {
          word: "example",
          phonetic: "/ɪɡˈzæmpəl/",
          meaning: "n. 例子；榜样",
          example_sentence: "This is an example.",
          example_sentence_cn: "这是一个例子。",
          category: "托福词汇"
        }
      ],
      action: "upsert"
    },
    actions: {
      upsert: "存在则更新，不存在则插入（默认）",
      insert: "仅插入，已存在则跳过",
      update: "仅更新，不存在则跳过",
      delete: "按单词文本删除"
    }
  });
}
