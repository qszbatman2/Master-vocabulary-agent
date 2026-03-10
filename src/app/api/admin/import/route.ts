import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 简单的授权检查
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
  return authHeader === `Bearer ${adminKey}`;
}

// 单词数据 - 按字母分批
const WORD_BATCHES = [
  // A-D 批次
  [
    { word: 'abandon', phonetic: '/əˈbændən/', meaning: 'v. 放弃；抛弃', category: '托福词汇' },
    { word: 'ability', phonetic: '/əˈbɪləti/', meaning: 'n. 能力；才能', category: '托福词汇' },
    { word: 'abnormal', phonetic: '/æbˈnɔːml/', meaning: 'adj. 反常的；异常的', category: '托福词汇' },
    { word: 'aboard', phonetic: '/əˈbɔːd/', meaning: 'adv./prep. 在船/飞机上', category: '托福词汇' },
    { word: 'abolish', phonetic: '/əˈbɒlɪʃ/', meaning: 'v. 废除；废止', category: '托福词汇' },
    { word: 'abroad', phonetic: '/əˈbrɔːd/', meaning: 'adv. 在国外；到国外', category: '托福词汇' },
    { word: 'abrupt', phonetic: '/əˈbrʌpt/', meaning: 'adj. 突然的；唐突的', category: '托福词汇' },
    { word: 'absence', phonetic: '/ˈæbsəns/', meaning: 'n. 缺席；不在', category: '托福词汇' },
    { word: 'absent', phonetic: '/ˈæbsənt/', meaning: 'adj. 缺席的；不在的', category: '托福词汇' },
    { word: 'absolute', phonetic: '/ˈæbsəluːt/', meaning: 'adj. 绝对的；完全的', category: '托福词汇' },
  ],
  // 更多批次会在实际导入时从文件加载
];

// 分类映射
const CATEGORY_MAP: Record<string, string> = {
  '雅思词汇': 'IELTS',
  '托福词汇': 'TOEFL',
  'GRE词汇': 'GRE',
  '日常词汇': 'Daily',
  '商务词汇': 'Business',
  '科技词汇': 'Tech',
  '医学词汇': 'Medical',
  '法律词汇': 'Legal',
};

export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  
  // 获取当前状态
  const { count: wordCount } = await client
    .from('words')
    .select('*', { count: 'exact', head: true });
  
  const { data: categories } = await client
    .from('vocabulary_categories')
    .select('id, name')
    .order('id');
  
  return NextResponse.json({
    status: 'ok',
    wordCount,
    categories: categories || [],
    message: wordCount && wordCount > 1000 
      ? '数据库已有充足数据' 
      : '数据库数据较少，请调用 POST /api/admin/import 执行导入',
  });
}

export async function POST(request: NextRequest) {
  // 授权检查
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const client = getSupabaseClient();
  
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'status';
    
    if (action === 'import') {
      // 执行导入脚本
      console.log('开始执行数据导入...');
      
      try {
        // 在生产环境中执行导入脚本
        const { stdout, stderr } = await execAsync('npx tsx scripts/import-all-words.ts', {
          timeout: 300000, // 5分钟超时
        });
        
        console.log('导入输出:', stdout.slice(-1000));
        if (stderr) console.error('导入错误:', stderr);
        
        // 获取最新状态
        const { count: newCount } = await client
          .from('words')
          .select('*', { count: 'exact', head: true });
        
        return NextResponse.json({
          success: true,
          message: '导入完成',
          wordCount: newCount,
          output: stdout.slice(-500),
        });
      } catch (execError) {
        console.error('执行导入脚本失败:', execError);
        return NextResponse.json({
          success: false,
          error: '执行导入脚本失败',
          details: String(execError),
        }, { status: 500 });
      }
    }
    
    if (action === 'clean-duplicates') {
      // 执行去重
      console.log('开始执行数据去重...');
      
      try {
        const { stdout, stderr } = await execAsync('npx tsx scripts/clean-duplicates.ts', {
          timeout: 300000,
        });
        
        const { count: newCount } = await client
          .from('words')
          .select('*', { count: 'exact', head: true });
        
        return NextResponse.json({
          success: true,
          message: '去重完成',
          wordCount: newCount,
          output: stdout.slice(-500),
        });
      } catch (execError) {
        return NextResponse.json({
          success: false,
          error: '执行去重脚本失败',
          details: String(execError),
        }, { status: 500 });
      }
    }
    
    if (action === 'fix-categories') {
      // 修复重复分类
      console.log('开始修复重复分类...');
      
      try {
        const { stdout } = await execAsync('npx tsx scripts/fix-duplicate-categories-v2.ts', {
          timeout: 60000,
        });
        
        return NextResponse.json({
          success: true,
          message: '分类修复完成',
          output: stdout.slice(-500),
        });
      } catch (execError) {
        return NextResponse.json({
          success: false,
          error: '执行分类修复失败',
          details: String(execError),
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      error: 'Unknown action',
      availableActions: ['import', 'clean-duplicates', 'fix-categories'],
    }, { status: 400 });
    
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: String(error),
    }, { status: 500 });
  }
}
