import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getShanghaiDateFromTimestamp, getShanghaiDateString } from '@/lib/shanghai-date';
import { normalizeSpelling } from '@/lib/near-form';

function getUserIdFromToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = parseInt(decoded.split(':')[0]);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

function clampDays(days: number): number {
  if (Number.isNaN(days)) return 90;
  return Math.max(7, Math.min(365, days));
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const days = clampDays(parseInt(searchParams.get('days') || '90'));
    const today = getShanghaiDateString(new Date());

    const [
      { count: totalWords },
      { data: user, error: userError },
      { data: statuses, error: statusesError },
      { data: history, error: historyError },
      { data: weakStatus, error: weakError },
      { data: categories, error: categoriesError },
      { data: words, error: wordsError },
    ] = await Promise.all([
      client.from('words').select('*', { count: 'exact', head: true }),
      client.from('users').select('daily_goal').eq('id', userId).single(),
      client
        .from('user_word_status')
        .select('word_id,is_mastered,wrong_count,daily_correct_count,last_practiced_at,last_correct_date,last_wrong_at')
        .eq('user_id', userId),
      client
        .from('daily_practice_stats')
        .select('date,total_practiced,correct_count,wrong_count,mastered_count,duration_seconds,is_settled,wrong_word_ids')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(days),
      client
        .from('user_word_status')
        .select('word_id,wrong_count,correct_count,last_wrong_at')
        .eq('user_id', userId)
        .gt('wrong_count', 0)
        .order('wrong_count', { ascending: false })
        .limit(30),
      client.from('vocabulary_categories').select('id,name'),
      client.from('words').select('id,word,meaning,phonetic,category_id'),
    ]);

    if (userError) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    if (statusesError) {
      return NextResponse.json({ error: statusesError.message }, { status: 500 });
    }
    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }
    if (weakError) {
      return NextResponse.json({ error: weakError.message }, { status: 500 });
    }
    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 });
    }
    if (wordsError) {
      return NextResponse.json({ error: wordsError.message }, { status: 500 });
    }

    const statusList = statuses || [];

    // Learning-structure metrics should match practice semantics:
    // - de-duplicate by normalized word text (same word may have multiple ids/categories)
    // - "reviewing" should reflect recent wrongness, not lifetime wrong_count
    const wordKeyById = new Map<number, string>();
    const allWordKeys = new Set<string>();
    for (const w of words || []) {
      const raw = typeof w.word === 'string' ? w.word : '';
      const k = normalizeSpelling(raw) || raw.trim().toLowerCase() || `#${w.id}`;
      wordKeyById.set(w.id, k);
      allWordKeys.add(k);
    }

    const sevenDaysAgo = new Date(`${today}T00:00:00+08:00`);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const practicedKeys = new Set<string>();
    const masteredKeys = new Set<string>();
    const correctTodayKeys = new Set<string>();
    const recentWrongKeys = new Set<string>();

    for (const s of statusList) {
      const k = wordKeyById.get(s.word_id) || `#${s.word_id}`;
      practicedKeys.add(k);
      if (s.is_mastered) masteredKeys.add(k);
      if (s.last_correct_date === today) correctTodayKeys.add(k);
      if (s.last_wrong_at && new Date(s.last_wrong_at) >= sevenDaysAgo) recentWrongKeys.add(k);
    }

    const reviewingKeys = new Set<string>();
    for (const k of recentWrongKeys) {
      if (masteredKeys.has(k)) continue;
      if (correctTodayKeys.has(k)) continue;
      reviewingKeys.add(k);
    }

    const totalWordsCount = allWordKeys.size;
    const masteredCount = masteredKeys.size;
    const reviewingCount = reviewingKeys.size;
    const newWordsCount = Math.max(0, totalWordsCount - practicedKeys.size);

    const todayStatus = statusList.filter((s) => getShanghaiDateFromTimestamp(s.last_practiced_at) === today);
    const todayPracticedKeys = new Set(todayStatus.map((s) => wordKeyById.get(s.word_id) || `#${s.word_id}`));
    const todayPracticedCount = todayPracticedKeys.size;
    const todayMasteredKeys = new Set(todayStatus.filter((s) => s.is_mastered).map((s) => wordKeyById.get(s.word_id) || `#${s.word_id}`));
    const todayMasteredCount = todayMasteredKeys.size;
    const todayHistoryRecord = (history || []).find((record) => String(record.date) === today);

    const dailyGoal = user?.daily_goal || 200;
    const todayCompleted = todayHistoryRecord?.correct_count || 0;
    const hasStudyActivity = (todayHistoryRecord?.total_practiced || 0) > 0;
    const dailyProgress = Math.min(100, Math.round((todayCompleted / dailyGoal) * 100));

    const ladderCounts = [0, 0, 0, 0, 0];
    for (const s of statusList) {
      if (s.is_mastered) {
        ladderCounts[4] += 1;
        continue;
      }
      const step = Math.max(0, Math.min(3, s.daily_correct_count || 0));
      ladderCounts[step] += 1;
    }

    const categoryMap = new Map<number, string>((categories || []).map((c) => [c.id, c.name]));
    const wordMap = new Map<number, { word: string; meaning: string | null; phonetic: string | null; categoryId: number | null }>();
    const wordCategoryIdMap = new Map<number, number | null>();

    for (const w of words || []) {
      wordMap.set(w.id, { word: w.word, meaning: w.meaning, phonetic: w.phonetic, categoryId: w.category_id ?? null });
      wordCategoryIdMap.set(w.id, w.category_id ?? null);
    }

    const categoryTotals = new Map<number | null, number>();
    for (const w of words || []) {
      const key = w.category_id ?? null;
      categoryTotals.set(key, (categoryTotals.get(key) || 0) + 1);
    }

    const categoryAgg = new Map<number | null, { practiced: number; mastered: number; wrongSum: number }>();
    for (const s of statusList) {
      const categoryId = wordCategoryIdMap.get(s.word_id) ?? null;
      const prev = categoryAgg.get(categoryId) || { practiced: 0, mastered: 0, wrongSum: 0 };
      prev.practiced += 1;
      if (s.is_mastered) prev.mastered += 1;
      prev.wrongSum += s.wrong_count || 0;
      categoryAgg.set(categoryId, prev);
    }

    const categoryBreakdown = Array.from(categoryTotals.entries())
      .map(([categoryId, total]) => {
        const agg = categoryAgg.get(categoryId) || { practiced: 0, mastered: 0, wrongSum: 0 };
        const name = categoryId === null ? '未分类' : categoryMap.get(categoryId) || `分类 ${categoryId}`;
        const masteredRate = total > 0 ? agg.mastered / total : 0;
        return {
          categoryId,
          name,
          totalWords: total,
          practicedWords: agg.practiced,
          masteredWords: agg.mastered,
          wrongSum: agg.wrongSum,
          masteredRate,
        };
      })
      .sort((a, b) => b.masteredRate - a.masteredRate);
    const hasUncategorizedBucket = categoryTotals.has(null);

    // 计算前12个分类和剩余分类的统计
    const topCategories = categoryBreakdown.slice(0, 12);
    const restCategories = categoryBreakdown.slice(12);
    const restTotal = restCategories.reduce((sum, c) => sum + c.totalWords, 0);
    const restPracticed = restCategories.reduce((sum, c) => sum + c.practicedWords, 0);
    const restMastered = restCategories.reduce((sum, c) => sum + c.masteredWords, 0);
    const restWrongSum = restCategories.reduce((sum, c) => sum + c.wrongSum, 0);

    const weakWords = (weakStatus || []).map((s) => {
      const w = wordMap.get(s.word_id);
      const categoryId = w?.categoryId ?? null;
      return {
        wordId: s.word_id,
        word: w?.word || `#${s.word_id}`,
        meaning: w?.meaning || null,
        phonetic: w?.phonetic || null,
        categoryName: categoryId === null ? '未分类' : categoryMap.get(categoryId) || null,
        wrongCount: s.wrong_count || 0,
        correctCount: s.correct_count || 0,
        lastWrongAt: s.last_wrong_at || null,
      };
    });

    return NextResponse.json({
      today: {
        date: today,
        practicedCount: todayPracticedCount,
        masteredCount: todayMasteredCount,
        effectiveCompletedCount: todayCompleted,
        hasStudyActivity,
      },
      dailyProgress: {
        dailyGoal,
        effectiveCompletedCount: todayCompleted,
        progress: dailyProgress,
        isCompleted: todayCompleted >= dailyGoal,
      },
      total: {
        totalWords: totalWordsCount,
        masteredCount,
        reviewingCount,
        newWordsCount,
      },
      ladder: {
        counts: ladderCounts,
      },
      categories: {
        top: topCategories,
        totalCategories: (categories || []).length + (hasUncategorizedBucket ? 1 : 0),
        rest: {
          totalWords: restTotal,
          practicedWords: restPracticed,
          masteredWords: restMastered,
          wrongSum: restWrongSum,
        },
      },
      weakWords,
      history: (history || []).map((record) => {
        const dateStr = String(record.date);
        return {
          date: dateStr,
          totalPracticed: record.total_practiced || 0,
          effectiveCompletedCount: record.correct_count || 0,
          wrongCount: record.wrong_count || 0,
          masteredCount: record.mastered_count || 0,
          durationMinutes: Math.floor((record.duration_seconds || 0) / 60),
          isSettled: record.is_settled || false,
          hasStudyActivity: (record.total_practiced || 0) > 0,
          wrongWordCount: record.wrong_word_ids ? record.wrong_word_ids.split(',').filter((x: string) => x).length : 0,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching stats dashboard:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
