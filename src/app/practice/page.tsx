'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, CheckCircle, XCircle, Volume2, BookmarkCheck, Sparkles, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Question {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  example_sentence: string;
  example_sentence_cn?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  mode: string;
}

// 本轮错误单词的连续正确计数
interface WrongWordStatus {
  wordId: number;
  consecutiveCorrect: number; // 需要连续对3次才算成功
  nextAppearAfter: number; // 下次出现在第几题之后
}

export default function PracticePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'wrong_words'>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [autoMasteredMessage, setAutoMasteredMessage] = useState('');
  const [remainingWords, setRemainingWords] = useState(0);
  
  // 无尽模式状态
  const [roundSuccessCount, setRoundSuccessCount] = useState(0); // 本轮成功数
  const [roundWrongCount, setRoundWrongCount] = useState(0); // 本轮错误数（首次错误）
  const [roundCorrectWords, setRoundCorrectWords] = useState<Set<number>>(new Set()); // 本轮已成功的词
  const [wrongWordsMap, setWrongWordsMap] = useState<Map<number, WrongWordStatus>>(new Map()); // 本轮错题及状态
  const [questionNumber, setQuestionNumber] = useState(0); // 当前题号（用于控制穿插间隔）
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finishMessage, setFinishMessage] = useState('');
  const [masteredThisRound, setMasteredThisRound] = useState<Set<number>>(new Set()); // 本轮标记掌握的词
  const [startTime, setStartTime] = useState<number>(0); // 开始时间

  // 使用 ref 确保在 nextQuestion 中访问最新状态
  const roundCorrectWordsRef = useRef(roundCorrectWords);
  const questionsRef = useRef(questions);
  const currentIndexRef = useRef(currentIndex);
  const isLoadingRef = useRef(isLoading);
  // 结算数据使用 ref 确保实时更新
  const questionNumberRef = useRef(questionNumber);
  const roundSuccessCountRef = useRef(roundSuccessCount);
  const roundWrongCountRef = useRef(roundWrongCount);
  const startTimeRef = useRef(startTime);

  // 更新 ref
  useEffect(() => {
    roundCorrectWordsRef.current = roundCorrectWords;
  }, [roundCorrectWords]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  useEffect(() => {
    questionNumberRef.current = questionNumber;
  }, [questionNumber]);
  useEffect(() => {
    roundSuccessCountRef.current = roundSuccessCount;
  }, [roundSuccessCount]);
  useEffect(() => {
    roundWrongCountRef.current = roundWrongCount;
  }, [roundWrongCount]);
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchCategories();
  }, [user, router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // 获取更多题目
  const fetchMoreQuestions = useCallback(async (excludeIds: number[] = [], priorityIds: number[] = []) => {
    if (!token || isLoading) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory);
      }
      if (selectedFilter === 'wrong_words') {
        params.append('filter', 'wrong_words');
      }
      params.append('limit', '15');
      if (excludeIds.length > 0) {
        params.append('excludeWordIds', excludeIds.join(','));
      }
      if (priorityIds.length > 0) {
        params.append('priorityWordIds', priorityIds.join(','));
      }

      const response = await fetch(`/api/practice?${params.toString()}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.message) {
        // 所有单词都掌握了或错题集清空
        setIsFinished(true);
        setFinishMessage(data.message);
        return;
      }
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(prev => [...prev, ...data.questions]);
        setRemainingWords(data.remainingWords || 0);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedCategory, selectedFilter, isLoading]);

  const startPractice = async () => {
    if (!token) return;
    
    // 重置所有状态
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setRoundSuccessCount(0);
    setRoundWrongCount(0);
    setRoundCorrectWords(new Set());
    setWrongWordsMap(new Map());
    setQuestionNumber(0);
    setIsFinished(false);
    setFinishMessage('');
    setMasteredThisRound(new Set());
    setIsStarted(true);
    setStartTime(Date.now()); // 记录开始时间
    
    // 获取第一批题目
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory);
      }
      if (selectedFilter === 'wrong_words') {
        params.append('filter', 'wrong_words');
      }
      params.append('limit', '15');

      const response = await fetch(`/api/practice?${params.toString()}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.message) {
        setIsFinished(true);
        setFinishMessage(data.message);
        return;
      }
      
      setQuestions(data.questions || []);
      setRemainingWords(data.remainingWords || 0);
    } catch (error) {
      console.error('Failed to start practice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitResult = async (wordId: number, isCorrect: boolean, markAsMastered: boolean = false, isRoundWrongWord: boolean = false) => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wordId,
          isCorrect,
          markAsMastered,
          isRoundWrongWord,
        }),
      });
      
      const data = await response.json();
      
      if (data.dailyCorrectCount === 4 && data.validCorrectRecorded) {
        setAutoMasteredMessage('连续4天答对，已掌握！');
        setTimeout(() => setAutoMasteredMessage(''), 2000);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to submit result:', error);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    const wordId = currentQuestion.id;

    // 更新本轮状态
    const wasWrongBefore = wrongWordsMap.has(wordId);
    const alreadyCounted = roundCorrectWordsRef.current.has(wordId);

    // 提交结果到后端
    const isRoundWrongWord = wasWrongBefore;
    await submitResult(wordId, isCorrect, false, isRoundWrongWord);
    
    if (isCorrect) {
      if (wasWrongBefore) {
        // 之前错过，现在对了
        const status = wrongWordsMap.get(wordId)!;
        const newConsecutive = status.consecutiveCorrect + 1;
        
        if (newConsecutive >= 3) {
          // 连续对3次，本轮成功！
          setWrongWordsMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(wordId);
            return newMap;
          });
          setRoundCorrectWords(prev => new Set(prev).add(wordId));
          // 只有未被计数时才增加（避免重复计数）
          if (!alreadyCounted) {
            setRoundSuccessCount(prev => prev + 1);
          }
        } else {
          // 更新连续正确次数
          setWrongWordsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(wordId, {
              ...status,
              consecutiveCorrect: newConsecutive,
              nextAppearAfter: questionNumber + Math.floor(Math.random() * 5) + 3, // 3-7题后出现
            });
            return newMap;
          });
        }
      } else {
        // 首次就对了，本轮成功！
        setRoundCorrectWords(prev => new Set(prev).add(wordId));
        // 只有未被计数时才增加（避免重复计数）
        if (!alreadyCounted) {
          setRoundSuccessCount(prev => prev + 1);
        }
      }
    } else {
      // 答错了
      if (!wasWrongBefore) {
        // 首次错误，记录本轮错误
        setRoundWrongCount(prev => prev + 1);
      }
      // 加入/更新错题列表
      setWrongWordsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(wordId, {
          wordId,
          consecutiveCorrect: 0,
          nextAppearAfter: questionNumber + Math.floor(Math.random() * 5) + 3, // 3-7题后出现
        });
        return newMap;
      });
    }
    
    setQuestionNumber(prev => prev + 1);
  };

  const handleMarkAsMastered = async (autoNext: boolean = false) => {
    const currentQuestion = questions[currentIndex];
    await submitResult(currentQuestion.id, true, true);
    
    // 检查是否已经被计入成功数（避免重复计数）
    const alreadyCounted = roundCorrectWordsRef.current.has(currentQuestion.id);
    
    setMasteredThisRound(prev => new Set(prev).add(currentQuestion.id));
    setRoundCorrectWords(prev => new Set(prev).add(currentQuestion.id));
    setWrongWordsMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(currentQuestion.id);
      return newMap;
    });
    
    // 只有未被计数时才增加
    if (!alreadyCounted) {
      setRoundSuccessCount(prev => prev + 1);
    }
    
    // 答题前标记掌握，自动跳到下一题
    if (autoNext) {
      setTimeout(() => {
        nextQuestion();
      }, 300);
    }
  };

  const nextQuestion = async () => {
    // 检查是否有需要出现的错题
    const wrongWordsToAppear = Array.from(wrongWordsMap.entries())
      .filter(([_, status]) => status.nextAppearAfter <= questionNumber)
      .map(([wordId]) => wordId);
    
    // 预加载更多题目
    if (currentIndexRef.current >= questionsRef.current.length - 5 && !isLoadingRef.current) {
      const excludeIds = Array.from(roundCorrectWordsRef.current);
      const priorityIds = wrongWordsToAppear.length > 0 ? wrongWordsToAppear : [];
      await fetchMoreQuestions(excludeIds, priorityIds);
    }
    
    // 找到下一个未被答对的题目（使用 ref 确保访问最新状态）
    const findNextValidIndex = (startIndex: number): number => {
      const currentQuestions = questionsRef.current;
      const currentCorrectWords = roundCorrectWordsRef.current;
      
      for (let i = startIndex + 1; i < currentQuestions.length; i++) {
        const wordId = currentQuestions[i].id;
        // 跳过本轮已成功的单词
        if (!currentCorrectWords.has(wordId)) {
          return i;
        }
      }
      return -1; // 没有找到有效的下一题
    };
    
    const nextIndex = findNextValidIndex(currentIndexRef.current);
    
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // 当前队列中没有有效题目了，需要加载更多
      if (isLoadingRef.current) {
        // 等待加载完成后再找
        const checkInterval = setInterval(() => {
          if (!isLoadingRef.current) {
            clearInterval(checkInterval);
            const newIndex = findNextValidIndex(currentIndexRef.current);
            if (newIndex !== -1) {
              setCurrentIndex(newIndex);
              setSelectedAnswer(null);
              setShowResult(false);
            }
          }
        }, 100);
      } else {
        // 主动触发加载
        const excludeIds = Array.from(roundCorrectWordsRef.current);
        const priorityIds = wrongWordsToAppear.length > 0 ? wrongWordsToAppear : [];
        await fetchMoreQuestions(excludeIds, priorityIds);
      }
    }
  };

  const exitPractice = () => {
    // 计算学习时长（使用 ref 获取最新值）
    const duration = startTimeRef.current > 0 ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    const totalPracticed = questionNumberRef.current;
    const masteredCount = roundSuccessCountRef.current;
    const wrongCount = roundWrongCountRef.current;
    
    // 构建结算数据
    const summary = {
      totalPracticed,
      masteredCount,
      wrongCount,
      correctCount: totalPracticed - wrongCount, // 首次正确数 = 总题数 - 首次错误数
      duration,
    };
    
    console.log('结算数据:', summary); // 调试日志
    
    // 保存到 sessionStorage（防止 URL 过长）
    sessionStorage.setItem('practice_summary', JSON.stringify(summary));
    
    // 跳转到结算页面
    router.push('/practice/summary');
  };

  const playAudio = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  if (!user) {
    return null;
  }

  // 开始前选择页面
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* 头部 */}
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b">
          <div className="container mx-auto px-3 py-3 flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">背单词</h1>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 container mx-auto px-3 py-4">
          <Card className="max-w-md mx-auto">
            <CardHeader className="p-4">
              <CardTitle className="text-base">练习设置</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">选择词库</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="选择词库" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部词库</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">练习模式</label>
                <Select value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as 'all' | 'wrong_words')}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="选择模式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">普通模式</SelectItem>
                    <SelectItem value="wrong_words">错题集（最近7天）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>无尽模式</strong><br/>
                  • 持续练习直到主动退出<br/>
                  • 首次正确即记为"本轮成功"<br/>
                  • 错误的词需连续对3次才算成功<br/>
                  • 错题会穿插出现在后续题目中<br/>
                  • 连续4次正确自动掌握
                </p>
              </div>

              <Button onClick={startPractice} className="w-full h-11">
                开始练习
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 完成页面（所有单词都掌握或错题集清空）
  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* 头部 */}
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b">
          <div className="container mx-auto px-3 py-3 flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">练习完成</h1>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 container mx-auto px-3 py-4">
          <Card className="max-w-md mx-auto">
            <CardHeader className="p-4 text-center">
              <div className="mx-auto w-14 h-14 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">{finishMessage}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{roundSuccessCount}</div>
                  <div className="text-xs text-gray-500">本轮成功</div>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-red-600">{roundWrongCount}</div>
                  <div className="text-xs text-gray-500">首次错误</div>
                </div>
              </div>

              <Button onClick={exitPractice} className="w-full h-10">
                查看结算
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 加载中
  if (questions.length === 0 || currentIndex >= questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isWrongWord = wrongWordsMap.has(currentQuestion.id);
  const wrongStatus = wrongWordsMap.get(currentQuestion.id);

  // 练习页面
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* 自动掌握提示 */}
      {autoMasteredMessage && (
        <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-1 text-sm">
            <Sparkles className="w-4 h-4" />
            {autoMasteredMessage}
          </div>
        </div>
      )}
      
      {/* 头部 */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={exitPractice}>
                <LogOut className="w-4 h-4 text-red-500" />
              </Button>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  第 {questionNumber + 1} 题
                </div>
                <div className="text-xs text-gray-500">
                  {currentQuestion.mode === 'en-to-zh' ? '英译中' : '中译英'}
                </div>
              </div>
            </div>
            <div className="text-sm flex items-center gap-2">
              <span className="text-green-600 font-semibold">成功 {roundSuccessCount}</span>
              <span className="text-gray-300">|</span>
              <span className="text-red-600 font-semibold">错误 {roundWrongCount}</span>
              {wrongWordsMap.size > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-orange-600">待复习 {wrongWordsMap.size}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 题目卡片 - 置顶在上半区 */}
        <div className="px-3 py-3">
          <Card className="max-w-md mx-auto border-0 shadow-sm">
            <CardHeader className="p-3 pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {currentQuestion.mode === 'en-to-zh' ? (
                    <div className="flex items-center gap-2">
                      {currentQuestion.question}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => playAudio(currentQuestion.question)}
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    currentQuestion.question
                  )}
                </CardTitle>
              </div>
              {currentQuestion.mode === 'en-to-zh' && (
                <p className="text-xs text-gray-500 mt-1">
                  {currentQuestion.phonetic}
                </p>
              )}
              {/* 错题标记 */}
              {isWrongWord && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    本轮错题 · 需连续对 {3 - (wrongStatus?.consecutiveCorrect || 0)} 次
                  </Badge>
                </div>
              )}
            </CardHeader>
          </Card>
        </div>

        {/* 中间空白区域 */}
        <div className="flex-1"></div>

        {/* 底部吸附区域 - 答题前显示选项，答题后显示答案解析 */}
        <div className="sticky bottom-0 z-20 px-3 py-2 pb-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md mx-auto space-y-2">
            {!showResult ? (
              /* 答题前：显示标记掌握 + 四个选项 */
              <>
                {/* 标记掌握按钮 */}
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-auto py-3 px-4 justify-start border-green-300 dark:border-green-700',
                    masteredThisRound.has(currentQuestion.id) && 'bg-green-50 dark:bg-green-900/30 border-green-500'
                  )}
                  onClick={() => handleMarkAsMastered(true)}
                  disabled={masteredThisRound.has(currentQuestion.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0 text-green-600">
                      <BookmarkCheck className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-left text-green-600 dark:text-green-400">
                      {masteredThisRound.has(currentQuestion.id) ? '已标记掌握' : '标记掌握'}
                    </span>
                  </div>
                </Button>

                {/* 四个选项 */}
                {currentQuestion.options.map((option, index) => {
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full h-auto py-3 px-4 justify-start"
                      onClick={() => handleAnswer(option)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1 text-left line-clamp-2">{option}</span>
                      </div>
                    </Button>
                  );
                })}
              </>
            ) : (
              /* 答题后：显示答案解析 + 标记掌握 + 下一题 */
              <>
                {/* 答案结果 */}
                <div className={cn(
                  "p-4 rounded-lg",
                  selectedAnswer === currentQuestion.correctAnswer 
                    ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800" 
                    : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedAnswer === currentQuestion.correctAnswer ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={cn(
                      "font-semibold",
                      selectedAnswer === currentQuestion.correctAnswer ? "text-green-600" : "text-red-600"
                    )}>
                      {selectedAnswer === currentQuestion.correctAnswer ? '回答正确' : '回答错误'}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-500">正确答案：</span><span className="font-medium">{currentQuestion.correctAnswer}</span></p>
                    {currentQuestion.mode === 'zh-to-en' && (
                      <p><span className="text-gray-500">音标：</span>{currentQuestion.phonetic}</p>
                    )}
                    {currentQuestion.example_sentence && (
                      <div className="mt-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                        <p className="text-gray-700 dark:text-gray-300">{currentQuestion.example_sentence}</p>
                        {currentQuestion.example_sentence_cn && (
                          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{currentQuestion.example_sentence_cn}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 标记掌握按钮（答题后 - 不自动跳） */}
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-auto py-3 px-4 justify-start border-green-300 dark:border-green-700',
                    masteredThisRound.has(currentQuestion.id) && 'bg-green-50 dark:bg-green-900/30 border-green-500'
                  )}
                  onClick={() => handleMarkAsMastered(false)}
                  disabled={masteredThisRound.has(currentQuestion.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0 text-green-600">
                      <BookmarkCheck className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-left text-green-600 dark:text-green-400">
                      {masteredThisRound.has(currentQuestion.id) ? '已标记掌握' : '标记掌握'}
                    </span>
                  </div>
                </Button>

                {/* 下一题按钮 */}
                <Button onClick={nextQuestion} className="w-full h-12 text-base">
                  下一题
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
