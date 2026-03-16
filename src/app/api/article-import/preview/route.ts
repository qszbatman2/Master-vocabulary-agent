import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { batchLemmatize } from '@/lib/lemma-utils';

// 解析 token 获取用户 ID
function getUserIdFromToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = parseInt(decoded.split(':')[0]);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

// 常量限制
const MAX_CONTENT_LENGTH = 20000; // 最大文章长度

interface TokenInfo {
  text: string;
  index: number;
  isWord: boolean;
  lemma?: string;
  inVocabulary?: boolean;
  sentence?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = token ? getUserIdFromToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, title } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // 长度限制
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ 
        error: `Content too long. Maximum ${MAX_CONTENT_LENGTH} characters allowed.` 
      }, { status: 413 });
    }

    // 1. 分词：使用正则表达式
    const tokenRegex = /([a-zA-Z]+(?:'[a-zA-Z]+)?|[.,!?;:'"()\-\n\r\s]+)/g;
    const tokens: string[] = [];
    let match;
    while ((match = tokenRegex.exec(content)) !== null) {
      tokens.push(match[0]);
    }

    // 2. 提取所有单词并批量词形还原
    const words = tokens.filter(t => /^[a-zA-Z]+$/.test(t));
    const lemmaMap = batchLemmatize(words);

    // 3. 查询词库，判断哪些词已在词库中
    const client = getSupabaseClient();
    const uniqueLemmas = [...new Set(lemmaMap.values())];
    
    // 分批查询（避免一次性查询太多）
    const BATCH_SIZE = 100;
    const vocabularySet = new Set<string>();
    
    for (let i = 0; i < uniqueLemmas.length; i += BATCH_SIZE) {
      const batch = uniqueLemmas.slice(i, i + BATCH_SIZE);
      const { data: vocabWords } = await client
        .from('words')
        .select('word')
        .in('word', batch);
      
      vocabWords?.forEach(w => vocabularySet.add(w.word.toLowerCase()));
    }

    // 4. 提取句子（用于上下文）
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

    // 5. 构建 token 信息
    const tokenInfos: TokenInfo[] = [];
    let currentSentenceIndex = 0;
    let charPosition = 0;

    tokens.forEach((token, index) => {
      charPosition += token.length;
      
      const isWord = /^[a-zA-Z]+$/.test(token);
      const lemma = isWord ? lemmaMap.get(token) : undefined;
      
      // 确定当前 token 所属的句子
      if (isWord) {
        // 找到包含当前 token 的句子
        for (let i = 0; i < sentences.length; i++) {
          if (content.indexOf(sentences[i]) <= charPosition - token.length &&
              charPosition - token.length < content.indexOf(sentences[i]) + sentences[i].length) {
            currentSentenceIndex = i;
            break;
          }
        }
      }

      tokenInfos.push({
        text: token,
        index,
        isWord,
        lemma,
        inVocabulary: isWord && lemma ? vocabularySet.has(lemma.toLowerCase()) : false,
        sentence: isWord ? sentences[currentSentenceIndex] : undefined,
      });
    });

    return NextResponse.json({
      success: true,
      tokens: tokenInfos,
      sentenceCount: sentences.length,
      wordCount: words.length,
    });

  } catch (error) {
    console.error('Article preview error:', error);
    return NextResponse.json(
      { error: 'Failed to process article' },
      { status: 500 }
    );
  }
}
