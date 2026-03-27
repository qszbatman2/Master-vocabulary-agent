'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, CheckCircle, RotateCcw, Home, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface RoundStats {
  totalPracticed: number;
  correctCount: number;
  wrongCount: number;
  duration: number;
}

function SummaryContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [roundStats, setRoundStats] = useState<RoundStats | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    const saved = sessionStorage.getItem('cloze_round_stats');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setRoundStats({
          totalPracticed: data.totalPracticed || 0,
          correctCount: data.correctCount || 0,
          wrongCount: data.wrongCount || 0,
          duration: data.duration || 0,
        });
        setTimeout(() => sessionStorage.removeItem('cloze_round_stats'), 100);
      } catch {
        setRoundStats({ totalPracticed: 0, correctCount: 0, wrongCount: 0, duration: 0 });
      }
    } else {
      setRoundStats({ totalPracticed: 0, correctCount: 0, wrongCount: 0, duration: 0 });
    }
  }, [user, router]);

  if (!user || !roundStats) {
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
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
  };

  const accuracy = roundStats.totalPracticed > 0 ? Math.round((roundStats.correctCount / roundStats.totalPracticed) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#12121e' }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <div className="sticky top-0 z-20 border-b backdrop-blur-xl safe-area-top" style={{ background: 'rgba(30, 30, 46, 0.9)', borderColor: 'rgba(255,255,255,0.05)', opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)', transition: 'all 700ms' }}>
        <div className="container mx-auto px-4 py-4 max-w-2xl flex items-center gap-3">
          <Link href="/practice/cloze">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95" style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-white">结算</h1>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col items-center justify-center max-w-md">
        <div className="w-full rounded-3xl overflow-hidden mb-4" style={{ background: '#1e1e2e', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)', opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)', transition: 'all 700ms' }}>
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-center justify-center gap-2 mb-5">
              <Trophy className="w-5 h-5" style={{ color: '#ffd700' }} />
              <h2 className="text-lg font-bold text-white">本轮完成</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center p-4 rounded-2xl" style={{ background: 'rgba(0, 240, 255, 0.08)' }}>
                <div className="text-2xl font-bold" style={{ color: '#00f0ff' }}>{roundStats.totalPracticed}</div>
                <div className="text-xs mt-1" style={{ color: '#a0a0b0' }}>题数</div>
              </div>
              <div className="text-center p-4 rounded-2xl" style={{ background: 'rgba(0, 255, 136, 0.08)' }}>
                <div className="text-2xl font-bold" style={{ color: '#00ff88' }}>{roundStats.correctCount}</div>
                <div className="text-xs mt-1" style={{ color: '#a0a0b0' }}>正确</div>
              </div>
              <div className="text-center p-4 rounded-2xl" style={{ background: 'rgba(255, 107, 157, 0.08)' }}>
                <div className="text-2xl font-bold" style={{ color: '#ff6b9d' }}>{accuracy}%</div>
                <div className="text-xs mt-1" style={{ color: '#a0a0b0' }}>正确率</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#a0a0b0' }}>
              <Clock className="w-4 h-4" />
              <span>用时 {formatDuration(roundStats.duration)}</span>
            </div>

            <div className="mt-5 p-4 rounded-2xl flex items-center justify-center gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <CheckCircle className="w-4 h-4" style={{ color: '#00ff88' }} />
              <span className="text-sm text-white">本模式不写入数据库</span>
            </div>
          </div>
        </div>

        <div className="w-full space-y-2">
          <Link href="/practice/cloze">
            <button className="w-full h-12 rounded-xl text-white font-medium transition-all duration-200 hover:scale-[1.01] active:scale-95" style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}>
              <RotateCcw className="w-4 h-4 inline-block mr-2" />
              再来一局
            </button>
          </Link>
          <Link href="/">
            <button className="w-full h-11 rounded-xl font-medium transition-all duration-200 hover:scale-[1.01] active:scale-95" style={{ background: 'rgba(255,255,255,0.06)', color: '#a0a0b0', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Home className="w-4 h-4 inline-block mr-2" />
              返回首页
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ClozeSummaryPage() {
  return (
    <Suspense>
      <SummaryContent />
    </Suspense>
  );
}

