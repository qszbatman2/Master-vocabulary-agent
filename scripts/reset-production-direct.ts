/**
 * 通过 Supabase 直接清空并重置生产环境数据
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

const BATCH_SIZE = 200;

interface Word {
  word: string;
  phonetic: string;
  meaning: string;
  example_sentence: string;
  example_sentence_cn: string | null;
  category: string;
}

interface DBData {
  total: number;
  categories: Array<{ id: number; name: string; description: string }>;
  words: Word[];
}

// 加载环境变量
function loadEnv(): { url: string; anonKey: string } {
  try {
    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    const envMap: Record<string, string> = {};
    
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        envMap[key] = value;
      }
    }

    const url = envMap.COZE_SUPABASE_URL;
    const anonKey = envMap.COZE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error('缺少 Supabase 环境变量');
    }

    return { url, anonKey };
  } catch (err) {
    console.error('加载环境变量失败:', err);
    throw err;
  }
}

async function resetProduction() {
  console.log('=== 通过 Supabase 直接重置生产环境数据 ===\n');
  console.log('⚠️  警告：此操作将清空生产环境的所有单词数据！\n');
  
  // 1. 连接数据库
  console.log('1. 连接 Supabase 数据库...');
  const { url, anonKey } = loadEnv();
  console.log(`   数据库 URL: ${url}`);
  
  const client = createClient(url, anonKey, {
    db: { timeout: 60000 },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  
  // 2. 检查当前状态
  console.log('\n2. 检查当前数据状态...');
  const { count: currentCount } = await client
    .from('words')
    .select('*', { count: 'exact', head: true });
  console.log(`   当前单词数: ${currentCount}`);
  
  const { data: categories } = await client
    .from('vocabulary_categories')
    .select('*')
    .order('id');
  console.log(`   当前分类数: ${categories?.length || 0}`);
  
  // 3. 清空单词数据
  console.log('\n3. 清空单词数据...');
  const { error: deleteError } = await client
    .from('words')
    .delete()
    .neq('id', 0);
  
  if (deleteError) {
    console.error('   清空失败:', deleteError.message);
  } else {
    console.log('   ✓ 单词数据已清空');
  }
  
  // 4. 读取本地数据
  console.log('\n4. 读取本地数据...');
  const dataPath = path.join(process.cwd(), 'assets', 'DB-data.json');
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const data: DBData = JSON.parse(fileContent);
  console.log(`   本地数据: ${data.words.length} 个单词, ${data.categories.length} 个分类`);
  
  // 5. 确保分类存在
  console.log('\n5. 确保分类存在...');
  const categoryIds: Record<string, number> = {};
  
  for (const cat of data.categories) {
    const { data: existing } = await client
      .from('vocabulary_categories')
      .select('id')
      .eq('name', cat.name)
      .single();
    
    if (existing) {
      categoryIds[cat.name] = existing.id;
    } else {
      const { data: created, error } = await client
        .from('vocabulary_categories')
        .insert({ name: cat.name, description: cat.description })
        .select('id')
        .single();
      
      if (!error && created) {
        categoryIds[cat.name] = created.id;
        console.log(`   ✓ 创建分类: ${cat.name}`);
      }
    }
  }
  console.log(`   分类映射: ${JSON.stringify(categoryIds)}`);
  
  // 6. 批量导入单词
  console.log('\n6. 批量导入单词...');
  const records = data.words.map(w => ({
    word: w.word.toLowerCase(),
    phonetic: w.phonetic || '',
    meaning: w.meaning,
    example_sentence: w.example_sentence || '',
    example_sentence_cn: w.example_sentence_cn || '',
    category_id: categoryIds[w.category] || 1,
  }));
  
  let imported = 0;
  const totalBatches = Math.ceil(records.length / BATCH_SIZE);
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    const { error } = await client.from('words').insert(batch);
    
    if (!error) {
      imported += batch.length;
      console.log(`   批次 ${batchNum}/${totalBatches}: 导入成功 (${imported}/${records.length})`);
    } else {
      console.error(`   批次 ${batchNum}/${totalBatches}: 导入失败 - ${error.message}`);
    }
  }
  
  // 7. 验证结果
  console.log('\n7. 验证结果...');
  const { count: finalCount } = await client
    .from('words')
    .select('*', { count: 'exact', head: true });
  
  const { data: finalCategories } = await client
    .from('vocabulary_categories')
    .select('id, name')
    .order('id');
  
  console.log('\n=== 完成 ===');
  console.log(`导入单词数: ${imported}`);
  console.log(`最终单词数: ${finalCount}`);
  console.log(`最终分类数: ${finalCategories?.length || 0}`);
  
  if (finalCount === data.words.length) {
    console.log('\n✓ 数据完全匹配！');
  } else {
    console.log(`\n⚠️ 数据不匹配！预期 ${data.words.length}，实际 ${finalCount}`);
  }
}

resetProduction().catch(console.error);
