import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

// Webhook 密钥（从环境变量读取）
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'coze-webhook-2024';

// 验证 GitHub Webhook 签名
function verifySignature(payload: string, signature: string): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return signature.slice(7) === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const payload = await request.text();
    
    // 验证签名
    const signature = request.headers.get('x-hub-signature-256') || '';
    if (!verifySignature(payload, signature)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // 解析事件类型
    const eventType = request.headers.get('x-github-event') || '';
    const data = JSON.parse(payload);
    
    console.log(`Received GitHub webhook: ${eventType}`);
    
    // 只处理 push 事件
    if (eventType !== 'push') {
      return NextResponse.json({ message: `Ignored event: ${eventType}` });
    }
    
    // 检查分支
    const ref = data.ref || '';
    if (!ref.endsWith('/main') && !ref.endsWith('/master')) {
      return NextResponse.json({ message: `Ignored branch: ${ref}` });
    }
    
    console.log('Pulling latest changes from GitHub...');
    
    // 执行 git pull
    const { stdout, stderr } = await execAsync('git pull origin main', {
      cwd: process.env.COZE_WORKSPACE_PATH || '/workspace/projects',
      timeout: 60000,
    });
    
    console.log('Git pull output:', stdout);
    if (stderr) {
      console.error('Git pull stderr:', stderr);
    }
    
    // 获取提交信息
    const commits = data.commits || [];
    const commitInfo = commits.map((c: { message: string; author: { name: string } }) => ({
      message: c.message,
      author: c.author?.name,
    }));
    
    return NextResponse.json({
      success: true,
      message: 'Successfully pulled latest changes',
      pulled: stdout.includes('Updating') || stdout.includes('Already up to date'),
      commits: commitInfo,
      output: stdout.slice(-500),
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

// GET 方法用于健康检查
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'GitHub Webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  });
}
