import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CORS 配置
const ALLOWED_ORIGINS = [
  // Chrome 插件 origin（发布后固定 extension id）
  // 'chrome-extension://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 开发环境
  'http://localhost:3000',
  'http://localhost:5000',
  // 主站域名
  'https://8qcfzhhw7t.coze.site',
];

// 允许所有 chrome-extension origin（开发阶段）
// 生产环境建议固定 extension id 后改为白名单
const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.startsWith('chrome-extension://')) return true;
  return false;
};

export function middleware(request: NextRequest) {
  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    
    const response = new NextResponse(null, { status: 200 });
    
    if (isAllowedOrigin(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
  }

  // 处理实际请求
  const response = NextResponse.next();
  const origin = request.headers.get('origin');

  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  }

  return response;
}

// 配置哪些路径需要 CORS
export const config = {
  matcher: [
    '/api/:path*',
  ],
};
