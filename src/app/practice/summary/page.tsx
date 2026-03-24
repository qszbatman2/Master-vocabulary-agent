'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trophy, Target, CheckCircle, RotateCcw, Home, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface RoundStats {
  totalPracticed: number;
  correctCount: number;
  wrongCount: number;
  manuallyMasteredCount: number;
  systemMasteredCount: number;
  duration: number;
}

interface TodayStats {
  totalPracticed: number;
  correctCount: number;
  wrongCount: number;
  masteredCount: number;
  durationSeconds: number;
}

interface DailyProgress {
  dailyGoal: number;
  completed: number;
}

function SummaryContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roundStats, setRoundStats] = useState<RoundStats | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const initializedRef = useRef(false);
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (dataLoadedRef.current) return;
    if (user === undefined) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const loadData = async () => {
      // 从 sessionStorage 获取本轮数据
      const saved = sessionStorage.getItem('practice_round_stats');
      let roundData: RoundStats = {
        totalPracticed: 0,
        correctCount: 0,
        wrongCount: 0,
        manuallyMasteredCount: 0,
        systemMasteredCount: 0,
        duration: 0,
      };
      
      if (saved) {
        try {
          roundData = JSON.parse(saved);
          setRoundStats(roundData);
          setTimeout(() => {
            sessionStorage.removeItem('practice_round_stats');
          }, 100);
        } catch (e) {
          console.error('解析 sessionStorage 数据失败:', e);
        }
      }

      // 从 API 获取今日累计数据
      if (token) {
        try {
          // 获取今日统计
          const todayResponse = await fetch('/api/daily-practice', {
            headers: { authorization: `Bearer ${token}` },
          });
          if (todayResponse.ok) {
            const data = await todayResponse.json();
            if (data.success && data.today) {
              setTodayStats({
                totalPracticed: data.today.totalPracticed || 0,
                correctCount: data.today.correctCount || 0,
                wrongCount: data.today.wrongCount || 0,
                masteredCount: data.today.masteredCount || 0,
                durationSeconds: data.today.durationSeconds || 0,
              });
            }
          }

          // 获取今日进度
          const progressResponse = await fetch('/api/daily-progress', {
            headers: { authorization: `Bearer ${token}` },
          });
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            setDailyProgress({
              dailyGoal: progressData.dailyGoal || 20,
              completed: progressData.completed || 0,
            });
          }
        } catch (e) {
          console.error('获取今日数据失败:', e);
        }
      }

      dataLoadedRef.current = true;
    };

    loadData();
  }, [user, token, router]);

  if (!user || !todayStats || !dailyProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#12121e' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#c44cff' }} />
          <p className="mt-3" style={{ color: '#a0a0b0' }}>加载中...</p>
        </div>
      </div>
    );
  }

  // 格式化时长
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
  };

  // 计算本轮进度条数据
  const totalMastered = (roundStats?.manuallyMasteredCount || 0) + (roundStats?.systemMasteredCount || 0);
  const correctNotMastered = Math.max(0, (roundStats?.correctCount || 0) - totalMastered);
  const correctMastered = totalMastered;
  const wrongCount = roundStats?.wrongCount || 0;
  const totalPracticed = roundStats?.totalPracticed || 0;

  // 正确率
  const accuracy = totalPracticed > 0 ? Math.round(((roundStats?.correctCount || 0) / totalPracticed) * 100) : 0;

  // 今日进度
  const todayCompleted = dailyProgress.completed;
  const todayGoal = dailyProgress.dailyGoal;
  const isGoalCompleted = todayCompleted >= todayGoal;

  return (
    <div className="flex-1 container mx-auto px-4 py-6 flex flex-col items-center justify-center max-w-md">
      {/* 本轮完成卡片 */}
      {roundStats && roundStats.totalPracticed > 0 && (
        <div 
          className="w-full rounded-3xl overflow-hidden mb-4 transition-all duration-700"
          style={{ 
            background: '#1e1e2e',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(30px)'
          }}
        >
          {/* 标题区域 */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-center gap-2 mb-5">
              <Trophy className="w-5 h-5" style={{ color: '#ffd700' }} />
              <h2 className="text-lg font-bold text-white">本轮完成</h2>
            </div>

            {/* 两项数据并排 */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#00f0ff' }}>{roundStats.correctCount}</div>
                <div className="text-xs mt-1" style={{ color: '#a0a0b0' }}>正确</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#ffd700' }}>{accuracy}%</div>
                <div className="text-xs mt-1" style={{ color: '#a0a0b0' }}>正确率</div>
              </div>
            </div>

            {/* 进度条 */}
            <div className="mb-3">
              <div 
                className="relative w-full overflow-hidden rounded-full"
                style={{ height: '16px', background: 'rgba(255,255,255,0.05)' }}
              >
                {/* 正确未掌握 - 浅青色 */}
                {correctNotMastered > 0 && (
                  <div 
                    className="absolute inset-y-0 left-0"
                    style={{ 
                      width: `${(correctNotMastered / totalPracticed) * 100}%`,
                      background: 'linear-gradient(90deg, #00f0ff, #00d4ff)',
                    }}
                  />
                )}
                {/* 正确掌握 - 深青色 */}
                {correctMastered > 0 && (
                  <div 
                    className="absolute inset-y-0"
                    style={{ 
                      left: `${(correctNotMastered / totalPracticed) * 100}%`,
                      width: `${(correctMastered / totalPracticed) * 100}%`,
                      background: 'linear-gradient(90deg, #00a8cc, #0088aa)',
                    }}
                  />
                )}
                {/* 错误 - 粉色 */}
                {wrongCount > 0 && (
                  <div 
                    className="absolute inset-y-0 right-0"
                    style={{ 
                      width: `${(wrongCount / totalPracticed) * 100}%`,
                      background: 'linear-gradient(90deg, #ff6b9d, #ff4d6d)',
                    }}
                  />
                )}
              </div>
            </div>

            {/* 进度条图例 */}
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg, #00f0ff, #00d4ff)' }} />
                <span style={{ color: '#a0a0b0' }}>正确未掌握 {correctNotMastered}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg, #00a8cc, #0088aa)' }} />
                <span style={{ color: '#a0a0b0' }}>正确掌握 {correctMastered}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg, #ff6b9d, #ff4d6d)' }} />
                <span style={{ color: '#a0a0b0' }}>错误 {wrongCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 今日累计卡片 */}
      <div 
        className="w-full rounded-3xl overflow-hidden mb-5 transition-all duration-700"
        style={{ 
          background: '#1e1e2e',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
          transitionDelay: roundStats && roundStats.totalPracticed > 0 ? '100ms' : '0ms'
        }}
      >
        <div className="px-6 py-5">
          {/* 标题 */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="w-5 h-5" style={{ color: '#00f0ff' }} />
            <h2 className="text-lg font-bold text-white">今日累计</h2>
          </div>

          {/* 进度条 */}
          <div className="mb-4">
            <div 
              className="relative w-full overflow-hidden rounded-full"
              style={{ height: '12px', background: 'rgba(255,255,255,0.05)' }}
            >
              <div 
                className="absolute inset-y-0 left-0 transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (todayCompleted / todayGoal) * 100)}%`,
                  background: isGoalCompleted 
                    ? 'linear-gradient(90deg, rgba(255,215,0,0.8), rgba(255,107,157,0.6))' 
                    : 'linear-gradient(90deg, rgba(0,255,136,0.5), rgba(0,212,255,0.4))',
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs" style={{ color: '#a0a0b0' }}>今日正确</span>
              <span className="text-sm font-semibold" style={{ color: isGoalCompleted ? '#ffd700' : '#00f0ff' }}>
                {todayCompleted}/{todayGoal}
              </span>
            </div>
          </div>

          {/* 今日用时 */}
          <div className="flex items-center justify-center gap-2 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <Clock className="w-4 h-4" style={{ color: '#00f0ff' }} />
            <span className="text-sm" style={{ color: '#a0a0b0' }}>今日用时</span>
            <span className="text-base font-semibold" style={{ color: '#00f0ff' }}>{formatDuration(todayStats.durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* 激励语 */}
      {roundStats && roundStats.totalPracticed > 0 && (
        <div 
          className="w-full text-center mb-5 transition-all duration-700"
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: '200ms'
          }}
        >
          {totalMastered >= 10 ? (
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: '#ffd700' }} />
              <p className="font-medium" style={{ color: '#ffd700' }}>太棒了！收获满满！</p>
            </div>
          ) : totalMastered >= 5 ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" style={{ color: '#00ff88' }} />
              <p className="font-medium" style={{ color: '#00ff88' }}>进步很大，继续保持！</p>
            </div>
          ) : totalPracticed > 0 ? (
            <div className="flex items-center justify-center gap-2">
              <Target className="w-5 h-5" style={{ color: '#00f0ff' }} />
              <p className="font-medium" style={{ color: '#00f0ff' }}>每一次练习都是进步！</p>
            </div>
          ) : null}
        </div>
      )}

      {/* 按钮区域 */}
      <div 
        className="w-full space-y-3 transition-all duration-700"
        style={{ 
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transitionDelay: '300ms'
        }}
      >
        <Link href="/practice" className="block">
          <button 
            className="w-full h-12 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
          >
            <RotateCcw className="w-5 h-5" />
            继续练习
          </button>
        </Link>
        <Link href="/" className="block">
          <button 
            className="w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#c0c0c8' }}
          >
            <Home className="w-5 h-5" />
            返回首页
          </button>
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#12121e' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#c44cff' }} />
        <p className="mt-3" style={{ color: '#a0a0b0' }}>加载中...</p>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
          style={{ background: 'linear-gradient(135deg, #00f0ff, #00d4aa)', opacity: 0.2, animationDuration: '4s' }}
        />
        <div 
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse"
          style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)', opacity: 0.15, animationDuration: '5s', animationDelay: '1s' }}
        />
      </div>

      {/* 头部 */}
      <div 
        className="sticky top-0 z-20 border-b backdrop-blur-xl transition-all duration-700 safe-area-top"
        style={{ 
          background: 'rgba(30, 30, 46, 0.9)',
          borderColor: 'rgba(255,255,255,0.05)',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)'
        }}
      >
        <div className="container mx-auto px-4 py-4 max-w-2xl flex items-center gap-3">
          <Link href="/">
            <button 
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-white">练习结算</h1>
        </div>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <SummaryContent />
      </Suspense>
    </div>
  );
}
