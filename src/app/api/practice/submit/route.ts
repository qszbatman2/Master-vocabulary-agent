import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    const body = await request.json();
    const { wordId, isCorrect, markAsMastered } = body;

    if (!wordId) {
      return NextResponse.json({ error: '缺少单词ID' }, { status: 400 });
    }

    // 获取当前单词的文本，用于同步所有分类中的同一单词
    const { data: currentWord } = await client
      .from('words')
      .select('word')
      .eq('id', wordId)
      .single();

    // 获取该单词在所有分类中的 ID 列表
    let allWordIds = [wordId];
    if (currentWord?.word) {
      const { data: sameWords } = await client
        .from('words')
        .select('id')
        .eq('word', currentWord.word);
      allWordIds = sameWords?.map(w => w.id) || [wordId];
    }

    const now = new Date().toISOString();

    // 获取用户对这些单词的当前状态
    const { data: existingStatuses } = await client
      .from('user_word_status')
      .select('*')
      .eq('user_id', userId)
      .in('word_id', allWordIds);

    const existingStatusMap = new Map(existingStatuses?.map(s => [s.word_id, s]) || []);

    // 计算新的统计数据（基于当前提交的 wordId）
    const existingStatus = existingStatusMap.get(wordId);
    let newTotalCount = 1;
    let newCorrectCount = isCorrect ? 1 : 0;
    let newWrongCount = isCorrect ? 0 : 1;
    let newConsecutiveCorrect = isCorrect ? 1 : 0;

    if (existingStatus) {
      newTotalCount = existingStatus.total_practice_count + 1;
      newCorrectCount = isCorrect ? existingStatus.correct_count + 1 : existingStatus.correct_count;
      newWrongCount = !isCorrect ? (existingStatus.wrong_count || 0) + 1 : existingStatus.wrong_count || 0;
      newConsecutiveCorrect = isCorrect ? existingStatus.consecutive_correct + 1 : 0;
    }

    // 判断是否应该自动标记为已掌握
    const shouldAutoMaster = newTotalCount >= 4 && newConsecutiveCorrect >= 4;
    const isMastered = markAsMastered || shouldAutoMaster;

    // 更新或创建当前单词的状态
    if (existingStatus) {
      await client
        .from('user_word_status')
        .update({
          is_mastered: isMastered,
          total_practice_count: newTotalCount,
          correct_count: newCorrectCount,
          wrong_count: newWrongCount,
          consecutive_correct: newConsecutiveCorrect,
          last_practiced_at: now,
          last_wrong_at: !isCorrect ? now : existingStatus.last_wrong_at,
          updated_at: now,
        })
        .eq('id', existingStatus.id);
    } else {
      await client
        .from('user_word_status')
        .insert({
          user_id: userId,
          word_id: wordId,
          is_mastered: isMastered,
          total_practice_count: 1,
          correct_count: isCorrect ? 1 : 0,
          wrong_count: isCorrect ? 0 : 1,
          consecutive_correct: isCorrect ? 1 : 0,
          last_practiced_at: now,
          last_wrong_at: !isCorrect ? now : null,
        });
    }

    // 如果已掌握，同步更新该单词在所有分类中的状态
    if (isMastered && allWordIds.length > 1) {
      for (const wid of allWordIds) {
        if (wid === wordId) continue; // 已处理
        
        const existingOther = existingStatusMap.get(wid);
        if (existingOther) {
          await client
            .from('user_word_status')
            .update({
              is_mastered: true,
              updated_at: now,
            })
            .eq('id', existingOther.id);
        } else {
          await client
            .from('user_word_status')
            .insert({
              user_id: userId,
              word_id: wid,
              is_mastered: true,
              total_practice_count: 0,
              correct_count: 0,
              wrong_count: 0,
              consecutive_correct: 0,
              last_practiced_at: now,
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      isMastered,
      autoMastered: shouldAutoMaster,
      consecutiveCorrect: newConsecutiveCorrect,
      totalPracticeCount: newTotalCount,
      correctCount: newCorrectCount,
      wrongCount: newWrongCount,
    });
  } catch (error) {
    console.error('Error submitting practice result:', error);
    return NextResponse.json(
      { error: 'Failed to submit practice result' },
      { status: 500 }
    );
  }
}
