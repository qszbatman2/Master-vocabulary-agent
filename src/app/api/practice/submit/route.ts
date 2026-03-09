import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

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

    // 获取用户对该单词的当前状态
    const { data: existingStatus } = await client
      .from('user_word_status')
      .select('*')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .maybeSingle(); // 使用 maybeSingle 避免 multiple rows 错误

    const now = new Date().toISOString();

    if (existingStatus) {
      // 更新现有状态
      const newTotalCount = existingStatus.total_practice_count + 1;
      const newCorrectCount = isCorrect 
        ? existingStatus.correct_count + 1 
        : existingStatus.correct_count;
      const newConsecutiveCorrect = isCorrect 
        ? existingStatus.consecutive_correct + 1 
        : 0;
      
      // 判断是否应该自动标记为已掌握
      // 条件：总共练习至少4次，且连续4次正确
      const shouldAutoMaster = !existingStatus.is_mastered && 
        newTotalCount >= 4 && 
        newConsecutiveCorrect >= 4;

      const isMastered = markAsMastered || existingStatus.is_mastered || shouldAutoMaster;

      const { error } = await client
        .from('user_word_status')
        .update({
          is_mastered: isMastered,
          total_practice_count: newTotalCount,
          correct_count: newCorrectCount,
          consecutive_correct: newConsecutiveCorrect,
          last_practiced_at: now,
          updated_at: now,
        })
        .eq('id', existingStatus.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        isMastered,
        autoMastered: shouldAutoMaster,
        consecutiveCorrect: newConsecutiveCorrect,
        totalPracticeCount: newTotalCount,
      });
    } else {
      // 创建新状态
      const isMastered = markAsMastered || false;

      const { error } = await client
        .from('user_word_status')
        .insert({
          user_id: userId,
          word_id: wordId,
          is_mastered: isMastered,
          total_practice_count: 1,
          correct_count: isCorrect ? 1 : 0,
          consecutive_correct: isCorrect ? 1 : 0,
          last_practiced_at: now,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        isMastered,
        consecutiveCorrect: isCorrect ? 1 : 0,
        totalPracticeCount: 1,
      });
    }
  } catch (error) {
    console.error('Error submitting practice result:', error);
    return NextResponse.json(
      { error: 'Failed to submit practice result' },
      { status: 500 }
    );
  }
}
