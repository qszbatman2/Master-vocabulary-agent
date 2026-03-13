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

// 获取今天的日期字符串 (YYYY-MM-DD) - 使用上海时区
function getTodayDateString(): string {
  const now = new Date();
  // 使用上海时区 (UTC+8)
  const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return shanghaiTime.toISOString().split('T')[0];
}

// 检查日期是否是今天 - 使用上海时区
function isToday(dateString: string | null): boolean {
  if (!dateString) return false;
  return dateString === getTodayDateString();
}

// 检查日期是否是昨天 - 用于修复历史数据
function isYesterday(dateString: string | null): boolean {
  if (!dateString) return false;
  const yesterday = new Date();
  yesterday.setTime(yesterday.getTime() + 8 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return dateString === yesterday.toISOString().split('T')[0];
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
    const { wordId, isCorrect, markAsMastered, isRoundWrongWord } = body;

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
    const today = getTodayDateString();

    // 获取用户对这些单词的当前状态
    const { data: existingStatuses } = await client
      .from('user_word_status')
      .select('*')
      .eq('user_id', userId)
      .in('word_id', allWordIds);

    const existingStatusMap = new Map(existingStatuses?.map(s => [s.word_id, s]) || []);

    // 计算新的统计数据（基于当前提交的 wordId）
    const existingStatus = existingStatusMap.get(wordId);
    
    // 基础统计
    let newTotalCount = 1;
    let newCorrectCount = isCorrect ? 1 : 0;
    let newWrongCount = isCorrect ? 0 : 1;
    let newConsecutiveCorrect = isCorrect ? 1 : 0;
    
    // 掌握相关统计
    let newDailyCorrectCount = 0;
    let newLastCorrectDate: string | null = null;
    let newRoundConsecutiveCorrect = 0; // 本轮连续答对次数（用于错题3次判定）
    let newIsMastered = false;

    if (existingStatus) {
      newTotalCount = existingStatus.total_practice_count + 1;
      newCorrectCount = isCorrect ? existingStatus.correct_count + 1 : existingStatus.correct_count;
      newWrongCount = !isCorrect ? (existingStatus.wrong_count || 0) + 1 : existingStatus.wrong_count || 0;
      newConsecutiveCorrect = isCorrect ? existingStatus.consecutive_correct + 1 : 0;
      
      // 保留之前的掌握状态数据
      newDailyCorrectCount = existingStatus.daily_correct_count || 0;
      newLastCorrectDate = existingStatus.last_correct_date || null;
      newRoundConsecutiveCorrect = existingStatus.round_consecutive_correct || 0;
      newIsMastered = existingStatus.is_mastered || false;
    }

    // 核心逻辑：处理有效答对
    let validCorrectRecorded = false;
    
    if (isCorrect) {
      // 答对的情况
      if (isRoundWrongWord) {
        // 这是本轮错题，需要连续对3次才算一次有效答对
        newRoundConsecutiveCorrect += 1;
        
        if (newRoundConsecutiveCorrect >= 3) {
          // 连续对3次，可以记录一次有效答对
          newRoundConsecutiveCorrect = 0; // 重置本轮连续计数
          
          // 检查今天是否已经记录过
          if (!isToday(newLastCorrectDate)) {
            newDailyCorrectCount += 1;
            newLastCorrectDate = today;
            validCorrectRecorded = true;
          }
        }
      } else {
        // 不是本轮错题，直接记录有效答对
        // 检查今天是否已经记录过
        if (!isToday(newLastCorrectDate)) {
          newDailyCorrectCount += 1;
          newLastCorrectDate = today;
          validCorrectRecorded = true;
        }
        newRoundConsecutiveCorrect = 0;
      }
      
      // 检查是否达到掌握条件（4天有效答对）
      if (newDailyCorrectCount >= 4) {
        newIsMastered = true;
      }
    } else {
      // 答错的情况：重置本轮连续计数
      newRoundConsecutiveCorrect = 0;
    }

    // 手动标记掌握
    if (markAsMastered) {
      newIsMastered = true;
    }

    // 更新或创建当前单词的状态
    if (existingStatus) {
      await client
        .from('user_word_status')
        .update({
          is_mastered: newIsMastered,
          total_practice_count: newTotalCount,
          correct_count: newCorrectCount,
          wrong_count: newWrongCount,
          consecutive_correct: newConsecutiveCorrect,
          daily_correct_count: newDailyCorrectCount,
          last_correct_date: newLastCorrectDate,
          round_consecutive_correct: newRoundConsecutiveCorrect,
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
          is_mastered: newIsMastered,
          total_practice_count: 1,
          correct_count: isCorrect ? 1 : 0,
          wrong_count: isCorrect ? 0 : 1,
          consecutive_correct: newConsecutiveCorrect,
          daily_correct_count: newDailyCorrectCount,
          last_correct_date: newLastCorrectDate,
          round_consecutive_correct: newRoundConsecutiveCorrect,
          last_practiced_at: now,
          last_wrong_at: !isCorrect ? now : null,
        });
    }

    // 如果已掌握，同步更新该单词在所有分类中的状态
    if (newIsMastered && allWordIds.length > 1) {
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
              daily_correct_count: 0,
              last_practiced_at: now,
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      isMastered: newIsMastered,
      dailyCorrectCount: newDailyCorrectCount,
      validCorrectRecorded,
      consecutiveCorrect: newConsecutiveCorrect,
      totalPracticeCount: newTotalCount,
      correctCount: newCorrectCount,
      wrongCount: newWrongCount,
      roundConsecutiveCorrect: newRoundConsecutiveCorrect,
    });
  } catch (error) {
    console.error('Error submitting practice result:', error);
    return NextResponse.json(
      { error: 'Failed to submit practice result' },
      { status: 500 }
    );
  }
}
