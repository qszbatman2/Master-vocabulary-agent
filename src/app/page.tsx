'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BookOpen, GraduationCap, LogIn, LogOut, User, CheckCircle, RotateCcw, BookMarked, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  today: {
    practicedCount: number;
    masteredCount: number;
  };
  total: {
    masteredCount: number;
    reviewingCount: number;
    newWordsCount: number;
    totalWords: number;
  };
}

interface DailyProgress {
  dailyGoal: number;
  completed: number;
  progress: number;
  isCompleted: boolean;
}

export default function Home() {
  const { user, logout, token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState('200');

  useEffect(() => {
    if (user && token) {
      fetchStats();
      fetchDailyProgress();
    }
  }, [user, token]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats', {
        headers: { authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchDailyProgress = async () => {
    try {
      const response = await fetch('/api/daily-progress', {
        headers: { authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDailyProgress(data);
        setNewGoal(data.dailyGoal.toString());
      }
    } catch (error) {
      console.error('Failed to fetch daily progress:', error);
    }
  };

  const handleUpdateGoal = async () => {
    const goal = parseInt(newGoal);
    if (!goal || goal < 1 || goal > 1000) return;
    
    try {
      const response = await fetch('/api/daily-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dailyGoal: goal }),
      });
      
      if (response.ok) {
        setDailyProgress(prev => prev ? { ...prev, dailyGoal: goal } : null);
        setShowGoalDialog(false);
      }
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#12121e' }}>
      {/* 背景装饰 - 渐变光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff)' }}
        />
        <div 
          className="absolute top-1/2 -left-32 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'linear-gradient(135deg, #00f0ff, #7c4dff)' }}
        />
        <div 
          className="absolute -bottom-32 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-25"
          style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)' }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-6 flex-1 flex flex-col max-w-2xl">
        {/* 头部导航 */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-white/30 text-sm font-medium">
            Vocabulary App
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#a0a0b0' }}>
                <User className="w-4 h-4" />
                <span>{user.nickname}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-white/60 hover:text-white hover:bg-white/10 border-0"
              >
                <LogOut className="w-4 h-4 mr-1" />
                登出
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button 
                size="sm"
                className="text-white border-0 font-medium"
                style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
              >
                <LogIn className="w-4 h-4 mr-1" />
                登录
              </Button>
            </Link>
          )}
        </div>

        {/* 主标题区域 */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {user ? `Hello, ${user.nickname} 👋` : '英语单词学习平台'}
          </h1>
          <p className="text-sm" style={{ color: '#a0a0b0' }}>
            {user ? '开始今天的学习吧' : '登录后记录学习进度'}
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* 单词库卡片 */}
          <Link href="/vocabulary" className="block">
            <div 
              className="rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 h-full"
              style={{ 
                background: '#1e1e2e',
                borderRadius: '24px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff)' }}
                >
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">单词库</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#a0a0b0' }}>浏览全部词汇</p>
                </div>
              </div>
            </div>
          </Link>

          {/* 背单词卡片 */}
          <Link href={user ? "/practice" : "/login"} className="block">
            <div 
              className="rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 h-full"
              style={{ 
                background: '#1e1e2e',
                borderRadius: '24px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #00f0ff, #7c4dff)' }}
                >
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">背单词</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#a0a0b0' }}>
                    {user ? '开始练习' : '登录练习'}
                  </p>
                </div>
                {user && dailyProgress && (
                  <button 
                    onClick={(e) => { e.preventDefault(); setShowGoalDialog(true); }}
                    className="text-xs px-3 py-1 rounded-full transition-colors"
                    style={{ 
                      color: '#a0a0b0',
                      background: 'rgba(255,255,255,0.05)'
                    }}
                  >
                    今日 <span style={{ color: '#00f0ff' }}>{dailyProgress.completed}</span>/{dailyProgress.dailyGoal}
                  </button>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* 统计信息 */}
        {user && stats ? (
          <div 
            className="rounded-2xl p-5 mb-6"
            style={{ 
              background: '#1e1e2e',
              borderRadius: '24px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" style={{ color: '#a0a0b0' }} />
              <span className="text-sm font-medium" style={{ color: '#a0a0b0' }}>累计进度</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div 
                className="text-center p-3 rounded-xl"
                style={{ background: 'rgba(0, 255, 136, 0.1)' }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: '#00ff88' }} />
                  <span className="text-xl font-bold" style={{ color: '#00ff88' }}>
                    {stats.total.masteredCount}
                  </span>
                </div>
                <div className="text-xs" style={{ color: '#a0a0b0' }}>已掌握</div>
              </div>
              <div 
                className="text-center p-3 rounded-xl"
                style={{ background: 'rgba(255, 107, 157, 0.1)' }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <RotateCcw className="w-3.5 h-3.5" style={{ color: '#ff6b9d' }} />
                  <span className="text-xl font-bold" style={{ color: '#ff6b9d' }}>
                    {stats.total.reviewingCount}
                  </span>
                </div>
                <div className="text-xs" style={{ color: '#a0a0b0' }}>复习中</div>
              </div>
              <div 
                className="text-center p-3 rounded-xl"
                style={{ background: 'rgba(0, 240, 255, 0.1)' }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BookMarked className="w-3.5 h-3.5" style={{ color: '#00f0ff' }} />
                  <span className="text-xl font-bold" style={{ color: '#00f0ff' }}>
                    {stats.total.newWordsCount}
                  </span>
                </div>
                <div className="text-xs" style={{ color: '#a0a0b0' }}>剩余新词</div>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-2" style={{ color: '#a0a0b0' }}>
                <span>总进度</span>
                <span>{stats.total.totalWords > 0 ? Math.round(stats.total.masteredCount / stats.total.totalWords * 100) : 0}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.total.totalWords > 0 ? Math.min(100, stats.total.masteredCount / stats.total.totalWords * 100) : 0}%`,
                    background: 'linear-gradient(135deg, #00ff88, #00d4ff)'
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* 未登录状态统计 */
          <div 
            className="rounded-2xl p-4 mb-6 text-center"
            style={{ 
              background: '#1e1e2e',
              borderRadius: '24px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div 
                  className="text-2xl font-bold"
                  style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  16
                </div>
                <div className="text-xs" style={{ color: '#a0a0b0' }}>词库</div>
              </div>
              <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="text-center">
                <div 
                  className="text-2xl font-bold"
                  style={{ background: 'linear-gradient(135deg, #00f0ff, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  13K+
                </div>
                <div className="text-xs" style={{ color: '#a0a0b0' }}>单词</div>
              </div>
              <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="text-center">
                <div 
                  className="text-2xl font-bold"
                  style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  2
                </div>
                <div className="text-xs" style={{ color: '#a0a0b0' }}>模式</div>
              </div>
            </div>
          </div>
        )}

        {/* 功能说明 */}
        <div>
          <h2 className="text-sm font-medium text-center mb-3" style={{ color: '#a0a0b0' }}>核心功能</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: '智能学习', desc: '连续4天答对' },
              { title: '随机模式', desc: '英译中/中译英' },
              { title: '进度追踪', desc: '记录学习数据' },
            ].map((item, i) => (
              <div 
                key={i} 
                className="rounded-xl p-3 text-center"
                style={{ 
                  background: '#1e1e2e',
                  borderRadius: '16px'
                }}
              >
                <h4 className="text-xs font-medium text-white">{item.title}</h4>
                <p className="text-xs mt-0.5" style={{ color: '#a0a0b0' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 目标设置弹窗 */}
        <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
          <DialogContent 
            className="sm:max-w-sm border-0"
            style={{ background: '#1e1e2e', borderRadius: '24px' }}
          >
            <DialogHeader>
              <DialogTitle className="text-white">设置每日学习目标</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {[50, 100, 200, 300, 500].map(g => (
                  <Button
                    key={g}
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewGoal(g.toString())}
                    className={
                      newGoal === g.toString() 
                        ? "text-white border-0" 
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }
                    style={newGoal === g.toString() ? { background: 'linear-gradient(135deg, #ff6b9d, #c44cff)' } : {}}
                  >
                    {g}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#a0a0b0' }}>自定义：</span>
                <Input
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="w-20 bg-white/5 border-white/10 text-white"
                  min={1}
                  max={1000}
                />
                <span className="text-sm" style={{ color: '#a0a0b0' }}>个</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                onClick={() => setShowGoalDialog(false)} 
                className="text-white/60 hover:text-white"
              >
                取消
              </Button>
              <Button 
                onClick={handleUpdateGoal} 
                className="text-white border-0"
                style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
              >
                确定
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
