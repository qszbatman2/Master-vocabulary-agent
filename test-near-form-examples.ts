import { getSupabaseClient } from './src/storage/database/supabase-client';
import { buildNearFormIndex, queryNearFormIndex, nearFormScore } from './src/lib/near-form';

async function testNearFormExamples() {
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

  // 构建形近词索引
  const uniqueWords = Array.from(new Map(allWords.map(w => [w.word, w])).values());
  const nearIndex = buildNearFormIndex(uniqueWords);

  console.log('='.repeat(100));
  console.log('形近词模式示例 - 阈值 0.60 - 5个题目');
  console.log('='.repeat(100));
  console.log();

  // 找5个能凑齐3个以上形近词的单词
  const candidates: Array<{
    word: typeof allWords[0];
    nearForms: Array<{ word: string; score: number; meaning: string; sameFirstLetter: boolean }>;
  }> = [];

  for (const word of uniqueWords) {
    if (candidates.length >= 5) break;

    // 使用 0.6 阈值查询形近词（去掉首字母限制）
    const nearCandidates = queryNearFormIndex(word.word, nearIndex, {
      topK: 100,
      minScore: 0.60,
      maxLenDiff: 3,
      expandIfLessThan: 1000,
    });

    // 计算分数并排序
    const scored = nearCandidates
      .map(c => ({
        word: c.word,
        score: nearFormScore(word.word, c.word),
        meaning: uniqueWords.find(w => w.word.toLowerCase() === c.word.toLowerCase())?.meaning || '',
        sameFirstLetter: c.word.charAt(0).toLowerCase() === word.word.charAt(0).toLowerCase(),
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length >= 3) {
      candidates.push({
        word,
        nearForms: scored.slice(0, 5), // 取前5个
      });
    }
  }

  // 输出题目
  candidates.forEach((candidate, idx) => {
    const { word, nearForms } = candidate;
    const firstLetter = word.word.charAt(0).toLowerCase();

    console.log(`题目 ${idx + 1}`);
    console.log('─'.repeat(100));
    console.log(`【题目】 ${word.meaning}`);
    console.log(`【正确答案】 ${word.word} (${word.phonetic || ''})`);
    console.log(`【首字母】 ${firstLetter.toUpperCase()}`);
    console.log();

    console.log('【形近词干扰项】（按相似度排序）：');
    console.log();

    nearForms.forEach((near, i) => {
      const letterIcon = near.sameFirstLetter ? '✅' : '❌';
      const letterText = near.sameFirstLetter ? '(相同首字母)' : '(不同首字母)';
      const scoreBar = '█'.repeat(Math.floor(near.score * 20)) + '░'.repeat(20 - Math.floor(near.score * 20));
      console.log(`  选项 ${i + 1}: ${near.word.padEnd(20)} - 相似度: ${near.score.toFixed(4)} ${letterIcon} ${letterText}`);
      console.log(`  ${scoreBar} ${near.score.toFixed(2)}`);
      console.log(`  含义: ${near.meaning}`);
      console.log();
    });

    // 统计相同首字母的干扰项数量
    const sameFirstLetterCount = nearForms.filter(n => n.sameFirstLetter).length;
    console.log(`📊 统计: 前3个干扰项中，${sameFirstLetterCount >= 3 ? '全部' : `${sameFirstLetterCount}个`} 相同首字母`);

    console.log();
    console.log();
  });

  console.log('='.repeat(100));
  console.log('📈 阈值说明');
  console.log('='.repeat(100));
  console.log();
  console.log('• 0.90+: 极高相似度（几乎一模一样）');
  console.log('• 0.80-0.89: 高相似度（容易混淆）');
  console.log('• 0.70-0.79: 较高相似度（有一定混淆性）');
  console.log('• 0.60-0.69: 中等相似度（需要仔细辨认）');
  console.log('• < 0.60: 低相似度（形近但不明显）');
  console.log();
}

testNearFormExamples().catch(console.error);
