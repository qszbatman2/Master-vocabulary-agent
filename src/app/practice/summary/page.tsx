'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Target, CheckCircle, RotateCcw, Home, Clock, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface RoundStats {
  totalPracticed: number;
  masteredCount: number;
  wrongCount: number;
  correctCount: number;
  duration: number;
}

interface TodayStats {
  totalPracticed: number;
  correctCount: number;
  wrongCount: number;
  masteredCount: number;
  durationSeconds: number;
}

function SummaryContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [roundStats, setRoundStats] = useState<RoundStats | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
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
        masteredCount: 0,
        wrongCount: 0,
        correctCount: 0,
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
          const response = await fetch('/api/daily-practice', {
            headers: { authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
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
        } catch (e) {
          console.error('获取今日数据失败:', e);
        }
      }

      dataLoadedRef.current = true;
    };

    loadData();
  }, [user, token, router]);

  if (!user || !todayStats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#12121e' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#c44cff' }} />
          <p className="mt-3" style={{ color: '#a0a0b0' }}>加载中...</p>
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

  const todayAccuracy = todayStats.totalPracticed > 0 
    ? Math.round((todayStats.correctCount / todayStats.totalPracticed) * 100) 
    : 0;

  return (
    <div className="flex-1 container mx-auto px-4 py-6 flex flex-col items-center justify-center max-w-md">
      {/* 主卡片 */}
      <div 
        className="w-full rounded-3xl overflow-hidden transition-all duration-700"
        style={{ 
          background: '#1e1e2e',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(30px)'
        }}
      >
        {/* 顶部渐变区域 */}
        <div 
          className="h-28 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #c44cff, #7c4dff)' }}
        >
          <div 
            className="absolute inset-0 opacity-50"
            style={{
              background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)'
            }}
          />
          <div className="text-center text-white relative">
            <div 
              className="w-16 h-16 rounded-2xl mx-auto mb-2 flex items-center justify-center transition-transform duration-300 hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
            >
              <Trophy className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90">今日学习完成</p>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-white text-center mb-5">今日累计</h2>
          
          {/* 主要统计 - 今日累计 */}
          <div 
            className="grid grid-cols-2 gap-3 mb-5 transition-all duration-700 delay-100"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
            }}
          >
            <div 
              className="text-center p-4 rounded-2xl transition-transform duration-200 hover:scale-105"
              style={{ background: 'rgba(0, 240, 255, 0.08)' }}
            >
              <Target className="w-6 h-6 mx-auto mb-2" style={{ color: '#00f0ff' }} />
              <div className="text-3xl font-bold" style={{ color: '#00f0ff' }}>{todayStats.totalPracticed}</div>
              <div className="text-xs mt-1" style={{ color: '#a0a0b0' }}>已背单词</div>
            </div>
            <div 
              className="text-center p-4 rounded-2xl transition-transform duration-200 hover:scale-105"
              style={{ background: 'rgba(0, 255, 136, 0.08)' }}
            >
              <CheckCircle className="w-6 h-6 mx-auto mb-2" style={{ color: '#00ff88' }} />
              <div className="text-3xl font-bold" style={{ color: '#00ff88' }}>{todayStats.masteredCount}</div>
              <div className="text-xs mt-1" style={{ color: '#a0a0b0' }}>今日掌握</div>
            </div>
          </div>

          {/* 次要统计 - 今日累计 */}
          <div 
            className="grid grid-cols-3 gap-2 mb-5 text-center transition-all duration-700 delay-200"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
            }}
          >
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-xl font-semibold text-white">{todayStats.correctCount}</div>
              <div className="text-xs" style={{ color: '#a0a0b0' }}>首次正确</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255, 107, 157, 0.08)' }}>
              <div className="text-xl font-semibold" style={{ color: '#ff6b9d' }}>{todayStats.wrongCount}</div>
              <div className="text-xs" style={{ color: '#a0a0b0' }}>首次错误</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(196, 76, 255, 0.08)' }}>
              <div className="text-xl font-semibold" style={{ color: '#c44cff' }}>{todayAccuracy}%</div>
              <div className="text-xs" style={{ color: '#a0a0b0' }}>正确率</div>
            </div>
          </div>

          {/* 本轮数据（如果有） */}
          {roundStats && roundStats.totalPracticed > 0 && (
            <div 
              className="mb-5 p-4 rounded-2xl transition-all duration-700 delay-200"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="text-sm font-medium mb-2" style={{ color: '#a0a0b0' }}>本轮贡献</div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#00f0ff' }}>练习 {roundStats.totalPracticed} 词</span>
                <span style={{ color: '#00ff88' }}>掌握 {roundStats.masteredCount} 词</span>
                <span style={{ color: '#ff6b9d' }}>错误 {roundStats.wrongCount} 词</span>
              </div>
            </div>
          )}

          {/* 学习时长 */}
          <div 
            className="text-center p-4 rounded-2xl mb-5 transition-all duration-700 delay-300"
            style={{ 
              background: 'rgba(196, 76, 255, 0.08)',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
            }}
          >
            <Clock className="w-5 h-5 mx-auto mb-2" style={{ color: '#c44cff' }} />
            <div className="text-sm" style={{ color: '#a0a0b0' }}>今日学习时长</div>
            <div className="text-2xl font-bold mt-1" style={{ color: '#c44cff' }}>{formatDuration(todayStats.durationSeconds)}</div>
          </div>

          {/* 激励语 */}
          <div 
            className="text-center py-3 mb-4 transition-all duration-700 delay-400"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
            }}
          >
            {todayStats.masteredCount >= 20 ? (
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: '#00ff88' }} />
                <p className="font-medium" style={{ color: '#00ff88' }}>太棒了！今日收获满满！</p>
              </div>
            ) : todayStats.masteredCount >= 10 ? (
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: '#00f0ff' }} />
                <p className="font-medium" style={{ color: '#00f0ff' }}>进步很大，继续保持！</p>
              </div>
            ) : todayStats.totalPracticed > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <Target className="w-5 h-5" style={{ color: '#c44cff' }} />
                <p className="font-medium" style={{ color: '#c44cff' }}>每一次练习都是进步！</p>
              </div>
            ) : (
              <p style={{ color: '#a0a0b0' }}>开始你的学习之旅吧！</p>
            )}
          </div>
        </div>
      </div>

      {/* 按钮区域 */}
      <div 
        className="w-full space-y-3 mt-5 transition-all duration-700 delay-500"
        style={{ 
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
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
            style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}
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
          style={{ background: 'linear-gradient(135deg, #c44cff, #7c4dff)', opacity: 0.2, animationDuration: '4s' }}
        />
        <div 
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse"
          style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)', opacity: 0.15, animationDuration: '5s', animationDelay: '1s' }}
        />
      </div>

      {/* 头部 */}
      <div 
        className="sticky top-0 z-20 border-b backdrop-blur-xl transition-all duration-700"
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
          <h1 className="text-xl font-bold text-white">今日结算</h1>
        </div>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <SummaryContent />
      </Suspense>
    </div>
  );
}
