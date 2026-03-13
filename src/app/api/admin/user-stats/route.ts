import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 管理员授权码
const ADMIN_TOKEN = 'vocabulary-admin-2024';

// 获取上海时区的日期字符串
function getShanghaiDateString(date: Date): string {
  const shanghaiTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return shanghaiTime.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = request.nextUrl.searchParams.get('email');
    const word = request.nextUrl.searchParams.get('word');
    const fix = request.nextUrl.searchParams.get('fix'); // 是否修复数据

    if (!email) {
      return NextResponse.json({ error: '缺少email参数' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 查找用户
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, email, nickname')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: '用户不存在', details: userError?.message }, { status: 404 });
    }

    // 如果指定了单词，查询单词详情
    let wordInfo = null;
    let wordIds: number[] = [];
    
    if (word) {
      const { data: words } = await client
        .from('words')
        .select('id, word, meaning, phonetic, category_id')
        .eq('word', word);
      
      if (words && words.length > 0) {
        wordInfo = words;
        wordIds = words.map(w => w.id);
      }
    }

    // 查询用户学习记录
    let statusQuery = client
      .from('user_word_status')
      .select(`
        id,
        word_id,
        is_mastered,
        total_practice_count,
        correct_count,
        wrong_count,
        consecutive_correct,
        daily_correct_count,
        last_correct_date,
        round_consecutive_correct,
        last_practiced_at,
        last_wrong_at,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id);

    if (wordIds.length > 0) {
      statusQuery = statusQuery.in('word_id', wordIds);
    }

    const { data: statuses, error: statusError } = await statusQuery.order('last_practiced_at', { ascending: false });

    if (statusError) {
      return NextResponse.json({ error: '查询学习记录失败', details: statusError.message }, { status: 500 });
    }

    // 如果指定了单词，返回详细分析
    if (word && wordIds.length > 0) {
      const wordStatuses = statuses || [];
      
      // 获取单词分类名称
      const { data: categories } = await client
        .from('vocabulary_categories')
        .select('id, name');
      
      const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

      const detailedStatus = wordStatuses.map(s => {
        const wordData = wordInfo?.find(w => w.id === s.word_id);
        return {
          ...s,
          word: wordData?.word,
          meaning: wordData?.meaning,
          phonetic: wordData?.phonetic,
          category_id: wordData?.category_id,
          category_name: wordData?.category_id ? categoryMap.get(wordData.category_id) : null,
        };
      });

      // 分析是否应该已掌握
      let masteryAnalysis = null;
      if (detailedStatus.length > 0) {
        const status = detailedStatus[0];
        
        // 计算实际有效答对天数
        // 基于：created_at 是首次学习时间，last_practiced_at 是最后学习时间
        // 如果 correct_count >= 1，说明至少有1次有效答对
        // 我们需要估算实际应该有多少天有效答对
        
        const createdAt = new Date(status.created_at);
        const lastPracticedAt = new Date(status.last_practiced_at);
        const daysDiff = Math.floor((lastPracticedAt.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
        
        // 假设：如果跨天学习且全部答对，应该有 min(daysDiff + 1, correct_count) 天有效答对
        const estimatedDailyCorrect = Math.min(daysDiff + 1, status.correct_count);
        
        masteryAnalysis = {
          current_mastered: status.is_mastered,
          daily_correct_count: status.daily_correct_count,
          estimated_correct_days: estimatedDailyCorrect,
          days_between_first_and_last: daysDiff,
          last_correct_date: status.last_correct_date,
          total_correct: status.correct_count,
          total_wrong: status.wrong_count,
          should_be_mastered: estimatedDailyCorrect >= 4,
          reason: estimatedDailyCorrect >= 4 
            ? `估算应有 ${estimatedDailyCorrect} 天有效答对（跨 ${daysDiff} 天），达到4天标准` 
            : `估算应有 ${estimatedDailyCorrect} 天有效答对（跨 ${daysDiff} 天），需要4天`,
          bug_explanation: daysDiff > 0 && status.daily_correct_count === 1 
            ? `检测到BUG：跨 ${daysDiff} 天学习但 daily_correct_count 只有 1，可能是时区问题导致` 
            : null,
        };
        
        // 如果请求修复
        if (fix === 'true' && estimatedDailyCorrect !== status.daily_correct_count) {
          const newDailyCorrectCount = Math.min(estimatedDailyCorrect, 4); // 最多4天就掌握
          const newIsMastered = newDailyCorrectCount >= 4;
          
          const { error: updateError } = await client
            .from('user_word_status')
            .update({
              daily_correct_count: newDailyCorrectCount,
              is_mastered: newIsMastered,
              updated_at: new Date().toISOString(),
            })
            .eq('id', status.id);
          
          if (updateError) {
            masteryAnalysis.fix_result = { success: false, error: updateError.message };
          } else {
            masteryAnalysis.fix_result = { 
              success: true, 
              old_daily_correct_count: status.daily_correct_count,
              new_daily_correct_count: newDailyCorrectCount,
              new_is_mastered: newIsMastered,
            };
          }
        }
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
        },
        word_info: wordInfo,
        learning_records: detailedStatus,
        mastery_analysis: masteryAnalysis,
      });
    }

    // 返回用户概览
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      word_filter: word,
      total_records: statuses?.length || 0,
      mastered_count: statuses?.filter(s => s.is_mastered)?.length || 0,
      records: statuses?.slice(0, 50), // 最多返回50条
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '服务器错误', details: String(error) }, { status: 500 });
  }
}
