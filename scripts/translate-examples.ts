import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

async function translateExamples() {
  const client = getSupabaseClient();
  const llmClient = new LLMClient(new Config());

  // 获取所有没有中文翻译的例句
  const { data: words, error } = await client
    .from('words')
    .select('id, word, example_sentence')
    .not('example_sentence', 'is', null)
    .is('example_sentence_cn', null);

  if (error || !words) {
    console.error('Failed to fetch words:', error);
    return;
  }

  console.log(`Found ${words.length} sentences to translate`);

  // 批量翻译
  let translatedCount = 0;
  for (const word of words) {
    if (!word.example_sentence) continue;

    try {
      const messages = [
        {
          role: 'system' as const,
          content: '你是一个专业的英译中翻译助手。请将用户提供的英文句子翻译成自然流畅的中文。只输出翻译结果，不要输出任何其他内容。',
        },
        {
          role: 'user' as const,
          content: word.example_sentence,
        },
      ];

      const response = await llmClient.invoke(messages, { temperature: 0.3 });
      const translation = response.content.trim();

      // 更新数据库
      const { error: updateError } = await client
        .from('words')
        .update({ example_sentence_cn: translation })
        .eq('id', word.id);

      if (!updateError) {
        translatedCount++;
        console.log(`[${translatedCount}/${words.length}] ${word.word}: ${word.example_sentence} → ${translation}`);
      } else {
        console.error(`Failed to update word ${word.id}:`, updateError);
      }
    } catch (e) {
      console.error(`Failed to translate word ${word.id}:`, e);
    }
  }

  console.log(`\nTranslation completed: ${translatedCount}/${words.length}`);
}

translateExamples().catch(console.error);
