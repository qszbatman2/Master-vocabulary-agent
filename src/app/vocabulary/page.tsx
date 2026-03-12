'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ArrowLeft, Volume2, ChevronLeft, ChevronRight, Check, X, User, LogIn, XCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Word {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  example_sentence: string;
  example_sentence_cn?: string;
  category_id: number;
  vocabulary_categories: {
    name: string;
  };
  userStatus?: {
    isMastered: boolean;
    consecutiveCorrect: number;
    totalPracticeCount: number;
    correctCount: number;
    wrongCount: number;
    lastWrongAt: string | null;
    dailyCorrectCount: number;
  } | null;
}

interface Stats {
  totalWords: number;
  masteredWords: number;
  unmasteredWords: number;
}

interface VocabularyResponse {
  categories: Category[];
  words: Word[];
  total: number;
  page: number;
  pageSize: number;
  stats: Stats | null;
}

export default function VocabularyPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<VocabularyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [masteredStatus, setMasteredStatus] = useState('all');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const pageSize = 30;

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const fetchVocabulary = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (masteredStatus !== 'all') {
        params.append('mastered', masteredStatus);
      }
      if (filter === 'wrong_words') {
        params.append('filter', 'wrong_words');
      }
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const headers: Record<string, string> = {};
      if (token) {
        headers['authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary?${params.toString()}`, { headers });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, masteredStatus, filter, page, token]);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery, masteredStatus, filter]);

  const playAudio = (word: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#12121e' }}>
      {/* 背景网格纹理 */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* 背景渐变光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 -right-20 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse"
          style={{ 
            background: 'linear-gradient(135deg, #00f0ff, #7c4dff)',
            opacity: 0.15,
            animationDuration: '5s'
          }}
        />
        <div 
          className="absolute bottom-20 -left-20 w-[350px] h-[350px] rounded-full blur-[100px] animate-pulse"
          style={{ 
            background: 'linear-gradient(135deg, #ff6b9d, #c44cff)',
            opacity: 0.12,
            animationDuration: '6s',
            animationDelay: '2s'
          }}
        />
      </div>

      {/* 固定头部 */}
      <div 
        className="sticky top-0 z-20 border-b backdrop-blur-xl transition-all duration-700"
        style={{ 
          background: 'rgba(30, 30, 46, 0.9)',
          borderColor: 'rgba(255,255,255,0.05)',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)'
        }}
      >
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <button 
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff)' }}
                >
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">单词库</h1>
              </div>
            </div>
            
            {user ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#a0a0b0' }}>
                <User className="w-4 h-4" />
                <span className="max-w-20 truncate">{user.nickname}</span>
              </div>
            ) : (
              <Link href="/login">
                <button 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ 
                    background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)',
                    color: 'white'
                  }}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  登录
                </button>
              </Link>
            )}
          </div>

          {/* 筛选栏 */}
          <div 
            className="flex gap-2 transition-all duration-700 delay-100"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(10px)'
            }}
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#a0a0b0' }} />
              <Input
                placeholder="搜索单词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 text-sm rounded-xl border-0 transition-all duration-200"
                style={{ 
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger 
                className="w-28 h-10 text-xs rounded-xl border-0"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}
              >
                <SelectValue placeholder="词库" />
              </SelectTrigger>
              <SelectContent style={{ background: '#1e1e2e', border: 'none' }}>
                <SelectItem value="all">全部</SelectItem>
                {(data?.categories || []).map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {user && (
              <>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger 
                    className="w-24 h-10 text-xs rounded-xl border-0"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}
                  >
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#1e1e2e', border: 'none' }}>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="wrong_words">错题集</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={masteredStatus} onValueChange={setMasteredStatus}>
                  <SelectTrigger 
                    className="w-24 h-10 text-xs rounded-xl border-0"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}
                  >
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#1e1e2e', border: 'none' }}>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="mastered">已掌握</SelectItem>
                    <SelectItem value="unmastered">未掌握</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 单词列表 */}
      <div 
        className="flex-1 container mx-auto px-4 py-3 max-w-2xl transition-all duration-700 delay-200"
        style={{ 
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
        }}
      >
        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <div 
              className="w-10 h-10 rounded-full animate-spin"
              style={{ border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#c44cff' }}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {/* 统计信息 */}
            {data?.stats && (
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-2xl mb-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <span className="text-sm" style={{ color: '#a0a0b0' }}>
                  共 <span className="text-white font-medium">{data.total}</span> 个单词
                </span>
                <div className="flex items-center gap-3 text-sm">
                  <span style={{ color: '#00ff88' }}>
                    <Check className="w-3.5 h-3.5 inline mr-1" />
                    {data.stats.masteredWords}
                  </span>
                  <span style={{ color: '#a0a0b0' }}>
                    未掌握 {data.stats.unmasteredWords}
                  </span>
                </div>
              </div>
            )}
            
            {data?.words.map((word, index) => (
              <div 
                key={word.id} 
                className={cn(
                  "group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:-translate-y-0.5",
                )}
                style={{ 
                  background: word.userStatus?.isMastered 
                    ? 'rgba(0, 255, 136, 0.08)' 
                    : '#1e1e2e',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  animationDelay: `${index * 30}ms`
                }}
                onClick={() => setSelectedWord(word)}
              >
                {/* 边缘发光 */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: word.userStatus?.isMastered 
                      ? '0 0 20px rgba(0, 255, 136, 0.2)'
                      : '0 0 20px rgba(196, 76, 255, 0.15)'
                  }}
                />

                {/* 单词 */}
                <div className="flex-shrink-0 min-w-0 relative">
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-semibold text-lg"
                      style={{ color: word.userStatus?.isMastered ? '#00ff88' : 'white' }}
                    >
                      {word.word}
                    </span>
                    <button 
                      onClick={(e) => playAudio(word.word, e)}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <Volume2 className="w-4 h-4" style={{ color: '#00f0ff' }} />
                    </button>
                  </div>
                  {word.phonetic && (
                    <p className="text-xs mt-0.5" style={{ color: '#a0a0b0' }}>{word.phonetic}</p>
                  )}
                </div>

                {/* 释义 */}
                <div className="flex-1 min-w-0 relative">
                  <p className="text-sm break-words" style={{ color: '#a0a0b0' }}>{word.meaning}</p>
                </div>

                {/* 掌握状态 */}
                {word.userStatus?.isMastered && (
                  <div 
                    className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#12121e' }}
                  >
                    <Check className="w-3 h-3 inline mr-1" />
                    掌握
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && data?.words.length === 0 && (
          <div className="text-center py-16">
            <div 
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <Search className="w-8 h-8" style={{ color: '#a0a0b0' }} />
            </div>
            <p style={{ color: '#a0a0b0' }}>没有找到匹配的单词</p>
          </div>
        )}
      </div>

      {/* 固定底部分页 */}
      {totalPages > 1 && (
        <div 
          className="sticky bottom-0 z-20 border-t backdrop-blur-xl transition-all duration-700"
          style={{ 
            background: 'rgba(30, 30, 46, 0.9)',
            borderColor: 'rgba(255,255,255,0.05)'
          }}
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-3 max-w-2xl">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span 
              className="text-sm min-w-24 text-center"
              style={{ color: '#a0a0b0' }}
            >
              <span className="text-white font-medium">{page}</span>
              <span className="mx-1">/</span>
              <span>{totalPages}</span>
            </span>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 单词详情弹窗 */}
      {selectedWord && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedWord(null)}
        >
          <div 
            className="rounded-3xl max-w-md w-full p-6 shadow-2xl"
            style={{ background: '#1e1e2e', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-white">{selectedWord.word}</h3>
                  <button 
                    onClick={(e) => playAudio(selectedWord.word, e)}
                    className="p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                    style={{ background: 'rgba(0, 240, 255, 0.1)' }}
                  >
                    <Volume2 className="w-5 h-5" style={{ color: '#00f0ff' }} />
                  </button>
                </div>
                <p className="text-sm mt-1" style={{ color: '#a0a0b0' }}>{selectedWord.phonetic}</p>
              </div>
              <button 
                onClick={() => setSelectedWord(null)}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <XCircle className="w-5 h-5" style={{ color: '#a0a0b0' }} />
              </button>
            </div>

            {/* 标签 */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}
              >
                {selectedWord.vocabulary_categories.name}
              </span>
              {selectedWord.userStatus?.isMastered && (
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#12121e' }}
                >
                  已掌握
                </span>
              )}
              {selectedWord.userStatus && (
                <>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88' }}
                  >
                    正确 {selectedWord.userStatus.correctCount}
                  </span>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(255, 107, 157, 0.1)', color: '#ff6b9d' }}
                  >
                    错误 {selectedWord.userStatus.wrongCount}
                  </span>
                </>
              )}
            </div>

            {/* 释义 */}
            <div className="mb-4">
              <p className="text-xs mb-2" style={{ color: '#a0a0b0' }}>释义</p>
              <p className="text-white leading-relaxed">{selectedWord.meaning}</p>
            </div>

            {/* 例句 */}
            {selectedWord.example_sentence && (
              <div className="mb-5">
                <p className="text-xs mb-2" style={{ color: '#a0a0b0' }}>例句</p>
                <div 
                  className="p-4 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <p className="text-white leading-relaxed">{selectedWord.example_sentence}</p>
                  {selectedWord.example_sentence_cn && (
                    <p className="text-sm mt-2" style={{ color: '#a0a0b0' }}>{selectedWord.example_sentence_cn}</p>
                  )}
                </div>
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-3">
              <Link href="/practice" className="flex-1">
                <button 
                  className="w-full h-11 rounded-xl text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
                >
                  开始练习
                </button>
              </Link>
              <button 
                onClick={() => setSelectedWord(null)}
                className="h-11 px-5 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
