import { getSupabaseClient } from './src/storage/database/supabase-client';
import { buildNearFormIndex, queryNearFormIndex, nearFormScore } from './src/lib/near-form';

async function testNearForm() {
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

  // 随机选择10个单词
  const shuffled = [...allWords].sort(() => Math.random() - 0.5);
  const selectedWords = shuffled.slice(0, 10);

  // 构建形近词索引
  const uniqueWords = Array.from(new Map(allWords.map(w => [w.word, w])).values());
  const nearIndex = buildNearFormIndex(uniqueWords);

  console.log('='.repeat(80));
  console.log('形近词干扰项测试 - 随机10个单词');
  console.log('='.repeat(80));
  console.log();

  for (const word of selectedWords) {
    console.log(`📝 单词: ${word.word} (${word.phonetic || ''})`);
    console.log(`   含义: ${word.meaning}`);
    console.log();

    // 查询形近词，获取前50个候选（使用更宽松的参数）
    const candidates = queryNearFormIndex(word.word, nearIndex, {
      topK: 100,
      minScore: 0.55, // 降低阈值，获取更多候选
      maxLenDiff: 3, // 允许长度差增大
      expandIfLessThan: 50, // 候选不足时扩展到不同首字母
    });

    // 计算每个候选的分数并排序
    const scoredCandidates = candidates
      .map(c => ({
        word: c.word,
        score: nearFormScore(word.word, c.word),
        originalData: uniqueWords.find(w => w.word.toLowerCase() === c.word.toLowerCase())
      }))
      .sort((a, b) => b.score - a.score);

    console.log(`   找到 ${scoredCandidates.length} 个形近词候选`);

    if (scoredCandidates.length > 0) {
      console.log();
      console.log('   📊 不同阈值下的干扰项:');

      // 按不同阈值分组
      const thresholds = [
        { min: 0.9, label: '0.90+ (极高相似度)' },
        { min: 0.85, label: '0.85+ (高相似度)' },
        { min: 0.80, label: '0.80+ (较高相似度)' },
        { min: 0.75, label: '0.75+ (中等相似度)' },
        { min: 0.70, label: '0.70+ (较低相似度)' },
        { min: 0.65, label: '0.65+ (弱相似度)' },
        { min: 0.60, label: '0.60+ (最低相似度)' },
      ];

      thresholds.forEach(({ min, label }) => {
        const filtered = scoredCandidates.filter(c => c.score >= min);
        if (filtered.length > 0) {
          console.log();
          console.log(`   ${label}:`);
          filtered.slice(0, 5).forEach((c, idx) => {
            console.log(`      ${idx + 1}. ${c.word.padEnd(15)} - 分数: ${c.score.toFixed(4)} - ${c.originalData?.meaning || ''}`);
          });
        }
      });
    } else {
      console.log('   ⚠️  未找到形近词');
    }

    console.log();
    console.log('─'.repeat(80));
    console.log();
  }

  // 统计信息
  console.log();
  console.log('='.repeat(80));
  console.log('📈 统计信息');
  console.log('='.repeat(80));

  const allCandidates: number[] = [];
  for (const word of selectedWords) {
    const candidates = queryNearFormIndex(word.word, nearIndex, {
      topK: 50,
      minScore: 0.6,
      maxLenDiff: 2,
      expandIfLessThan: 0,
    });
    allCandidates.push(candidates.length);
  }

  const avg = allCandidates.reduce((a, b) => a + b, 0) / allCandidates.length;
  const max = Math.max(...allCandidates);
  const min = Math.min(...allCandidates);

  console.log(`   平均形近词数量: ${avg.toFixed(1)}`);
  console.log(`   最多形近词数量: ${max}`);
  console.log(`   最少形近词数量: ${min}`);
  console.log();
}

testNearForm().catch(console.error);
