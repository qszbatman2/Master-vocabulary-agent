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

// 检查日期是否是今天
function isToday(dateString: string | null): boolean {
  if (!dateString) return false;
  const today = getTodayDateString();
  return dateString === today;
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
    const { wordId, isCorrect, markAsMastered, isRoundWrongWord, isReview } = body;

    if (!wordId) {
      return NextResponse.json({ error: '缺少单词ID' }, { status: 400 });
    }

    // 获取当前单词的文本
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
    const existingStatus = existingStatusMap.get(wordId);

    // ========== 核心逻辑修复 ==========
    
    // 基础统计初始化
    let newTotalCount = 1;
    let newCorrectCount = isCorrect ? 1 : 0;
    let newWrongCount = isCorrect ? 0 : 1;
    let newConsecutiveCorrect = isCorrect ? 1 : 0;
    
    // 掌握相关统计初始化
    let newDailyCorrectCount = 0;
    let newLastCorrectDate: string | null = null;
    let newRoundConsecutiveCorrect = 0;
    let newIsMastered = false;

    if (existingStatus) {
      newTotalCount = existingStatus.total_practice_count + 1;
      newCorrectCount = isCorrect ? existingStatus.correct_count + 1 : existingStatus.correct_count;
      newWrongCount = !isCorrect ? (existingStatus.wrong_count || 0) + 1 : existingStatus.wrong_count || 0;
      newConsecutiveCorrect = isCorrect ? existingStatus.consecutive_correct + 1 : 0;
      
      // 保留之前的数据
      newDailyCorrectCount = existingStatus.daily_correct_count || 0;
      newLastCorrectDate = existingStatus.last_correct_date || null;
      newRoundConsecutiveCorrect = existingStatus.round_consecutive_correct || 0;
      newIsMastered = existingStatus.is_mastered || false;
    }

    // 核心逻辑：处理有效答对
    let validCorrectRecorded = false;
    const debugInfo: any = {
      today,
      lastCorrectDate: newLastCorrectDate,
      isTodayCheck: isToday(newLastCorrectDate),
    };
    
    if (isCorrect) {
      if (isRoundWrongWord) {
        // 本轮错题需要连续对3次才算一次有效答对
        newRoundConsecutiveCorrect += 1;
        
        if (newRoundConsecutiveCorrect >= 3) {
          newRoundConsecutiveCorrect = 0;
          
          if (!isToday(newLastCorrectDate)) {
            newDailyCorrectCount += 1;
            newLastCorrectDate = today;
            validCorrectRecorded = true;
          }
        }
      } else {
        // 普通答对：检查今天是否已经记录过有效答对
        if (!isToday(newLastCorrectDate)) {
          newDailyCorrectCount += 1;
          newLastCorrectDate = today;
          validCorrectRecorded = true;
        }
        newRoundConsecutiveCorrect = 0;
      }
      
      // 检查是否达到掌握条件
      if (newDailyCorrectCount >= 4) {
        newIsMastered = true;
      }
    } else {
      // 答错：重置所有正确计数，需要重新累计4天
      newRoundConsecutiveCorrect = 0;
      newDailyCorrectCount = 0;
      newLastCorrectDate = null;
      
      // 复习词答错：重置为未掌握状态
      if (isReview) {
        newIsMastered = false;
        debugInfo.reviewWordReset = true;
      }
    }

    // 手动标记掌握
    if (markAsMastered) {
      newIsMastered = true;
    }

    debugInfo.newDailyCorrectCount = newDailyCorrectCount;
    debugInfo.validCorrectRecorded = validCorrectRecorded;

    // 更新或创建状态
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

    // 同步更新同一单词在其他分类中的掌握状态
    if (newIsMastered && allWordIds.length > 1) {
      for (const wid of allWordIds) {
        if (wid === wordId) continue;
        
        const existingOther = existingStatusMap.get(wid);
        if (existingOther) {
          await client
            .from('user_word_status')
            .update({
              is_mastered: true,
              updated_at: now,
            })
            .eq('id', existingOther.id);
        }
      }
    }

    // ========== 更新每日练习统计 ==========
    
    // 获取或创建今日统计记录
    let { data: todayStats } = await client
      .from('daily_practice_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (!todayStats) {
      const { data: newStats } = await client
        .from('daily_practice_stats')
        .insert({
          user_id: userId,
          date: today,
          total_practiced: 0,
          correct_count: 0,
          wrong_count: 0,
          mastered_count: 0,
          wrong_word_ids: '',
          duration_seconds: 0,
          is_settled: false,
        })
        .select()
        .single();
      todayStats = newStats;
    }

    // 更新每日统计
    const dailyUpdateData: Record<string, unknown> = { updated_at: now };
    dailyUpdateData.total_practiced = (todayStats?.total_practiced || 0) + 1;

    // 如果是首次答错，加入错词列表
    if (!isCorrect) {
      const currentWrongIds = todayStats?.wrong_word_ids
        ? todayStats.wrong_word_ids.split(',').filter((id: string) => id)
        : [];
      if (!currentWrongIds.includes(String(wordId))) {
        currentWrongIds.push(String(wordId));
        dailyUpdateData.wrong_word_ids = currentWrongIds.join(',');
        dailyUpdateData.wrong_count = (todayStats?.wrong_count || 0) + 1;
      }
    } else {
      dailyUpdateData.correct_count = (todayStats?.correct_count || 0) + 1;
    }

    // 如果掌握，更新掌握数
    if (newIsMastered && !existingStatus?.is_mastered) {
      dailyUpdateData.mastered_count = (todayStats?.mastered_count || 0) + 1;
    }

    await client
      .from('daily_practice_stats')
      .update(dailyUpdateData)
      .eq('id', todayStats?.id);

    // 返回结果
    const responseData: any = {
      success: true,
      isMastered: newIsMastered,
      dailyCorrectCount: newDailyCorrectCount,
      validCorrectRecorded,
      debug: debugInfo,  // 添加调试信息
    };

    if (newDailyCorrectCount === 4 && validCorrectRecorded) {
      responseData.mastered = true;
      responseData.message = '连续4天答对，已掌握！';
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
