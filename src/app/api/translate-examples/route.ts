import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const llmClient = new LLMClient(new Config(), customHeaders);

    // 获取没有中文翻译的例句
    const { data: words, error } = await client
      .from('words')
      .select('id, word, example_sentence')
      .not('example_sentence', 'is', null)
      .is('example_sentence_cn', null)
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!words || words.length === 0) {
      return NextResponse.json({ message: '没有需要翻译的例句', translated: 0 });
    }

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
        }
      } catch (e) {
        console.error(`Failed to translate word ${word.id}:`, e);
      }
    }

    return NextResponse.json({
      message: `成功翻译 ${translatedCount} 个例句`,
      translated: translatedCount,
      remaining: words.length - translatedCount,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: '翻译失败' },
      { status: 500 }
    );
  }
}
