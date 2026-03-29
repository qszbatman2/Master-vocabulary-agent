import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 管理员密钥（从环境变量读取）
const ADMIN_KEY = process.env.ADMIN_KEY || 'coze-admin-2024';

// 验证管理员密钥
function verifyAdminKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const providedKey = authHeader?.replace('Bearer ', '');
  return providedKey === ADMIN_KEY;
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员密钥
    if (!verifyAdminKey(request)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin key' }, { status: 401 });
    }

    const body = await request.json();
    const { action = 'pull', branch = 'main' } = body;

    if (action === 'pull') {
      console.log(`[Deploy] Pulling latest changes from ${branch}...`);

      const workspacePath = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';

      // 执行 git pull --rebase
      const { stdout, stderr } = await execAsync(`git pull --rebase origin ${branch}`, {
        cwd: workspacePath,
        timeout: 60000,
      });

      console.log('[Deploy] Git pull output:', stdout);
      if (stderr) {
        console.error('[Deploy] Git pull stderr:', stderr);
      }

      // 获取当前提交信息
      const { stdout: logStdout } = await execAsync('git log --oneline -3', {
        cwd: workspacePath,
        timeout: 10000,
      });

      const commits = logStdout.trim().split('\n').filter(Boolean);

      return NextResponse.json({
        success: true,
        message: 'Successfully pulled latest changes',
        action: 'pull',
        branch,
        output: stdout.slice(-500),
        stderr: stderr.slice(-500),
        recentCommits: commits,
      });
    }

    if (action === 'status') {
      const workspacePath = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';

      // 获取当前分支和提交信息
      const { stdout: branchStdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: workspacePath,
        timeout: 10000,
      });

      const { stdout: logStdout } = await execAsync('git log --oneline -5', {
        cwd: workspacePath,
        timeout: 10000,
      });

      const { stdout: statusStdout } = await execAsync('git status --short', {
        cwd: workspacePath,
        timeout: 10000,
      });

      return NextResponse.json({
        success: true,
        action: 'status',
        branch: branchStdout.trim(),
        recentCommits: logStdout.trim().split('\n').filter(Boolean),
        workingTreeClean: !statusStdout.trim(),
        statusOutput: statusStdout.trim() || 'Working tree clean',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Deploy] Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
    }, { status: 500 });
  }
}

// GET 方法用于健康检查和状态查询（需要认证）
export async function GET(request: NextRequest) {
  // GET 请求也需要认证（查询状态）
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid admin key' }, { status: 401 });
  }

  try {
    const workspacePath = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';

    const { stdout: branchStdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
      cwd: workspacePath,
      timeout: 10000,
    });

    const { stdout: logStdout } = await execAsync('git log --oneline -3', {
      cwd: workspacePath,
      timeout: 10000,
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Deploy API is ready',
      branch: branchStdout.trim(),
      recentCommits: logStdout.trim().split('\n').filter(Boolean),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error?.message || String(error),
    }, { status: 500 });
  }
}
