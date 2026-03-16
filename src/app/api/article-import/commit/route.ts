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

// 常量限制
const MAX_CONTENT_LENGTH = 20000; // 最大文章长度
const MAX_SELECTED_WORDS = 200;   // 最大选择单词数

interface SelectedWord {
  text: string;          // 原词形式
  lemma: string;         // 词根
  context: string;       // 上下文句子
  tokenIndex: number;    // token 索引
  setPrimary?: boolean;  // 是否设为主例句
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

    // 参数校验
    if (!content || !selectedWords || selectedWords.length === 0) {
      return NextResponse.json({ error: 'Content and selectedWords are required' }, { status: 400 });
    }

    // 长度限制
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ 
        error: `Content too long. Maximum ${MAX_CONTENT_LENGTH} characters allowed.` 
      }, { status: 413 });
    }

    if (selectedWords.length > MAX_SELECTED_WORDS) {
      return NextResponse.json({ 
        error: `Too many words selected. Maximum ${MAX_SELECTED_WORDS} words allowed.` 
      }, { status: 413 });
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
      const { text, lemma, context, setPrimary } = selected;
      
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
      const { data: existingContexts } = await client
        .from('user_word_contexts')
        .select('id, is_primary, context_text')
        .eq('user_id', userId)
        .eq('word_id', wordId);

      const hasExistingPrimary = existingContexts?.some(c => c.is_primary);

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
          is_primary: false, // 先插入为 false
        });

      // 处理主例句逻辑
      if (setPrimary !== false) {
        // 默认行为或 setPrimary=true: 将新例句设为主例句
        if (hasExistingPrimary) {
          // 先将所有其他例句的 is_primary 设为 false
          await client
            .from('user_word_contexts')
            .update({ is_primary: false })
            .eq('user_id', userId)
            .eq('word_id', wordId);
        }
        
        // 将最新插入的例句设为主例句
        const { data: latestContext } = await client
          .from('user_word_contexts')
          .select('id')
          .eq('user_id', userId)
          .eq('word_id', wordId)
          .eq('context_text', context)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestContext) {
          await client
            .from('user_word_contexts')
            .update({ is_primary: true })
            .eq('id', latestContext.id);
        }
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
