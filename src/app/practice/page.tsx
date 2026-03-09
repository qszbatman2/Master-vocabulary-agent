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
    // 检查登录状态
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
        // 所有单词都已掌握
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
        setAutoMasteredMessage('恭喜！连续4次正确，已自动标记为已掌握！');
        setTimeout(() => setAutoMasteredMessage(''), 3000);
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

    // 提交结果
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

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* 头部 */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">背单词练习</h1>
              <p className="text-gray-600 dark:text-gray-300">选择词库开始练习（已掌握的单词不会出现）</p>
            </div>
          </div>

          {/* 设置卡片 */}
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>练习设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">选择词库</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
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

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>练习规则：</strong><br/>
                  • 每道题随机英译中或中译英<br/>
                  • 连续4次正确自动标记为已掌握<br/>
                  • 已掌握的单词不会再出现<br/>
                  • 可手动标记单词为已掌握
                </p>
              </div>

              <Button onClick={startPractice} className="w-full" size="lg">
                开始练习
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* 头部 */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">练习完成</h1>
              <p className="text-gray-600 dark:text-gray-300">查看你的成绩</p>
            </div>
          </div>

          {/* 结果卡片 */}
          <Card className="max-w-xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">恭喜你完成了练习！</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">总题数</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {correctCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">正确</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {wrongCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">错误</div>
                </div>
              </div>

              <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {accuracy}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">正确率</div>
              </div>

              {remainingWords > 0 && (
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    还有 <strong>{remainingWords}</strong> 个单词等待练习
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={restartPractice} variant="outline" className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重新开始
                </Button>
                <Button onClick={startPractice} className="flex-1">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      {/* 自动掌握提示 */}
      {autoMasteredMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {autoMasteredMessage}
          </div>
        </div>
      )}
      
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">背单词练习</h1>
              <p className="text-gray-600 dark:text-gray-300">
                第 {currentIndex + 1} / {questions.length} 题
                <span className="ml-2 text-sm px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded">
                  {currentQuestion.mode === 'en-to-zh' ? '英译中' : '中译英'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-green-600 dark:text-green-400 font-semibold">{correctCount}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-red-600 dark:text-red-400 font-semibold">{wrongCount}</span>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 题目卡片 */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {currentQuestion.mode === 'en-to-zh' ? (
                  <>
                    {currentQuestion.question}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => playAudio(currentQuestion.question)}
                    >
                      <Volume2 className="w-5 h-5" />
                    </Button>
                  </>
                ) : (
                  currentQuestion.question
                )}
              </CardTitle>
            </div>
            {currentQuestion.mode === 'en-to-zh' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {currentQuestion.phonetic}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
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
                      'h-auto py-4 px-6 text-left justify-start',
                      showCorrect && 'bg-green-100 dark:bg-green-900 border-green-500 text-green-900 dark:text-green-100',
                      showWrong && 'bg-red-100 dark:bg-red-900 border-red-500 text-red-900 dark:text-red-100'
                    )}
                    onClick={() => handleAnswer(option)}
                    disabled={showResult}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-semibold">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showCorrect && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
                      {showWrong && <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* 答案解析 */}
            {showResult && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="mb-2">
                  <span className="font-semibold">
                    {selectedAnswer === currentQuestion.correctAnswer ? '✓ 回答正确！' : '✗ 回答错误'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>正确答案：</strong>{currentQuestion.correctAnswer}</p>
                  {currentQuestion.mode === 'zh-to-en' && (
                    <p><strong>音标：</strong>{currentQuestion.phonetic}</p>
                  )}
                  {currentQuestion.example_sentence && (
                    <p><strong>例句：</strong>{currentQuestion.example_sentence}</p>
                  )}
                </div>
                
                {/* 手动标记已掌握按钮 */}
                {!isMastered && (
                  <Button 
                    onClick={handleMarkAsMastered}
                    variant="outline"
                    className="w-full mt-4 border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    标记为已掌握
                  </Button>
                )}
                
                {isMastered && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
                    <BookmarkCheck className="w-4 h-4" />
                    已标记为掌握
                  </div>
                )}
                
                <Button onClick={nextQuestion} className="w-full mt-4">
                  {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
