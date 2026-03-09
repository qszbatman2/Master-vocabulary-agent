'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ArrowLeft, Volume2, ChevronLeft, ChevronRight, BookmarkCheck, User, LogIn } from 'lucide-react';
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
  category_id: number;
  vocabulary_categories: {
    name: string;
  };
  userStatus?: {
    isMastered: boolean;
    consecutiveCorrect: number;
    totalPracticeCount: number;
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
  const [page, setPage] = useState(1);
  const pageSize = 50;

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
  }, [selectedCategory, searchQuery, masteredStatus, page, token]);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  // 重置页码当筛选条件变化时
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery, masteredStatus]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const playAudio = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">单词库</h1>
              <p className="text-gray-600 dark:text-gray-300">浏览所有词汇，点击单词查看详情</p>
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <User className="w-5 h-5" />
              <span>{user.nickname}</span>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline">
                <LogIn className="w-4 h-4 mr-2" />
                登录查看进度
              </Button>
            </Link>
          )}
        </div>

        {/* 统计卡片 */}
        {user && data?.stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {data.stats.totalWords.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">总单词数</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.stats.masteredWords.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">已掌握</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {data.stats.unmasteredWords.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">未掌握</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 筛选栏 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="搜索单词或释义..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="选择词库" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部词库</SelectItem>
              {data?.categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {user && (
            <Select value={masteredStatus} onValueChange={setMasteredStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="掌握状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="mastered">已掌握</SelectItem>
                <SelectItem value="unmastered">未掌握</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 分页信息 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 dark:text-gray-300">
            共 <span className="font-bold text-blue-600 dark:text-blue-400">{data?.total || 0}</span> 个单词
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 单词列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.words.map((word) => (
            <Card 
              key={word.id} 
              className={cn(
                "cursor-pointer hover:shadow-lg transition-shadow",
                word.userStatus?.isMastered && "border-green-500"
              )}
              onClick={() => setSelectedWord(word)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {word.word}
                      {word.userStatus?.isMastered && (
                        <BookmarkCheck className="w-4 h-4 text-green-500" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {word.phonetic}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(word.word);
                    }}
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">
                    {word.vocabulary_categories.name}
                  </Badge>
                  {word.userStatus && (
                    <Badge variant="outline" className="text-xs">
                      练习{word.userStatus.totalPracticeCount}次
                    </Badge>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                  {word.meaning}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 空状态 */}
        {data?.words.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">没有找到匹配的单词</p>
          </div>
        )}

        {/* 分页控制（底部） */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一页
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
              第 {page} 页 / 共 {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              下一页
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* 单词详情弹窗 */}
        {selectedWord && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedWord(null)}
          >
            <Card 
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl flex items-center gap-2">
                      {selectedWord.word}
                      {selectedWord.userStatus?.isMastered && (
                        <Badge className="bg-green-500">已掌握</Badge>
                      )}
                    </CardTitle>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
                      {selectedWord.phonetic}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => playAudio(selectedWord.word)}
                  >
                    <Volume2 className="w-6 h-6" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {selectedWord.vocabulary_categories.name}
                  </Badge>
                  {selectedWord.userStatus && (
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        练习次数: {selectedWord.userStatus.totalPracticeCount}
                      </Badge>
                      <Badge variant="outline">
                        连续正确: {selectedWord.userStatus.consecutiveCorrect}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">释义</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-lg">
                    {selectedWord.meaning}
                  </p>
                </div>
                {selectedWord.example_sentence && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">例句</h3>
                    <p className="text-gray-600 dark:text-gray-400 italic">
                      {selectedWord.example_sentence}
                    </p>
                  </div>
                )}
                <Button 
                  className="w-full" 
                  onClick={() => setSelectedWord(null)}
                >
                  关闭
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
