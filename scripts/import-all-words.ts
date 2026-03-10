/**
 * 批量导入所有单词数据
 * 按字母顺序依次执行导入脚本
 */
import { getSupabaseClient } from '../src/storage/database/supabase-client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const supabase = getSupabaseClient();
const WORDS_TABLE = 'words';

// 按顺序执行的脚本列表
const SCRIPTS = [
  'seed-data.ts',       // 初始化分类和基础数据
  'words-data-part1.ts',
  'words-data-part2.ts', 
  'words-data-part3.ts',
  'words-data-part4.ts',
  'more-words.ts',
  'words-fi.ts',        // F-I 字母
  'words-ghi.ts',       // G-H-I 字母
  'words-i.ts',         // I 字母
  'words-jk.ts',        // J-K 字母
  'words-l.ts',         // L 字母
  'words-m.ts',         // M 字母
  'words-no.ts',        // N-O 字母
  'words-pq.ts',        // P-Q 字母
  'words-stuv.ts',      // S-T-U-V 字母
  'words-wx.ts',        // W-X 字母
  'words-yz.ts',        // Y-Z 字母
];

async function getCurrentCount(): Promise<number> {
  const { count } = await supabase
    .from(WORDS_TABLE)
    .select('*', { count: 'exact', head: true });
  return count || 0;
}

async function runScript(scriptName: string): Promise<{ success: boolean; output: string }> {
  console.log(`\n>>> 执行: ${scriptName}`);
  try {
    const { stdout, stderr } = await execAsync(`npx tsx scripts/${scriptName}`, {
      timeout: 120000, // 2分钟超时
    });
    const output = stdout + stderr;
    console.log(output.slice(-500)); // 只显示最后500字符
    return { success: true, output };
  } catch (error: unknown) {
    const err = error as { message?: string; stdout?: string; stderr?: string };
    console.error(`❌ ${scriptName} 执行失败:`, err.message);
    return { success: false, output: err.stdout || err.stderr || err.message || 'Unknown error' };
  }
}

async function main() {
  console.log('=== 开始批量导入单词数据 ===\n');
  
  const initialCount = await getCurrentCount();
  console.log(`当前单词总数: ${initialCount}`);
  
  const results: Array<{ script: string; success: boolean }> = [];
  
  for (const script of SCRIPTS) {
    const result = await runScript(script);
    results.push({ script, success: result.success });
    
    // 短暂暂停，避免数据库压力
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const finalCount = await getCurrentCount();
  
  console.log('\n=== 导入完成 ===');
  console.log(`初始单词数: ${initialCount}`);
  console.log(`最终单词数: ${finalCount}`);
  console.log(`新增单词: ${finalCount - initialCount}`);
  
  console.log('\n执行结果:');
  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.script}`);
  });
  
  // 统计失败数量
  const failed = results.filter(r => !r.success).length;
  if (failed > 0) {
    console.log(`\n⚠️  有 ${failed} 个脚本执行失败`);
  }
}

main().catch(console.error);
