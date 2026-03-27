import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { MAX_DAILY_SECONDS, sanitizeDurationSeconds } from '@/lib/duration';

const ADMIN_TOKEN = process.env.ADMIN_KEY || 'vocabulary-admin-2024';

function getTodayDateString(): string {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return shanghaiTime.toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const date: string = typeof body?.date === 'string' && body.date ? body.date : getTodayDateString();
    const userId: number | null =
      typeof body?.userId === 'number' && Number.isFinite(body.userId) ? Math.floor(body.userId) : null;
    const maxDailySeconds = sanitizeDurationSeconds(body?.maxDailySeconds ?? MAX_DAILY_SECONDS, 24 * 60 * 60);
    const dryRun = Boolean(body?.dryRun);

    const client = getSupabaseClient();

    let query = client
      .from('daily_practice_stats')
      .select('id', { count: 'exact', head: true })
      .eq('date', date)
      .gt('duration_seconds', maxDailySeconds);

    if (userId !== null && userId > 0) {
      query = query.eq('user_id', userId);
    }

    const { count, error: countError } = await query;
    if (countError) {
      return NextResponse.json({ error: '查询失败', details: countError.message }, { status: 500 });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        date,
        userId,
        maxDailySeconds,
        affectedCount: count || 0,
      });
    }

    let updateQuery = client
      .from('daily_practice_stats')
      .update({ duration_seconds: maxDailySeconds })
      .eq('date', date)
      .gt('duration_seconds', maxDailySeconds);

    if (userId !== null && userId > 0) {
      updateQuery = updateQuery.eq('user_id', userId);
    }

    const { error: updateError } = await updateQuery;
    if (updateError) {
      return NextResponse.json({ error: '更新失败', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      date,
      userId,
      maxDailySeconds,
      affectedCount: count || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
