import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const now = new Date();
  
  return NextResponse.json({
    serverTime: now.toString(),
    isoString: now.toISOString(),
    utcDate: now.toISOString().split('T')[0],
    localDate: now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: now.getTimezoneOffset(),
    env: {
      TZ: process.env.TZ || 'not set',
      NODE_ENV: process.env.NODE_ENV,
    }
  });
}
