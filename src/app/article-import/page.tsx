'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Token {
  text: string;
  index: number;
  isWord: boolean;
  lemma?: string;
  inVocabulary?: boolean;
  sentence?: string;
}

interface SelectedWord {
  text: string;
  lemma: string;
  context: string;
  tokenIndex: number;
}

export default function ArticleImportPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [step, setStep] = useState<'input' | 'select' | 'done'>('input');
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // 预览文章
  const handlePreview = async () => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/article-import/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content, title }),
      });
      
      const data = await response.json();
      if (data.success) {
        setTokens(data.tokens);
        setShowPreview(true);
        setStep('select');
      } else {
        alert('解析失败：' + data.error);
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert('解析失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 切换选中状态
  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // 提交选中的单词
  const handleSubmit = async () => {
    if (selectedIndices.size === 0) {
      alert('请至少选择一个生词');
      return;
    }

    const selectedWords: SelectedWord[] = [];
    tokens.forEach((token) => {
      if (selectedIndices.has(token.index) && token.lemma && token.sentence) {
        selectedWords.push({
          text: token.text,
          lemma: token.lemma,
          context: token.sentence,
          tokenIndex: token.index,
        });
      }
    });

    setIsSaving(true);
    try {
      const response = await fetch('/api/article-import/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content, title, selectedWords }),
      });
      
      const data = await response.json();
      if (data.success) {
        setStep('done');
      } else {
        alert('保存失败：' + data.error);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染 token
  const renderTokens = () => {
    return tokens.map((token) => {
      if (!token.isWord) {
        // 非单词字符（空格、标点等）
        if (token.text === '\n') {
          return <br key={token.index} />;
        }
        return <span key={token.index}>{token.text}</span>;
      }

      const isSelected = selectedIndices.has(token.index);
      const isInVocab = token.inVocabulary;

      return (
        <span
          key={token.index}
          onClick={() => toggleSelection(token.index)}
          className={`
            cursor-pointer transition-all duration-200 rounded px-0.5
            ${isSelected 
              ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white ring-2 ring-pink-500/50' 
              : isInVocab 
                ? 'text-green-400/80 hover:bg-green-500/20' 
                : 'text-white hover:bg-white/10'
            }
          `}
          title={token.lemma}
        >
          {token.text}
          {isSelected && (
            <sup className="ml-0.5 text-[10px]">✓</sup>
          )}
        </span>
      );
    });
  };

  // 统计选中信息
  const selectedCount = selectedIndices.size;
  const newWordsCount = [...selectedIndices].filter(i => {
    const token = tokens[i];
    return token && !token.inVocabulary;
  }).length;

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col safe-area-top" style={{ background: '#12121e' }}>
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff)', opacity: 0.2 }}
        />
        <div 
          className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-[100px]"
          style={{ background: 'linear-gradient(135deg, #4cc9ff, #7c4dff)', opacity: 0.15 }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-6 flex-1 max-w-3xl">
        {/* 顶部导航 */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">从文章添加生词</h1>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center gap-2 mb-8">
          {['粘贴文章', '标记生词', '完成'].map((label, i) => (
            <div key={i} className="flex items-center">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step === 'input' && i === 0 ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' :
                    step === 'select' && i === 1 ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' :
                    step === 'done' && i === 2 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                    i < (step === 'input' ? 0 : step === 'select' ? 1 : 2) 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 text-white/40'}
                `}
              >
                {i < (step === 'input' ? 0 : step === 'select' ? 1 : 2) ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`ml-2 text-sm ${i <= (step === 'input' ? 0 : step === 'select' ? 1 : 2) ? 'text-white' : 'text-white/40'}`}>
                {label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-white/20 mx-2" />}
            </div>
          ))}
        </div>

        {/* 步骤 1：输入文章 */}
        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">文章标题（可选）</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给文章起个名字..."
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50"
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">英文文章内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="粘贴英文文章..."
                className="w-full h-80 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handlePreview}
                disabled={!content.trim() || isLoading}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    解析文章
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 步骤 2：选择生词 */}
        {step === 'select' && (
          <div className="space-y-4">
            {/* 操作提示 */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">
                <span className="text-green-400">绿色</span> = 已在词库 | 
                <span className="text-white"> 白色</span> = 新词 | 
                点击单词标记为生词
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('input')}
                className="text-white/60 hover:text-white"
              >
                返回修改
              </Button>
            </div>

            {/* 文章预览 */}
            <div 
              ref={contentRef}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 text-white leading-relaxed"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
            >
              {renderTokens()}
            </div>

            {/* 统计信息 */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-white/80">
                已选择 <span className="text-pink-400 font-bold">{selectedCount}</span> 个词
                {newWordsCount > 0 && (
                  <span className="text-white/40 ml-2">
                    (其中 <span className="text-green-400">{newWordsCount}</span> 个新词)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIndices(new Set())}
                  className="text-white/60 hover:text-white"
                >
                  清空选择
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedCount === 0 || isSaving}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      添加到待复习
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 步骤 3：完成 */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, #00f0ff, #7c4dff)' }}
            >
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">添加成功！</h2>
            <p className="text-white/60 mb-6">
              已添加 {selectedCount} 个生词到待复习列表
            </p>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('input');
                  setContent('');
                  setTitle('');
                  setTokens([]);
                  setSelectedIndices(new Set());
                  setShowPreview(false);
                }}
                className="text-white/60 hover:text-white"
              >
                继续添加
              </Button>
              <Link href="/practice">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0">
                  开始练习
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
