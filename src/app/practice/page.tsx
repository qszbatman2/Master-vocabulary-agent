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
import { ArrowLeft, CheckCircle, XCircle, Volume2, BookmarkCheck, Sparkles, LogOut, RefreshCw, AlertCircle, GraduationCap, Play, FileText } from 'lucide-react';
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
  has_user_context?: boolean;
  question: string;
  options: string[];
  correctAnswer: string;
  mode: string;
}

interface WrongWordStatus {
  wordId: number;
  consecutiveCorrect: number;
  nextAppearAfter: number;
}

export default function PracticePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'wrong_words' | 'collected'>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [autoMasteredMessage, setAutoMasteredMessage] = useState('');
  const [remainingWords, setRemainingWords] = useState(0);
  
  const [roundSuccessCount, setRoundSuccessCount] = useState(0);
  const [roundWrongCount, setRoundWrongCount] = useState(0);
  const [roundCorrectWords, setRoundCorrectWords] = useState<Set<number>>(new Set());
  const [wrongWordsMap, setWrongWordsMap] = useState<Map<number, WrongWordStatus>>(new Map());
  const [questionNumber, setQuestionNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finishMessage, setFinishMessage] = useState('');
  const [masteredThisRound, setMasteredThisRound] = useState<Set<number>>(new Set());
  const [startTime, setStartTime] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dailyProgress, setDailyProgress] = useState<{ completed: number; goal: number } | null>(null);
  const [progressAnimated, setProgressAnimated] = useState(false);
  
  // 今日累计进度（从数据库读取）
  const [todayStats, setTodayStats] = useState<{
    totalPracticed: number;
    correctCount: number;
    wrongCount: number;
    masteredCount: number;
    wrongWordIds: number[];
    durationSeconds: number;
  } | null>(null);

  // 高亮例句中的收录词
  const highlightWordInSentence = (sentence: string, word: string) => {
    if (!sentence || !word) return sentence;
    // 创建正则表达式，匹配单词（不区分大小写，单词边界）
    const regex = new RegExp(`(\\b${word}\\b)`, 'gi');
    const parts = sentence.split(regex);
    return parts.map((part, index) => {
      if (part.toLowerCase() === word.toLowerCase()) {
        // 收录词：白色加粗
        return <strong key={index} className="font-bold text-white">{part}</strong>;
      }
      // 其他文字：灰色
      return <span key={index} style={{ color: '#a0a0b0' }}>{part}</span>;
    });
  };

  const roundCorrectWordsRef = useRef(roundCorrectWords);
  const questionsRef = useRef(questions);
  const currentIndexRef = useRef(currentIndex);
  const isLoadingRef = useRef(isLoading);
  const questionNumberRef = useRef(questionNumber);
  const roundSuccessCountRef = useRef(roundSuccessCount);
  const roundWrongCountRef = useRef(roundWrongCount);
  const startTimeRef = useRef(startTime);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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

  const fetchDailyProgress = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/daily-progress', {
        headers: { authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDailyProgress({ completed: data.completed, goal: data.dailyGoal });
      }
    } catch (error) {
      console.error('Failed to fetch daily progress:', error);
    }
  };

  // 获取今日累计进度
  const fetchTodayStats = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/daily-practice', {
        headers: { authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.today) {
          setTodayStats({
            totalPracticed: data.today.totalPracticed,
            correctCount: data.today.correctCount,
            wrongCount: data.today.wrongCount,
            masteredCount: data.today.masteredCount,
            wrongWordIds: data.today.wrongWordIds || [],
            durationSeconds: data.today.durationSeconds,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch today stats:', error);
    }
  };

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
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.message) {
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
    setStartTime(Date.now());
    
    // 获取今日进度
    fetchDailyProgress();
    
    // 获取今日累计进度
    fetchTodayStats();
    
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
        headers: { authorization: `Bearer ${token}` },
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
        body: JSON.stringify({ wordId, isCorrect, markAsMastered, isRoundWrongWord }),
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

    const wasWrongBefore = wrongWordsMap.has(wordId);
    const alreadyCounted = roundCorrectWordsRef.current.has(wordId);

    const result = await submitResult(wordId, isCorrect, false, wasWrongBefore);
    
    // 更新今日进度条
    if (result?.validCorrectRecorded) {
      setDailyProgress(prev => prev ? { ...prev, completed: prev.completed + 1 } : prev);
      setProgressAnimated(true);
      setTimeout(() => setProgressAnimated(false), 500);
    }
    
    if (isCorrect) {
      if (wasWrongBefore) {
        const status = wrongWordsMap.get(wordId)!;
        const newConsecutive = status.consecutiveCorrect + 1;
        
        if (newConsecutive >= 3) {
          setWrongWordsMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(wordId);
            return newMap;
          });
          setRoundCorrectWords(prev => new Set(prev).add(wordId));
          if (!alreadyCounted) {
            setRoundSuccessCount(prev => prev + 1);
          }
        } else {
          setWrongWordsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(wordId, {
              ...status,
              consecutiveCorrect: newConsecutive,
              nextAppearAfter: questionNumber + Math.floor(Math.random() * 5) + 3,
            });
            return newMap;
          });
        }
      } else {
        setRoundCorrectWords(prev => new Set(prev).add(wordId));
        if (!alreadyCounted) {
          setRoundSuccessCount(prev => prev + 1);
        }
      }
    } else {
      if (!wasWrongBefore) {
        setRoundWrongCount(prev => prev + 1);
      }
      setWrongWordsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(wordId, {
          wordId,
          consecutiveCorrect: 0,
          nextAppearAfter: questionNumber + Math.floor(Math.random() * 5) + 3,
        });
        return newMap;
      });
    }
    
    setQuestionNumber(prev => prev + 1);
  };

  const handleMarkAsMastered = async (autoNext: boolean = false) => {
    const currentQuestion = questions[currentIndex];
    await submitResult(currentQuestion.id, true, true);
    
    const alreadyCounted = roundCorrectWordsRef.current.has(currentQuestion.id);
    
    setMasteredThisRound(prev => new Set(prev).add(currentQuestion.id));
    setRoundCorrectWords(prev => new Set(prev).add(currentQuestion.id));
    setWrongWordsMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(currentQuestion.id);
      return newMap;
    });
    
    if (!alreadyCounted) {
      setRoundSuccessCount(prev => prev + 1);
    }
    
    if (autoNext) {
      setTimeout(() => nextQuestion(), 300);
    }
  };

  const nextQuestion = async () => {
    const wrongWordsToAppear = Array.from(wrongWordsMap.entries())
      .filter(([_, status]) => status.nextAppearAfter <= questionNumber)
      .map(([wordId]) => wordId);
    
    if (currentIndexRef.current >= questionsRef.current.length - 5 && !isLoadingRef.current) {
      const excludeIds = Array.from(roundCorrectWordsRef.current);
      const priorityIds = wrongWordsToAppear.length > 0 ? wrongWordsToAppear : [];
      await fetchMoreQuestions(excludeIds, priorityIds);
    }
    
    const findNextValidIndex = (startIndex: number): number => {
      const currentQuestions = questionsRef.current;
      const currentCorrectWords = roundCorrectWordsRef.current;
      
      for (let i = startIndex + 1; i < currentQuestions.length; i++) {
        const wordId = currentQuestions[i].id;
        if (!currentCorrectWords.has(wordId)) {
          return i;
        }
      }
      return -1;
    };
    
    const nextIndex = findNextValidIndex(currentIndexRef.current);
    
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      if (isLoadingRef.current) {
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
        const excludeIds = Array.from(roundCorrectWordsRef.current);
        const priorityIds = wrongWordsToAppear.length > 0 ? wrongWordsToAppear : [];
        await fetchMoreQuestions(excludeIds, priorityIds);
      }
    }
  };

  const exitPractice = async () => {
    // 计算本轮数据
    const duration = startTimeRef.current > 0 ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    const roundStats = {
      totalPracticed: questionNumberRef.current,
      masteredCount: roundSuccessCountRef.current,
      wrongCount: roundWrongCountRef.current,
      correctCount: questionNumberRef.current - roundWrongCountRef.current,
      duration,
    };
    
    // 保存本轮数据到 sessionStorage
    sessionStorage.setItem('practice_round_stats', JSON.stringify(roundStats));
    
    // 更新今日练习时长到数据库
    if (token && duration > 0) {
      try {
        await fetch('/api/daily-practice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'update_duration',
            durationIncrement: duration,
          }),
        });
      } catch (e) {
        console.error('更新时长失败:', e);
      }
    }
    
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
      <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#12121e' }}>
        {/* 背景网格纹理 */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* 背景渐变光晕 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
            style={{ background: 'linear-gradient(135deg, #00f0ff, #7c4dff)', opacity: 0.2, animationDuration: '4s' }}
          />
        </div>

        {/* 头部 */}
        <div 
          className="sticky top-0 z-20 border-b backdrop-blur-xl transition-all duration-700"
          style={{ background: 'rgba(30, 30, 46, 0.9)', borderColor: 'rgba(255,255,255,0.05)', opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)' }}
        >
          <div className="container mx-auto px-4 py-4 max-w-2xl flex items-center gap-3">
            <Link href="/">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95" style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00f0ff, #7c4dff)' }}>
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">背单词</h1>
            </div>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 container mx-auto px-4 py-6 max-w-md">
          <div 
            className="rounded-3xl p-6 transition-all duration-700 delay-100"
            style={{ background: '#1e1e2e', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)', opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)' }}
          >
            <h2 className="text-lg font-semibold text-white mb-5">练习设置</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm mb-2 block" style={{ color: '#a0a0b0' }}>选择词库</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 rounded-xl border-0" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                    <SelectValue placeholder="选择词库" />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#1e1e2e', border: 'none' }}>
                    <SelectItem value="all" className="text-white hover:bg-white/10 focus:bg-white/10">全部词库</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()} className="text-white hover:bg-white/10 focus:bg-white/10">{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm mb-2 block" style={{ color: '#a0a0b0' }}>练习模式</label>
                <Select value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as 'all' | 'wrong_words' | 'collected')}>
                  <SelectTrigger className="h-11 rounded-xl border-0" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                    <SelectValue placeholder="选择模式" />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#1e1e2e', border: 'none' }}>
                    <SelectItem value="all" className="text-white hover:bg-white/10 focus:bg-white/10">普通模式</SelectItem>
                    <SelectItem value="wrong_words" className="text-white hover:bg-white/10 focus:bg-white/10">错题集（最近7天）</SelectItem>
                    <SelectItem value="collected" className="text-white hover:bg-white/10 focus:bg-white/10">主动收录</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-2xl" style={{ background: 'rgba(0, 240, 255, 0.08)' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#00f0ff' }}>
                  <strong>无尽模式</strong><br/>
                  • 持续练习直到主动退出<br/>
                  • 首次正确即记为"本轮成功"<br/>
                  • 错误的词需连续对3次才算成功<br/>
                  • 错题会穿插出现在后续题目中<br/>
                  • 连续4次正确自动掌握
                </p>
              </div>

              <button 
                onClick={startPractice}
                className="w-full h-12 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
              >
                <Play className="w-5 h-5" />
                开始练习
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 完成页面
  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#12121e' }}>
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
        />
        
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse" style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)', opacity: 0.2, animationDuration: '4s' }} />
        </div>

        <div className="sticky top-0 z-20 border-b backdrop-blur-xl" style={{ background: 'rgba(30, 30, 46, 0.9)', borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="container mx-auto px-4 py-4 max-w-2xl flex items-center gap-3">
            <Link href="/">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95" style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">练习完成</h1>
          </div>
        </div>

        <div className="flex-1 container mx-auto px-4 py-6 max-w-md flex flex-col items-center justify-center">
          <div className="rounded-3xl p-6 w-full" style={{ background: '#1e1e2e', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}>
            <div className="text-center mb-6">
              <div 
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)' }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">{finishMessage}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="text-center p-4 rounded-2xl" style={{ background: 'rgba(0, 255, 136, 0.08)' }}>
                <div className="text-2xl font-bold" style={{ color: '#00ff88' }}>{roundSuccessCount}</div>
                <div className="text-xs mt-1" style={{ color: '#a0a0b0' }}>本轮成功</div>
              </div>
              <div className="text-center p-4 rounded-2xl" style={{ background: 'rgba(255, 107, 157, 0.08)' }}>
                <div className="text-2xl font-bold" style={{ color: '#ff6b9d' }}>{roundWrongCount}</div>
                <div className="text-xs mt-1" style={{ color: '#a0a0b0' }}>首次错误</div>
              </div>
            </div>

            <button 
              onClick={exitPractice}
              className="w-full h-11 rounded-xl text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#12121e' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#c44cff' }} />
          <p className="mt-3" style={{ color: '#a0a0b0' }}>加载中...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isWrongWord = wrongWordsMap.has(currentQuestion.id);
  const wrongStatus = wrongWordsMap.get(currentQuestion.id);

  // 练习页面
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#12121e' }}>
      {/* 背景网格 */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* 自动掌握提示 */}
      {autoMasteredMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm text-white" style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)' }}>
            <Sparkles className="w-4 h-4" />
            {autoMasteredMessage}
          </div>
        </div>
      )}
      
      {/* 头部 */}
      <div className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: 'rgba(30, 30, 46, 0.9)' }}>
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={exitPractice}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ background: 'rgba(255, 107, 157, 0.1)' }}
              >
                <LogOut className="w-5 h-5" style={{ color: '#ff6b9d' }} />
              </button>
              <div>
                <div className="text-base font-bold text-white">第 {questionNumber + 1} 题</div>
                <div className="text-xs" style={{ color: '#a0a0b0' }}>
                  {currentQuestion.mode === 'en-to-zh' ? '英译中' : '中译英'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold" style={{ color: '#00ff88' }}>
                今日成功 {(todayStats?.correctCount || 0) + roundSuccessCount}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span className="font-semibold" style={{ color: '#ff6b9d' }}>
                今日错误 {(todayStats?.wrongCount || 0) + roundWrongCount}
              </span>
              {wrongWordsMap.size > 0 && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                  <span style={{ color: '#ffa500' }}>待复习 {wrongWordsMap.size}</span>
                </>
              )}
            </div>
          </div>
          {/* 今日累计进度 */}
          {todayStats && todayStats.totalPracticed > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: '#a0a0b0' }}>今日累计</span>
                <div className="flex items-center gap-3">
                  <span style={{ color: '#00f0ff' }}>已练 {todayStats.totalPracticed}</span>
                  <span style={{ color: '#00ff88' }}>掌握 {todayStats.masteredCount}</span>
                  {todayStats.wrongWordIds.length > 0 && (
                    <span style={{ color: '#ff6b9d' }}>错词 {todayStats.wrongWordIds.length}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 今日进度条 */}
        {dailyProgress && (
          <div 
            className="relative w-full overflow-hidden"
            style={{ height: '10px', background: 'rgba(255,255,255,0.03)' }}
          >
            {/* 进度填充 */}
            <div 
              className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${progressAnimated ? 'animate-progress-flash' : ''}`}
              style={{ 
                width: `${Math.min(100, (dailyProgress.completed / dailyProgress.goal) * 100)}%`,
                background: dailyProgress.completed >= dailyProgress.goal 
                  ? 'linear-gradient(90deg, rgba(255,215,0,0.4), rgba(255,107,157,0.3))' 
                  : 'linear-gradient(90deg, rgba(0,255,136,0.25), rgba(0,212,255,0.2))',
              }}
            />
            {/* 居中文字 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className="text-[10px] font-medium tracking-wide"
                style={{ color: dailyProgress.completed >= dailyProgress.goal ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.5)' }}
              >
                今日 {dailyProgress.completed}/{dailyProgress.goal}
                {dailyProgress.completed >= dailyProgress.goal && ' ✓'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 题目卡片 - 置顶吸附 */}
      <div 
        className="sticky z-30 px-4 py-3"
        style={{ 
          top: dailyProgress ? '67px' : '57px',
          background: 'rgba(18, 18, 30, 0.98)', 
          backdropFilter: 'blur(12px)' 
        }}
      >
        <div 
          className="max-w-md mx-auto rounded-2xl p-5"
          style={{ background: '#1e1e2e', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">
              {currentQuestion.mode === 'en-to-zh' ? (
                <div className="flex items-center gap-3">
                  {currentQuestion.question}
                  <button
                    onClick={() => playAudio(currentQuestion.question)}
                    className="p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                    style={{ background: 'rgba(0, 240, 255, 0.1)' }}
                  >
                    <Volume2 className="w-5 h-5" style={{ color: '#00f0ff' }} />
                  </button>
                </div>
              ) : (
                currentQuestion.question
              )}
            </h2>
          </div>
          {currentQuestion.mode === 'en-to-zh' && currentQuestion.phonetic && (
            <p className="text-sm" style={{ color: '#a0a0b0' }}>{currentQuestion.phonetic}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {currentQuestion.has_user_context && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(255, 107, 157, 0.15)', color: '#ff6b9d' }}>
                <FileText className="w-3.5 h-3.5" />
                主动收录
              </span>
            )}
            {isWrongWord && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(255, 165, 0, 0.1)', color: '#ffa500' }}>
                <AlertCircle className="w-3.5 h-3.5" />
                本轮错题 · 需连续对 {3 - (wrongStatus?.consecutiveCorrect || 0)} 次
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 中间区域 - 为底部fixed留出空间 */}
      <div className="flex-1" style={{ paddingBottom: '320px' }}></div>

      {/* 底部答题区 - 固定在底部 */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-20"
        style={{ 
          background: 'rgba(18, 18, 30, 0.98)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3 pb-6">
            {!showResult ? (
              <div className="space-y-2">
                {/* 标记掌握按钮 */}
                <button
                  onClick={() => handleMarkAsMastered(true)}
                  disabled={masteredThisRound.has(currentQuestion.id)}
                  className={cn(
                    "w-full h-12 rounded-xl flex items-center gap-3 px-4 transition-all duration-200",
                    masteredThisRound.has(currentQuestion.id) ? '' : 'hover:scale-[1.01] active:scale-95'
                  )}
                  style={{ 
                    background: masteredThisRound.has(currentQuestion.id) ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 255, 136, 0.08)',
                    border: '1px solid rgba(0, 255, 136, 0.2)'
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0, 255, 136, 0.2)' }}>
                    <BookmarkCheck className="w-4 h-4" style={{ color: '#00ff88' }} />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium" style={{ color: '#00ff88' }}>
                    {masteredThisRound.has(currentQuestion.id) ? '已标记掌握' : '标记掌握'}
                  </span>
                </button>

                {/* 四个选项 */}
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className="w-full h-14 rounded-xl flex items-center gap-3 px-4 transition-all duration-200 hover:scale-[1.01] active:scale-95"
                    style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-semibold flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1 text-left text-base line-clamp-2 text-white">{option}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* 答案结果 - 支持滚动 */}
                <div 
                  className="overflow-y-auto mb-3"
                  style={{ maxHeight: 'calc(60vh - 120px)' }}
                >
                  <div 
                    className="p-4 rounded-2xl"
                    style={{ 
                      background: selectedAnswer === currentQuestion.correctAnswer ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 157, 0.1)',
                      border: `1px solid ${selectedAnswer === currentQuestion.correctAnswer ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 157, 0.2)'}`
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                    {selectedAnswer === currentQuestion.correctAnswer ? (
                      <CheckCircle className="w-5 h-5" style={{ color: '#00ff88' }} />
                    ) : (
                      <XCircle className="w-5 h-5" style={{ color: '#ff6b9d' }} />
                    )}
                    <span className="font-semibold text-base" style={{ color: selectedAnswer === currentQuestion.correctAnswer ? '#00ff88' : '#ff6b9d' }}>
                      {selectedAnswer === currentQuestion.correctAnswer ? '回答正确' : '回答错误'}
                    </span>
                  </div>
                  <div className="text-base space-y-2">
                    <p><span style={{ color: '#a0a0b0' }}>正确答案：</span><span className="font-medium text-white">{currentQuestion.correctAnswer}</span></p>
                    {currentQuestion.mode === 'zh-to-en' && currentQuestion.phonetic && (
                      <p><span style={{ color: '#a0a0b0' }}>音标：</span><span className="text-white">{currentQuestion.phonetic}</span></p>
                    )}
                    {currentQuestion.example_sentence && (
                      <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {currentQuestion.has_user_context && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: 'rgba(255, 107, 157, 0.15)', color: '#ff6b9d' }}>
                              主动收录
                            </span>
                          </div>
                        )}
                        <p className="text-base">
                          {currentQuestion.has_user_context 
                            ? highlightWordInSentence(currentQuestion.example_sentence, currentQuestion.word)
                            : <span className="text-white">{currentQuestion.example_sentence}</span>
                          }
                        </p>
                        {/* 主动收录词隐藏中文翻译 */}
                        {!currentQuestion.has_user_context && currentQuestion.example_sentence_cn && (
                          <p className="text-sm mt-2" style={{ color: '#a0a0b0' }}>{currentQuestion.example_sentence_cn}</p>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                {/* 底部按钮组 - 固定 */}
                <div className="space-y-2">
                  {/* 标记掌握按钮 */}
                  <button
                    onClick={() => handleMarkAsMastered(false)}
                    disabled={masteredThisRound.has(currentQuestion.id)}
                    className={cn(
                      "w-full h-12 rounded-xl flex items-center gap-3 px-4 transition-all duration-200",
                      masteredThisRound.has(currentQuestion.id) ? '' : 'hover:scale-[1.01] active:scale-95'
                    )}
                    style={{ 
                      background: masteredThisRound.has(currentQuestion.id) ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 255, 136, 0.08)',
                      border: '1px solid rgba(0, 255, 136, 0.2)'
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0, 255, 136, 0.2)' }}>
                      <BookmarkCheck className="w-4 h-4" style={{ color: '#00ff88' }} />
                    </div>
                    <span className="flex-1 text-left text-sm font-medium" style={{ color: '#00ff88' }}>
                      {masteredThisRound.has(currentQuestion.id) ? '已标记掌握' : '标记掌握'}
                    </span>
                  </button>

                  {/* 下一题按钮 */}
                  <button 
                    onClick={nextQuestion} 
                    className="w-full h-12 rounded-xl text-white font-medium transition-all duration-200 hover:scale-[1.01] active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
                  >
                    下一题
                  </button>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
}
