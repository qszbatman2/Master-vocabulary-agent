import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

function getUserIdFromToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = parseInt(decoded.split(':')[0]);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

// 支持的模式类型
export const VALID_MODES = ['normal', 'near_form', 'cloze'] as const;
export type PracticeMode = typeof VALID_MODES[number];

// 验证模式数组
function validateModes(modes: any[]): modes is PracticeMode[] {
  if (!Array.isArray(modes) || modes.length === 0) return false;
  return modes.every(m => VALID_MODES.includes(m));
}

// 默认配置
function getDefaultConfig(): PracticeMode[] {
  return ['normal'];
}

// GET - 读取用户配置
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = token ? getUserIdFromToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('user_practice_config')
      .select('enabled_modes')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let modes: PracticeMode[] = getDefaultConfig();

    if (data && data.enabled_modes && validateModes(data.enabled_modes)) {
      modes = data.enabled_modes;
    }

    return NextResponse.json({ enabledModes: modes });
  } catch (error) {
    console.error('Error reading practice config:', error);
    return NextResponse.json(
      { error: 'Failed to read practice config' },
      { status: 500 }
    );
  }
}

// POST - 保存用户配置
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = token ? getUserIdFromToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabledModes } = body;

    // 验证模式数组
    if (!validateModes(enabledModes)) {
      return NextResponse.json(
        { error: 'Invalid modes. Valid modes: normal, near_form, cloze' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查是否已存在配置
    const { data: existing } = await client
      .from('user_practice_config')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // 更新现有配置
      const { data, error } = await client
        .from('user_practice_config')
        .update({
          enabled_modes: enabledModes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select('enabled_modes')
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 创建新配置
      const { data, error } = await client
        .from('user_practice_config')
        .insert({
          user_id: userId,
          enabled_modes: enabledModes,
        })
        .select('enabled_modes')
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ enabledModes: result.enabled_modes });
  } catch (error) {
    console.error('Error saving practice config:', error);
    return NextResponse.json(
      { error: 'Failed to save practice config' },
      { status: 500 }
    );
  }
}
