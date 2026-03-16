/**
 * 词形还原工具
 * 方案：lemmatizer NPM库 + LLM兜底
 */

// @ts-ignore - lemmatizer 库没有类型定义
import lemmatizer from 'lemmatizer';

// 常见不规则变化词库（补充lemmatizer库的不足）
const IRREGULAR_LEMMAS: Record<string, string> = {
  // 不规则动词
  'went': 'go',
  'gone': 'go',
  'was': 'be',
  'were': 'be',
  'been': 'be',
  'am': 'be',
  'is': 'be',
  'are': 'be',
  'had': 'have',
  'has': 'have',
  'did': 'do',
  'does': 'do',
  'done': 'do',
  'said': 'say',
  'made': 'make',
  'took': 'take',
  'taken': 'take',
  'came': 'come',
  'saw': 'see',
  'seen': 'see',
  'got': 'get',
  'gotten': 'get',
  'knew': 'know',
  'known': 'know',
  'thought': 'think',
  'given': 'give',
  'gave': 'give',
  'found': 'find',
  'told': 'tell',
  'asked': 'ask',
  'seemed': 'seem',
  'felt': 'feel',
  'tried': 'try',
  'left': 'leave',
  'called': 'call',
  'kept': 'keep',
  'let': 'let',
  'began': 'begin',
  'begun': 'begin',
  'showed': 'show',
  'shown': 'show',
  'heard': 'hear',
  'played': 'play',
  'run': 'run',
  'ran': 'run',
  'moved': 'move',
  'lived': 'live',
  'believed': 'believe',
  'brought': 'bring',
  'happened': 'happen',
  'wrote': 'write',
  'written': 'write',
  'sat': 'sit',
  'stood': 'stand',
  'lost': 'lose',
  'paid': 'pay',
  'met': 'meet',
  'included': 'include',
  'continued': 'continue',
  'set': 'set',
  'learnt': 'learn',
  'learned': 'learn',
  'changed': 'change',
  'led': 'lead',
  'understood': 'understand',
  'watched': 'watch',
  'followed': 'follow',
  'stopped': 'stop',
  'created': 'create',
  'spoke': 'speak',
  'spoken': 'speak',
  'read': 'read',
  'spent': 'spend',
  'grew': 'grow',
  'grown': 'grow',
  'opened': 'open',
  'walked': 'walk',
  'won': 'win',
  'offered': 'offer',
  'remembered': 'remember',
  'loved': 'love',
  'considered': 'consider',
  'appeared': 'appear',
  'bought': 'buy',
  'waited': 'wait',
  'served': 'serve',
  'died': 'die',
  'sent': 'send',
  'expected': 'expect',
  'built': 'build',
  'stayed': 'stay',
  'fell': 'fall',
  'fallen': 'fall',
  'cut': 'cut',
  'reached': 'reach',
  'killed': 'kill',
  'remained': 'remain',
  'suggested': 'suggest',
  'raised': 'raise',
  'passed': 'pass',
  'sold': 'sell',
  'required': 'require',
  'reported': 'report',
  'decided': 'decide',
  'pulled': 'pull',
};

/**
 * 本地词形还原（NPM库 + 不规则词库）
 * @param word 原词
 * @returns 词形还原结果
 */
