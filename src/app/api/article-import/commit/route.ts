import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { lemmatizeLocal } from '@/lib/lemma-utils';

// 解析 token 获取用户 ID
function getUserIdFromToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = parseInt(decoded.split(':')[0]);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

interface SelectedWord {
  text: string;          // 原词形式
  lemma: string;         // 词根
  context: string;       // 上下文句子
  tokenIndex: number;    // token 索引
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = token ? getUserIdFromToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, selectedWords } = body as {
      title?: string;
      content: string;
      selectedWords: SelectedWord[];
    };

    if (!content || !selectedWords || selectedWords.length === 0) {
      return NextResponse.json({ error: 'Content and selectedWords are required' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 1. 创建用户来源文章记录
    const { data: sourceData, error: sourceError } = await client
      .from('user_text_sources')
      .insert({
        user_id: userId,
        title: title || 'Untitled',
        content,
      })
      .select('id')
      .single();

    if (sourceError || !sourceData) {
      console.error('Failed to create source:', sourceError);
      return NextResponse.json({ error: 'Failed to save article' }, { status: 500 });
    }

    const sourceId = sourceData.id;

    // 2. 处理每个选中的词
    const results: Array<{
      word: string;
      lemma: string;
      status: 'created' | 'linked' | 'exists';
      wordId: number;
    }> = [];

    for (const selected of selectedWords) {
      const { text, lemma, context } = selected;
      
      // 再次词形还原（防止前端传来的数据不准确）
      const finalLemma = lemmatizeLocal(lemma || text);

      // 2.1 查找词库中是否已有该词
      let wordId: number | null = null;
      
      // 先精确匹配
      const { data: exactMatch } = await client
        .from('words')
        .select('id')
        .eq('word', finalLemma)
        .limit(1)
        .single();

      if (exactMatch) {
        wordId = exactMatch.id;
      } else {
        // 词库中没有，创建新词
        const { data: newWord, error: createError } = await client
          .from('words')
          .insert({
            word: finalLemma,
            meaning: '待补充释义',  // 占位，用户后续可编辑
            category_id: null,      // 未分类
          })
          .select('id')
          .single();

        if (createError || !newWord) {
          console.error('Failed to create word:', createError);
          continue;
        }
        
        wordId = newWord.id;
        results.push({ word: text, lemma: finalLemma, status: 'created', wordId: wordId! });
      }

      if (!wordId) continue;

      // 2.2 检查用户是否已有该词的状态记录
      const { data: existingStatus } = await client
        .from('user_word_status')
        .select('id')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .single();

      if (!existingStatus) {
        // 创建用户状态记录（初始状态：未掌握）
        await client
          .from('user_word_status')
          .insert({
            user_id: userId,
            word_id: wordId,
            is_mastered: false,
            correct_count: 0,
            wrong_count: 0,
            mastery_days: 0,
          });
        
        if (!results.find(r => r.wordId === wordId)) {
          results.push({ word: text, lemma: finalLemma, status: 'linked', wordId });
        }
      } else {
        if (!results.find(r => r.wordId === wordId)) {
          results.push({ word: text, lemma: finalLemma, status: 'exists', wordId });
        }
      }

      // 2.3 创建上下文例句记录
      // 检查是否已有该词的上下文记录
      const { data: existingContext } = await client
        .from('user_word_contexts')
        .select('id, is_primary')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .limit(1)
        .single();

      const isPrimary = !existingContext;  // 第一个设为主例句

      // 插入新的上下文记录
      await client
        .from('user_word_contexts')
        .insert({
          user_id: userId,
          word_id: wordId,
          source_id: sourceId,
          surface_form: text,
          lemma: finalLemma,
          context_text: context,
          is_primary: isPrimary,
        });

      // 如果已有记录但没有主例句，更新为 true
      if (existingContext && !existingContext.is_primary) {
        await client
          .from('user_word_contexts')
          .update({ is_primary: true })
          .eq('id', existingContext.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功添加 ${results.length} 个单词`,
      sourceId,
      results,
    });

  } catch (error) {
    console.error('Article commit error:', error);
    return NextResponse.json(
      { error: 'Failed to save words' },
      { status: 500 }
    );
  }
}
