import { getSupabaseClient } from './src/storage/database/supabase-client';
import { buildNearFormIndex, queryNearFormIndex, nearFormScore } from './src/lib/near-form';

async function testNearFormStats() {
  const client = getSupabaseClient();

  // 获取所有单词
  const { data: allWords, error } = await client
    .from('words')
    .select('id, word, phonetic, meaning')
    .limit(1000);

  if (error || !allWords) {
    console.error('Failed to fetch words:', error);
    return;
  }

  // 测试200个单词（更大规模）
  const shuffled = [...allWords].sort(() => Math.random() - 0.5);
  const selectedWords = shuffled.slice(0, 200);

  // 构建形近词索引
  const uniqueWords = Array.from(new Map(allWords.map(w => [w.word, w])).values());
  const nearIndex = buildNearFormIndex(uniqueWords);

  console.log('='.repeat(80));
  console.log('形近词干扰项统计 - 200个单词');
  console.log('='.repeat(80));
  console.log();

  interface ThresholdStats {
    enough3: number;
    enough2: number;
    enough1: number;
    zero: number;
  }

  const stats: {
    total: number;
    byThreshold: Record<string, ThresholdStats>;
    allCandidates: number[];
  } = {
    total: selectedWords.length,
    byThreshold: {},
    allCandidates: [],
  };

  // 初始化阈值统计
  [0.75, 0.70, 0.68, 0.65, 0.60, 0.55].forEach(t => {
    stats.byThreshold[String(t * 100)] = { enough3: 0, enough2: 0, enough1: 0, zero: 0 };
  });

  for (const word of selectedWords) {
    // 查询形近词（完全去掉首字母限制）
    const candidates = queryNearFormIndex(word.word, nearIndex, {
      topK: 100,
      minScore: 0.55,
      maxLenDiff: 3,
      expandIfLessThan: 1000,
    });

    // 计算每个候选的分数
    const scoredCandidates = candidates.map(c => ({
      word: c.word,
      score: nearFormScore(word.word, c.word),
    })).sort((a, b) => b.score - a.score);

    stats.allCandidates.push(scoredCandidates.length);

    // 按不同阈值统计
    const thresholds = [0.75, 0.70, 0.68, 0.65, 0.60, 0.55];
    thresholds.forEach(threshold => {
      const filtered = scoredCandidates.filter(c => c.score >= threshold);
      const key = String(threshold * 100);

      if (filtered.length >= 3) {
        stats.byThreshold[key].enough3++;
      } else if (filtered.length >= 2) {
        stats.byThreshold[key].enough2++;
      } else if (filtered.length >= 1) {
        stats.byThreshold[key].enough1++;
      } else {
        stats.byThreshold[key].zero++;
      }
    });
  }

  // 输出统计结果
  console.log('📊 不同阈值下的形近词分布：');
  console.log();

  Object.entries(stats.byThreshold).forEach(([thresholdKey, data]) => {
    const threshold = parseFloat(thresholdKey) / 100;
    console.log(`${threshold.toFixed(2)}+:`);
    console.log(`   能凑齐3个干扰项: ${data.enough3}/${stats.total} (${(data.enough3 / stats.total * 100).toFixed(1)}%)`);
    console.log(`   能凑齐2个干扰项: ${data.enough2}/${stats.total} (${(data.enough2 / stats.total * 100).toFixed(1)}%)`);
    console.log(`   能凑齐1个干扰项: ${data.enough1}/${stats.total} (${(data.enough1 / stats.total * 100).toFixed(1)}%)`);
    console.log(`   没有形近词: ${data.zero}/${stats.total} (${(data.zero / stats.total * 100).toFixed(1)}%)`);
    console.log();
  });

  console.log('─'.repeat(80));
  console.log();

  console.log('📈 总体统计：');
  const avg = stats.allCandidates.reduce((a, b) => a + b, 0) / stats.allCandidates.length;
  const max = Math.max(...stats.allCandidates);
  const min = Math.min(...stats.allCandidates);
  const median = stats.allCandidates.sort((a, b) => a - b)[Math.floor(stats.allCandidates.length / 2)];

  console.log(`   平均形近词数量: ${avg.toFixed(1)}`);
  console.log(`   中位数形近词数量: ${median}`);
  console.log(`   最多形近词数量: ${max}`);
  console.log(`   最少形近词数量: ${min}`);
  console.log();

  // 分段统计
  const ranges = [
    { label: '0个', min: 0, max: 0 },
    { label: '1个', min: 1, max: 1 },
    { label: '2个', min: 2, max: 2 },
    { label: '3个', min: 3, max: 3 },
    { label: '4-5个', min: 4, max: 5 },
    { label: '6-10个', min: 6, max: 10 },
    { label: '10个以上', min: 11, max: Infinity },
  ];

  console.log('📊 形近词数量分布：');
  ranges.forEach(({ label, min, max }) => {
    const count = stats.allCandidates.filter(c => c >= min && c <= max).length;
    const percentage = count / stats.allCandidates.length * 100;
    console.log(`   ${label.padEnd(10)}: ${count}/${stats.allCandidates.length} (${percentage.toFixed(1)}%)`);
  });
  console.log();
}

testNearFormStats().catch(console.error);
