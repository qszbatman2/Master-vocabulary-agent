import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 简单的密码哈希函数（生产环境应使用 bcrypt）
function hashPassword(password: string): string {
  // 简单哈希 - 实际应用请使用 bcrypt
  return Buffer.from(password).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { email, password, nickname } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6位' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 创建用户
    const hashedPassword = hashPassword(password);
    const { data: user, error } = await client
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        nickname: nickname || email.split('@')[0],
      })
      .select('id, email, nickname, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: '注册失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 生成简单的 token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      message: '注册成功',
      user,
      token,
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
