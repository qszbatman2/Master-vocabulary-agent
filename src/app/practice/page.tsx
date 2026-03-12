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
import { ArrowLeft, CheckCircle, XCircle, Volume2, BookmarkCheck, Sparkles, LogOut, RefreshCw, AlertCircle, Moon, Sun } from 'lucide-react';
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
  const [isDark, setIsDark] = useState(false);
  
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

  // 深浅模式检测
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

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
      <div className={cn(
        "min-h-screen flex flex-col relative overflow-hidden",
        isDark ? "bg-[#121212]" : "bg-gradient-to-br from-pink-50 via-white to-cyan-50"
      )}>
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            "absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-20",
            isDark ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20" : "bg-gradient-to-br from-pink-200 to-cyan-200"
          )} />
        </div>
        
        {/* 头部 */}
        <div className={cn(
          "sticky top-0 z-20 border-b",
          isDark ? "bg-[#1E1E1E]/95 backdrop-blur-sm border-[#2A2A2A]" : "bg-white/80 backdrop-blur-sm border-gray-100"
        )}>
          <div className="container mx-auto px-3 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <button className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isDark ? "bg-[#2A2A2A] hover:bg-[#333]" : "bg-gray-100 hover:bg-gray-200"
                )}>
                  <ArrowLeft className={cn("w-4 h-4", isDark ? "text-white" : "text-gray-600")} />
                </button>
              </Link>
              <h1 className={cn(
                "text-lg font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>背单词</h1>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isDark 
                  ? "bg-[#1E1E1E] hover:bg-[#2A2A2A]" 
                  : "bg-white shadow-md hover:shadow-lg"
              )}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-[#00E5FF]" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 container mx-auto px-3 py-4 relative z-10">
          <div className={cn(
            "max-w-md mx-auto p-5 rounded-2xl",
            isDark ? "bg-[#1E1E1E] neon-border" : "bg-white shadow-xl"
          )}>
            <div className="space-y-4">
              <div>
                <label className={cn(
                  "text-sm font-medium mb-2 block",
                  isDark ? "text-gray-300" : "text-gray-700"
                )}>选择词库</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className={cn(
                    "h-11 rounded-xl",
                    isDark && "bg-[#2A2A2A] border-[#333]"
                  )}>
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
                <label className={cn(
                  "text-sm font-medium mb-2 block",
                  isDark ? "text-gray-300" : "text-gray-700"
                )}>练习模式</label>
                <Select value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as 'all' | 'wrong_words')}>
                  <SelectTrigger className={cn(
                    "h-11 rounded-xl",
                    isDark && "bg-[#2A2A2A] border-[#333]"
                  )}>
                    <SelectValue placeholder="选择模式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">普通模式</SelectItem>
                    <SelectItem value="wrong_words">错题集（最近7天）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={cn(
                "p-4 rounded-xl",
                isDark ? "bg-[#00E5FF]/10" : "bg-cyan-50"
              )}>
                <p className={cn(
                  "text-xs",
                  isDark ? "text-cyan-300" : "text-cyan-800"
                )}>
                  <strong>无尽模式</strong><br/>
                  • 持续练习直到主动退出<br/>
                  • 首次正确即记为"本轮成功"<br/>
                  • 错误的词需连续对3次才算成功<br/>
                  • 错题会穿插出现在后续题目中<br/>
                  • 连续4天答对自动掌握
                </p>
              </div>

              <button
                onClick={startPractice}
                className="w-full py-4 rounded-xl bg-[#00E5FF] text-black font-medium text-base neon-glow hover:neon-glow-strong transition-all"
              >
                开始练习
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 完成页面（所有单词都掌握或错题集清空）
  if (isFinished) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col relative overflow-hidden",
        isDark ? "bg-[#121212]" : "bg-gradient-to-br from-pink-50 via-white to-cyan-50"
      )}>
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            "absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-20",
            isDark ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20" : "bg-gradient-to-br from-pink-200 to-cyan-200"
          )} />
        </div>
        
        {/* 头部 */}
        <div className={cn(
          "sticky top-0 z-20 border-b",
          isDark ? "bg-[#1E1E1E] border-[#2A2A2A]" : "bg-white/80 backdrop-blur-sm border-gray-100"
        )}>
          <div className="container mx-auto px-3 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <button className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isDark ? "bg-[#2A2A2A] hover:bg-[#333]" : "bg-gray-100 hover:bg-gray-200"
                )}>
                  <ArrowLeft className={cn("w-4 h-4", isDark ? "text-white" : "text-gray-600")} />
                </button>
              </Link>
              <h1 className={cn(
                "text-lg font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>练习完成</h1>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isDark 
                  ? "bg-[#1E1E1E] hover:bg-[#2A2A2A]" 
                  : "bg-white shadow-md hover:shadow-lg"
              )}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-[#00E5FF]" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 container mx-auto px-3 py-4 relative z-10">
          <div className={cn(
            "max-w-md mx-auto p-6 rounded-2xl text-center",
            isDark ? "bg-[#1E1E1E] neon-border" : "bg-white shadow-xl"
          )}>
            <div className={cn(
              "mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3",
              isDark ? "bg-green-500/20" : "bg-green-100"
            )}>
              <Sparkles className={cn(
                "w-7 h-7",
                isDark ? "text-green-400" : "text-green-600"
              )} />
            </div>
            <h2 className={cn(
              "text-lg font-bold mb-4",
              isDark ? "text-white" : "text-gray-900"
            )}>{finishMessage}</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={cn(
                "p-3 rounded-xl",
                isDark ? "bg-[#2A2A2A]" : "bg-gray-50"
              )}>
                <div className="text-xl font-bold text-green-500">{roundSuccessCount}</div>
                <div className={cn(
                  "text-xs",
                  isDark ? "text-gray-500" : "text-gray-500"
                )}>本轮成功</div>
              </div>
              <div className={cn(
                "p-3 rounded-xl",
                isDark ? "bg-[#2A2A2A]" : "bg-gray-50"
              )}>
                <div className="text-xl font-bold text-red-500">{roundWrongCount}</div>
                <div className={cn(
                  "text-xs",
                  isDark ? "text-gray-500" : "text-gray-500"
                )}>首次错误</div>
              </div>
            </div>
            <button
              onClick={exitPractice}
              className="w-full py-3 rounded-xl bg-[#00E5FF] text-black font-medium neon-glow hover:neon-glow-strong transition-all"
            >
              查看结算
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 加载中
  if (questions.length === 0 || currentIndex >= questions.length) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDark ? "bg-[#121212]" : "bg-gradient-to-br from-pink-50 via-white to-cyan-50"
      )}>
        <div className="text-center">
          <RefreshCw className={cn(
            "w-8 h-8 animate-spin mx-auto",
            "text-[#00E5FF]"
          )} />
          <p className={cn(
            "mt-2",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>加载中...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isWrongWord = wrongWordsMap.has(currentQuestion.id);
  const wrongStatus = wrongWordsMap.get(currentQuestion.id);

  // 练习页面
  return (
    <div className={cn(
      "min-h-screen flex flex-col relative overflow-hidden",
      isDark ? "bg-[#121212]" : "bg-gradient-to-br from-pink-50 via-white to-cyan-50"
    )}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-20",
          isDark ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20" : "bg-gradient-to-br from-pink-200 to-cyan-200"
        )} />
      </div>
      
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
      <div className={cn(
        "sticky top-0 z-20 border-b",
        isDark ? "bg-[#1E1E1E]/95 backdrop-blur-sm border-[#2A2A2A]" : "bg-white/80 backdrop-blur-sm border-gray-100"
      )}>
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={exitPractice}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isDark ? "bg-red-500/20 hover:bg-red-500/30" : "bg-red-50 hover:bg-red-100"
                )}
              >
                <LogOut className="w-4 h-4 text-red-500" />
              </button>
              <div>
                <div className={cn(
                  "text-sm font-bold",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  第 <span className="text-[#00E5FF]">{questionNumber + 1}</span> 题
                </div>
                <div className={cn(
                  "text-xs",
                  isDark ? "text-gray-500" : "text-gray-500"
                )}>
                  {currentQuestion.mode === 'en-to-zh' ? '英译中' : '中译英'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isDark ? "bg-[#2A2A2A] hover:bg-[#333]" : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-[#00E5FF]" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-600" />
                )}
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500 font-semibold">✓{roundSuccessCount}</span>
                <span className={isDark ? "text-gray-600" : "text-gray-300"}>|</span>
                <span className="text-red-500 font-semibold">✗{roundWrongCount}</span>
                {wrongWordsMap.size > 0 && (
                  <>
                    <span className={isDark ? "text-gray-600" : "text-gray-300"}>|</span>
                    <span className="text-orange-500">待复习 {wrongWordsMap.size}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 题目卡片 - 置顶在上半区 */}
        <div className="px-3 py-4">
          <div className={cn(
            "max-w-md mx-auto p-4 rounded-2xl",
            isDark ? "bg-[#1E1E1E] neon-border" : "bg-white shadow-lg"
          )}>
            <div className="text-center">
              {currentQuestion.mode === 'en-to-zh' ? (
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className={cn(
                      "text-3xl font-bold",
                      isDark ? "text-white neon-text" : "text-gray-900"
                    )}>
                      {currentQuestion.question}
                    </span>
                    <button
                      onClick={() => playAudio(currentQuestion.question)}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isDark 
                          ? "bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 neon-glow" 
                          : "bg-cyan-50 hover:bg-cyan-100"
                      )}
                    >
                      <Volume2 className="w-5 h-5 text-[#00E5FF]" />
                    </button>
                  </div>
                  <p className={cn(
                    "text-sm",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}>
                    {currentQuestion.phonetic}
                  </p>
                </div>
              ) : (
                <div className={cn(
                  "text-xl font-medium",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {currentQuestion.question}
                </div>
              )}
              
              {/* 错题标记 */}
              {isWrongWord && (
                <div className="mt-3 flex justify-center">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs",
                    isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-600"
                  )}>
                    <AlertCircle className="w-3 h-3" />
                    本轮错题 · 需连续对 {3 - (wrongStatus?.consecutiveCorrect || 0)} 次
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 中间空白区域 */}
        <div className="flex-1"></div>

        {/* 底部吸附区域 - 答题前显示选项，答题后显示答案解析 */}
        <div className={cn(
          "sticky bottom-0 z-20 px-3 py-3 pb-6",
          isDark ? "bg-[#121212]/95 backdrop-blur-sm" : "bg-white/80 backdrop-blur-sm"
        )}>
          <div className="max-w-md mx-auto space-y-2">
            {!showResult ? (
              /* 答题前：显示标记掌握 + 四个选项 */
              <>
                {/* 标记掌握按钮 */}
                <button
                  onClick={() => handleMarkAsMastered(true)}
                  disabled={masteredThisRound.has(currentQuestion.id)}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl flex items-center gap-3 transition-all",
                    masteredThisRound.has(currentQuestion.id)
                      ? isDark 
                        ? "bg-green-500/20 border border-green-500/50" 
                        : "bg-green-50 border border-green-200"
                      : isDark
                        ? "bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2A2A2A]"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                    masteredThisRound.has(currentQuestion.id)
                      ? "bg-green-500 text-white"
                      : isDark ? "bg-[#2A2A2A]" : "bg-white"
                  )}>
                    <BookmarkCheck className={cn(
                      "w-4 h-4",
                      masteredThisRound.has(currentQuestion.id) 
                        ? "text-white" 
                        : "text-green-500"
                    )} />
                  </div>
                  <span className={cn(
                    "flex-1 text-left text-sm",
                    masteredThisRound.has(currentQuestion.id)
                      ? "text-green-500"
                      : isDark ? "text-gray-400" : "text-gray-600"
                  )}>
                    {masteredThisRound.has(currentQuestion.id) ? '已标记掌握' : '标记掌握'}
                  </span>
                </button>

                {/* 四个选项 */}
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl flex items-center gap-3 transition-all",
                      isDark 
                        ? "bg-[#1E1E1E] hover:bg-[#00E5FF]/10 hover:neon-border" 
                        : "bg-white shadow-sm hover:shadow-md border border-gray-100 hover:border-[#00E5FF]"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
                      isDark ? "bg-[#00E5FF]/20 text-[#00E5FF]" : "bg-cyan-50 text-cyan-600"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className={cn(
                      "flex-1 text-left text-sm line-clamp-2",
                      isDark ? "text-white" : "text-gray-900"
                    )}>{option}</span>
                  </button>
                ))}
              </>
            ) : (
              /* 答题后：显示答案解析 + 标记掌握 + 下一题 */
              <>
                {/* 答案结果 */}
                <div className={cn(
                  "p-4 rounded-xl",
                  selectedAnswer === currentQuestion.correctAnswer 
                    ? isDark
                      ? "bg-green-500/20 border border-green-500/50"
                      : "bg-green-50 border border-green-200"
                    : isDark
                      ? "bg-red-500/20 border border-red-500/50"
                      : "bg-red-50 border border-red-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedAnswer === currentQuestion.correctAnswer ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={cn(
                      "font-semibold",
                      selectedAnswer === currentQuestion.correctAnswer ? "text-green-500" : "text-red-500"
                    )}>
                      {selectedAnswer === currentQuestion.correctAnswer ? '回答正确' : '回答错误'}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                      <span className={isDark ? "text-gray-500" : "text-gray-500"}>正确答案：</span>
                      <span className="font-medium">{currentQuestion.correctAnswer}</span>
                    </p>
                    {currentQuestion.mode === 'zh-to-en' && (
                      <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                        <span className={isDark ? "text-gray-500" : "text-gray-500"}>音标：</span>
                        {currentQuestion.phonetic}
                      </p>
                    )}
                    {currentQuestion.example_sentence && (
                      <div className={cn(
                        "mt-2 p-2 rounded-lg",
                        isDark ? "bg-white/5" : "bg-white/50"
                      )}>
                        <p className={isDark ? "text-gray-300" : "text-gray-700"}>{currentQuestion.example_sentence}</p>
                        {currentQuestion.example_sentence_cn && (
                          <p className={cn(
                            "text-xs mt-1",
                            isDark ? "text-gray-500" : "text-gray-500"
                          )}>{currentQuestion.example_sentence_cn}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 标记掌握按钮（答题后 - 不自动跳） */}
                <button
                  onClick={() => handleMarkAsMastered(false)}
                  disabled={masteredThisRound.has(currentQuestion.id)}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl flex items-center gap-3 transition-all",
                    masteredThisRound.has(currentQuestion.id)
                      ? isDark 
                        ? "bg-green-500/20 border border-green-500/50" 
                        : "bg-green-50 border border-green-200"
                      : isDark
                        ? "bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2A2A2A]"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                    masteredThisRound.has(currentQuestion.id)
                      ? "bg-green-500 text-white"
                      : isDark ? "bg-[#2A2A2A]" : "bg-white"
                  )}>
                    <BookmarkCheck className={cn(
                      "w-4 h-4",
                      masteredThisRound.has(currentQuestion.id) 
                        ? "text-white" 
                        : "text-green-500"
                    )} />
                  </div>
                  <span className={cn(
                    "flex-1 text-left text-sm",
                    masteredThisRound.has(currentQuestion.id)
                      ? "text-green-500"
                      : isDark ? "text-gray-400" : "text-gray-600"
                  )}>
                    {masteredThisRound.has(currentQuestion.id) ? '已标记掌握' : '标记掌握'}
                  </span>
                </button>

                {/* 下一题按钮 */}
                <button
                  onClick={nextQuestion}
                  className="w-full py-4 rounded-xl bg-[#00E5FF] text-black font-medium text-base neon-glow hover:neon-glow-strong transition-all"
                >
                  下一题
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
