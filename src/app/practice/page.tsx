'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Trophy, Volume2, BookmarkCheck, Sparkles } from 'lucide-react';
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
  question: string;
  options: string[];
  correctAnswer: string;
  mode: string;
}

export default function PracticePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isMastered, setIsMastered] = useState(false);
  const [autoMasteredMessage, setAutoMasteredMessage] = useState('');
  const [remainingWords, setRemainingWords] = useState(0);

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

  const startPractice = async () => {
    if (!token) return;
    
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory);
      }
      params.append('limit', '10');

      const response = await fetch(`/api/practice?${params.toString()}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.message) {
        alert(data.message);
        return;
      }
      
      setQuestions(data.questions || []);
      setRemainingWords(data.remainingWords || 0);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setCorrectCount(0);
      setWrongCount(0);
      setIsStarted(true);
      setIsFinished(false);
      setIsMastered(false);
    } catch (error) {
      console.error('Failed to start practice:', error);
    }
  };

  const submitResult = async (wordId: number, isCorrect: boolean, markAsMastered: boolean = false) => {
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
        }),
      });
      
      const data = await response.json();
      
      if (data.autoMastered) {
        setAutoMasteredMessage('连续4次正确，已掌握！');
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
    
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongCount((prev) => prev + 1);
    }

    await submitResult(currentQuestion.id, isCorrect);
  };

  const handleMarkAsMastered = async () => {
    if (!token || isMastered) return;
    
    const currentQuestion = questions[currentIndex];
    await submitResult(currentQuestion.id, true, true);
    setIsMastered(true);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsMastered(false);
    } else {
      setIsFinished(true);
    }
  };

  const restartPractice = () => {
    setIsStarted(false);
    setIsFinished(false);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setWrongCount(0);
    setIsMastered(false);
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

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  • 英译中/中译英随机<br/>
                  • 连续4次正确自动掌握<br/>
                  • 已掌握单词不重复出现
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

  // 结果页面
  if (isFinished) {
    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

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
                <Trophy className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">练习完成！</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{totalQuestions}</div>
                  <div className="text-xs text-gray-500">总题数</div>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{correctCount}</div>
                  <div className="text-xs text-gray-500">正确</div>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-red-600">{wrongCount}</div>
                  <div className="text-xs text-gray-500">错误</div>
                </div>
              </div>

              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{accuracy}%</div>
                <div className="text-xs text-gray-500">正确率</div>
              </div>

              <div className="flex gap-2">
                <Button onClick={restartPractice} variant="outline" className="flex-1 h-10">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  返回
                </Button>
                <Button onClick={startPractice} className="flex-1 h-10">
                  再练一次
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

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
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  第 {currentIndex + 1}/{questions.length} 题
                </div>
                <div className="text-xs text-gray-500">
                  {currentQuestion.mode === 'en-to-zh' ? '英译中' : '中译英'}
                </div>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-green-600 font-semibold">{correctCount}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-red-600 font-semibold">{wrongCount}</span>
            </div>
          </div>
          {/* 进度条 */}
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 container mx-auto px-3 py-3">
        <Card className="max-w-md mx-auto">
          <CardHeader className="p-4 pb-2">
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
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              {currentQuestion.options.map((option, index) => {
                const isCorrect = option === currentQuestion.correctAnswer;
                const isSelected = option === selectedAnswer;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;

                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={cn(
                      'h-auto py-3 px-3 text-sm justify-start',
                      showCorrect && 'bg-green-100 dark:bg-green-900 border-green-500 text-green-900 dark:text-green-100',
                      showWrong && 'bg-red-100 dark:bg-red-900 border-red-500 text-red-900 dark:text-red-100'
                    )}
                    onClick={() => handleAnswer(option)}
                    disabled={showResult}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1 text-left truncate">{option}</span>
                      {showCorrect && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                      {showWrong && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* 答案解析 */}
            {showResult && (
              <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                <div className="mb-1 font-semibold">
                  {selectedAnswer === currentQuestion.correctAnswer ? '✓ 正确' : '✗ 错误'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                  <p>答案：{currentQuestion.correctAnswer}</p>
                  {currentQuestion.mode === 'zh-to-en' && (
                    <p>音标：{currentQuestion.phonetic}</p>
                  )}
                  {currentQuestion.example_sentence && (
                    <p>例句：{currentQuestion.example_sentence}</p>
                  )}
                </div>
                
                <div className="flex gap-2 mt-3">
                  {!isMastered && (
                    <Button 
                      onClick={handleMarkAsMastered}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-green-500 text-green-600 h-8 text-xs"
                    >
                      <BookmarkCheck className="w-3 h-3 mr-1" />
                      标记掌握
                    </Button>
                  )}
                  <Button onClick={nextQuestion} size="sm" className="flex-1 h-8 text-xs">
                    {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
