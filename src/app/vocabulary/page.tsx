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
import { Search, ArrowLeft, Volume2, ChevronLeft, ChevronRight, Check, X, User, LogIn, XCircle } from 'lucide-react';
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
  const [filter, setFilter] = useState('all'); // 'all', 'wrong_words'
  const [page, setPage] = useState(1);
  const pageSize = 30;

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* 固定头部 */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="container mx-auto px-3 py-3">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">单词库</h1>
              <Badge variant="secondary" className="text-xs">
                {data?.total || 0} 词
              </Badge>
            </div>
            
            {user ? (
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                <User className="w-4 h-4" />
                <span className="max-w-20 truncate">{user.nickname}</span>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <LogIn className="w-3 h-3 mr-1" />
                  登录
                </Button>
              </Link>
            )}
          </div>

          {/* 统计栏 - 仅登录用户显示 */}
          {user && data?.stats && (
            <div className="flex items-center gap-4 text-xs mb-3 text-gray-600 dark:text-gray-400">
              <span>总计 <strong className="text-blue-600 dark:text-blue-400">{data.stats.totalWords}</strong></span>
              <span>已掌握 <strong className="text-green-600 dark:text-green-400">{data.stats.masteredWords}</strong></span>
              <span>未掌握 <strong className="text-orange-600 dark:text-orange-400">{data.stats.unmasteredWords}</strong></span>
            </div>
          )}

          {/* 筛选栏 */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索单词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-24 h-9 text-xs">
                <SelectValue placeholder="词库" />
              </SelectTrigger>
              <SelectContent>
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
                  <SelectTrigger className="w-20 h-9 text-xs">
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="wrong_words">错题集</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={masteredStatus} onValueChange={setMasteredStatus}>
                  <SelectTrigger className="w-20 h-9 text-xs">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
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
      <div className="flex-1 container mx-auto px-3 py-2">
        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {data?.words.map((word) => (
              <div 
                key={word.id} 
                className={cn(
                  "flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors",
                  word.userStatus?.isMastered && "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                )}
                onClick={() => setSelectedWord(word)}
              >
                {/* 单词 */}
                <div className="flex-shrink-0 w-24">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{word.word}</span>
                    <button 
                      onClick={(e) => playAudio(word.word, e)}
                      className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <Volume2 className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{word.phonetic}</p>
                </div>

                {/* 释义 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{word.meaning}</p>
                </div>

                {/* 状态标签 */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                    {word.vocabulary_categories.name}
                  </Badge>
                  {word.userStatus?.isMastered ? (
                    <Badge className="text-xs px-1.5 py-0 h-5 bg-green-500">
                      <Check className="w-3 h-3 mr-0.5" />
                      掌握
                    </Badge>
                  ) : word.userStatus && word.userStatus.dailyCorrectCount > 0 ? (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-blue-400 text-blue-600 dark:text-blue-400">
                      {word.userStatus.dailyCorrectCount}/4天
                    </Badge>
                  ) : null}
                  {word.userStatus && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                      <span className="text-green-600 dark:text-green-400">{word.userStatus.correctCount}</span>
                      <span className="text-gray-400 mx-0.5">/</span>
                      <span className="text-red-600 dark:text-red-400">{word.userStatus.wrongCount}</span>
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && data?.words.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">没有找到匹配的单词</p>
          </div>
        )}
      </div>

      {/* 固定底部分页 */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-800 border-t">
          <div className="container mx-auto px-3 py-2 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-20 text-center">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 单词详情弹窗 */}
      {selectedWord && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedWord(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-5 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedWord.word}</h3>
                  <button 
                    onClick={(e) => playAudio(selectedWord.word, e)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <Volume2 className="w-5 h-5 text-blue-500" />
                  </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400">{selectedWord.phonetic}</p>
              </div>
              <button 
                onClick={() => setSelectedWord(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* 标签 */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">{selectedWord.vocabulary_categories.name}</Badge>
              {selectedWord.userStatus?.isMastered && (
                <Badge className="bg-green-500">已掌握</Badge>
              )}
              {selectedWord.userStatus && (
                <>
                  <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-600">
                    正确 {selectedWord.userStatus.correctCount}
                  </Badge>
                  <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600">
                    错误 {selectedWord.userStatus.wrongCount}
                  </Badge>
                </>
              )}
            </div>

            {/* 释义 */}
            <div className="mb-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">释义</p>
              <p className="text-gray-900 dark:text-white">{selectedWord.meaning}</p>
            </div>

            {/* 例句 */}
            {selectedWord.example_sentence && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">例句</p>
                <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="text-gray-700 dark:text-gray-300">{selectedWord.example_sentence}</p>
                  {selectedWord.example_sentence_cn && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{selectedWord.example_sentence_cn}</p>
                  )}
                </div>
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-2">
              <Link href="/practice" className="flex-1">
                <Button className="w-full">开始练习</Button>
              </Link>
              <Button variant="outline" onClick={() => setSelectedWord(null)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