export function lemmatizeLocal(word: string): string {
  const lowerWord = word.toLowerCase();
  
  // 1. 先检查不规则词库
  if (IRREGULAR_LEMMAS[lowerWord]) {
    return IRREGULAR_LEMMAS[lowerWord];
  }
  
  // 2. 使用 lemmatizer 库
  try {
    const lemma = lemmatizer(lowerWord);
    if (lemma && lemma !== lowerWord) {
      return lemma.toLowerCase();
    }
  } catch (e) {
    // lemmatizer 可能对某些词报错，忽略
  }
  
  // 3. 简单规则处理
  // -es -> -is (analyses -> analysis)
  if (lowerWord.endsWith('ses') && lowerWord.length > 4) {
    return lowerWord.slice(0, -2) + 'is';
  }
  
  // -ies -> -y (studies -> study)
  if (lowerWord.endsWith('ies') && lowerWord.length > 4) {
    return lowerWord.slice(0, -3) + 'y';
  }
  
  // -ves -> -f/-fe (lives -> life, knives -> knife)
  if (lowerWord.endsWith('ves')) {
    const base = lowerWord.slice(0, -3);
    // 常见词优先
    const commonFe = ['li', 'wi', 'hal', 'sel', 'themsel', 'yoursel', 'oursel', 'mysel', 'hersel', 'himsel'];
    if (commonFe.some(w => base.endsWith(w))) {
      return base + 'fe';
    }
    return base + 'f';
  }
  
  // -ed -> 原形 (worked -> work)
  if (lowerWord.endsWith('ed') && lowerWord.length > 4) {
    // 双写辅音结尾 (stopped -> stop)
    if (lowerWord.length > 4 && 
        lowerWord[lowerWord.length - 3] === lowerWord[lowerWord.length - 4] &&
        /[aeiou]/.test(lowerWord[lowerWord.length - 5])) {
      return lowerWord.slice(0, -3);
    }
    // 加 e 的 (loved -> love)
    if (lowerWord.length > 3) {
      return lowerWord.slice(0, -1);
    }
    return lowerWord.slice(0, -2);
  }
  
  // -ing -> 原形 (working -> work)
  if (lowerWord.endsWith('ing') && lowerWord.length > 5) {
    // 双写辅音 (running -> run)
    if (lowerWord.length > 5 &&
        lowerWord[lowerWord.length - 4] === lowerWord[lowerWord.length - 5] &&
        /[aeiou]/.test(lowerWord[lowerWord.length - 6])) {
      return lowerWord.slice(0, -4);
    }
    // 去 e 加 ing (making -> make)
    const baseWithoutIng = lowerWord.slice(0, -3);
    // 尝试加 e
    return baseWithoutIng + 'e';
  }
  
  // -er, -est (比较级、最高级)
  if (lowerWord.endsWith('er') && lowerWord.length > 3) {
    // better -> good (特殊)
    if (lowerWord === 'better') return 'good';
    if (lowerWord === 'worse') return 'bad';
    if (lowerWord === 'more') return 'much';
    // faster -> fast
    return lowerWord.slice(0, -2);
  }
  
  if (lowerWord.endsWith('est') && lowerWord.length > 4) {
    if (lowerWord === 'best') return 'good';
    if (lowerWord === 'worst') return 'bad';
    if (lowerWord === 'most') return 'much';
    return lowerWord.slice(0, -3);
  }
  
  // -s -> 原形 (works -> work)
  if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss') && lowerWord.length > 3) {
    return lowerWord.slice(0, -1);
  }
  
  // 无法还原，返回小写
  return lowerWord;
}

/**
 * LLM 词形还原（兜底方案）
 * @param word 原词
 * @returns 词形还原结果
 */
export async function lemmatizeWithLLM(word: string): Promise<string> {
  try {
    // 动态导入，避免 SSR 问题
    const { LLMClient } = await import('coze-coding-dev-sdk');
    
    const llm = new LLMClient();
    
    const messages = [
      {
        role: 'user' as const,
        content: `What is the lemma (base form) of the word "${word}"? 
Reply with ONLY the lemma, nothing else. Examples:
- running -> run
- better -> good
- studies -> study
- went -> go
- children -> child`
      }
    ];

    const result = await llm.invoke(messages, {
      model: 'doubao-seed-1-6-flash',
      temperature: 0.1,
    });
    
    const lemma = result.content.trim().toLowerCase();
    
    // 验证结果是单个词
    if (lemma.split(/\s+/).length === 1 && lemma.length > 0) {
      return lemma;
    }
    
    return word.toLowerCase();
  } catch (error) {
    console.error('LLM lemmatization failed:', error);
    return word.toLowerCase();
  }
}

/**
 * 智能词形还原（本地优先，LLM兜底）
 * @param word 原词
 * @param useLLM 是否使用LLM兜底（默认false，用于批量处理时避免API调用）
 * @returns 词形还原结果
 */
export async function smartLemmatize(word: string, useLLM: boolean = false): Promise<string> {
  // 1. 本地还原
  const localLemma = lemmatizeLocal(word);
  
  // 2. 如果本地还原后和原词一样，且启用了LLM，则尝试LLM
  if (localLemma === word.toLowerCase() && useLLM) {
    return await lemmatizeWithLLM(word);
  }
  
  return localLemma;
}

/**
 * 批量词形还原（仅使用本地方法）
 * @param words 原词列表
 * @returns 映射：原词 -> 词根
 */
export function batchLemmatize(words: string[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const word of words) {
    result.set(word, lemmatizeLocal(word));
  }
  return result;
}
