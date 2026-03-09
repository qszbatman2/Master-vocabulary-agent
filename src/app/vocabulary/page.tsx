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
import { Search, ArrowLeft, Volume2 } from 'lucide-react';
import Link from 'next/link';

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
}

interface VocabularyResponse {
  categories: Category[];
  words: Word[];
}

export default function VocabularyPage() {
  const [data, setData] = useState<VocabularyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

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

      const response = await fetch(`/api/vocabulary?${params.toString()}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

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

  if (loading) {
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
        <div className="flex items-center gap-4 mb-8">
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
        </div>

        {/* 统计信息 */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            共找到 <span className="font-bold text-blue-600 dark:text-blue-400">{data?.words.length || 0}</span> 个单词
          </p>
        </div>

        {/* 单词列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.words.map((word) => (
            <Card 
              key={word.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedWord(word)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{word.word}</CardTitle>
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
                <Badge variant="secondary" className="mb-2">
                  {word.vocabulary_categories.name}
                </Badge>
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
                    <CardTitle className="text-3xl">{selectedWord.word}</CardTitle>
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
