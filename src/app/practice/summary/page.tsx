'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Target, CheckCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface RoundSummary {
  totalPracticed: number;      // 本轮已背单词数
  masteredCount: number;       // 本轮掌握数
  wrongCount: number;          // 本轮首次错误数
  correctCount: number;        // 本轮首次正确数
  duration: number;            // 学习时长（秒）
}

function SummaryContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const initializedRef = useRef(false);
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    if (dataLoadedRef.current) return;
    if (user === undefined) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const saved = sessionStorage.getItem('practice_summary');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSummary(data);
        dataLoadedRef.current = true;
        setTimeout(() => {
          sessionStorage.removeItem('practice_summary');
        }, 100);
        return;
      } catch (e) {
        console.error('解析 sessionStorage 数据失败:', e);
      }
    }

    const totalPracticed = parseInt(searchParams.get('total') || '0');
    const masteredCount = parseInt(searchParams.get('mastered') || '0');
    const wrongCount = parseInt(searchParams.get('wrong') || '0');
    const correctCount = parseInt(searchParams.get('correct') || '0');
    const duration = parseInt(searchParams.get('duration') || '0');

    if (totalPracticed > 0 || masteredCount > 0 || wrongCount > 0) {
      setSummary({ totalPracticed, masteredCount, wrongCount, correctCount, duration });
      dataLoadedRef.current = true;
    } else {
      router.push('/');
    }
  }, [user, router]);

  if (!user || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}秒`;
    return `${mins}分${secs}秒`;
  };

  const accuracy = summary.totalPracticed > 0 
    ? Math.round((summary.correctCount / summary.totalPracticed) * 100) 
    : 0;

  return (
    <div className="flex-1 container mx-auto px-3 py-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-sm mb-4 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
          <div className="text-center text-white">
            <Trophy className="w-10 h-10 mx-auto mb-1" />
            <p className="text-sm opacity-90">学习完成</p>
          </div>
        </div>

        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-center text-lg">本轮成绩</CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-600">{summary.totalPracticed}</div>
              <div className="text-xs text-gray-500">已背单词</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600">{summary.masteredCount}</div>
              <div className="text-xs text-gray-500">本轮掌握</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">{summary.correctCount}</div>
              <div className="text-xs text-gray-500">首次正确</div>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-lg font-semibold text-red-600">{summary.wrongCount}</div>
              <div className="text-xs text-gray-500">首次错误</div>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-lg font-semibold text-purple-600">{accuracy}%</div>
              <div className="text-xs text-gray-500">正确率</div>
            </div>
          </div>

          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">学习时长</div>
            <div className="text-xl font-bold text-purple-600">{formatDuration(summary.duration)}</div>
          </div>

          <div className="text-center py-2">
            {summary.masteredCount >= 10 ? (
              <p className="text-green-600 font-medium">太棒了！继续保持！</p>
            ) : summary.masteredCount >= 5 ? (
              <p className="text-blue-600 font-medium">进步很大，加油！</p>
            ) : summary.totalPracticed > 0 ? (
              <p className="text-purple-600 font-medium">每一次练习都是进步！</p>
            ) : (
              <p className="text-gray-500">开始你的学习之旅吧！</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-sm space-y-2">
        <Link href="/practice" className="block">
          <Button className="w-full h-11" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            继续练习
          </Button>
        </Link>
        <Link href="/" className="block">
          <Button variant="outline" className="w-full h-11" size="lg">
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">加载中...</p>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b">
        <div className="container mx-auto px-3 py-3 flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">本轮结算</h1>
        </div>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <SummaryContent />
      </Suspense>
    </div>
  );
}
