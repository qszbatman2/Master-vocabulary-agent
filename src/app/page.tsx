'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BookOpen, GraduationCap, LogIn, LogOut, User, CheckCircle, RotateCcw, BookMarked, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-[#12121e] flex flex-col">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-6 flex-1 flex flex-col max-w-2xl">
        {/* 头部导航 */}
        <div className="flex justify-end mb-6">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <User className="w-4 h-4" />
                <span>{user.nickname}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-1" />
                登出
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white border-0"
              >
                <LogIn className="w-4 h-4 mr-1" />
                登录/注册
              </Button>
            </Link>
          )}
        </div>

        {/* 主标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            英语单词学习平台
          </h1>
          <p className="text-sm text-white/50">
            收录雅思、托福、GRE等词汇，助你高效记忆
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 单词库卡片 */}
          <Link href="/vocabulary" className="block">
            <div className="group bg-[#1e1e2e] rounded-2xl p-4 hover:bg-[#252535] transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/10 h-full shadow-lg hover:shadow-xl">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                  <BookOpen className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">单词库</h3>
                  <p className="text-xs text-white/40 mt-0.5">浏览词汇</p>
                </div>
              </div>
            </div>
          </Link>

          {/* 背单词卡片 */}
          <Link href={user ? "/practice" : "/login"} className="block">
            <div className="group bg-[#1e1e2e] rounded-2xl p-4 hover:bg-[#252535] transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/10 h-full shadow-lg hover:shadow-xl">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  <GraduationCap className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">背单词</h3>
                  <p className="text-xs text-white/40 mt-0.5">{user ? '开始练习' : '登录练习'}</p>
                </div>
                {user && dailyProgress && (
                  <button 
                    onClick={(e) => { e.preventDefault(); setShowGoalDialog(true); }}
                    className="text-xs text-white/50 hover:text-white/70"
                  >
                    今日 <span className="text-cyan-400 font-medium">{dailyProgress.completed}</span>/<span>{dailyProgress.dailyGoal}</span>
                  </button>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* 统计信息 */}
        {user && stats ? (
          <div className="space-y-4">
            {/* 累计统计 */}
            <div className="bg-[#1e1e2e] rounded-2xl p-4 border border-white/5 shadow-lg">
              <h3 className="text-sm font-medium text-white/60 mb-3">累计进度</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-lg font-bold text-green-400">{stats.total.masteredCount}</span>
                  </div>
                  <div className="text-xs text-white/40">已掌握</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <RotateCcw className="w-3 h-3 text-orange-400" />
                    <span className="text-lg font-bold text-orange-400">{stats.total.reviewingCount}</span>
                  </div>
                  <div className="text-xs text-white/40">复习中</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BookMarked className="w-3 h-3 text-blue-400" />
                    <span className="text-lg font-bold text-blue-400">{stats.total.newWordsCount}</span>
                  </div>
                  <div className="text-xs text-white/40">剩余新词</div>
                </div>
              </div>
              {/* 进度条 */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/40 mb-1.5">
                  <span>总进度</span>
                  <span>{stats.total.totalWords > 0 ? Math.round(stats.total.masteredCount / stats.total.totalWords * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total.totalWords > 0 ? Math.min(100, stats.total.masteredCount / stats.total.totalWords * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-6 px-6 py-3 bg-[#1e1e2e] rounded-full border border-white/5 shadow-lg">
              <div className="text-center">
                <div className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">16</div>
                <div className="text-xs text-white/40">词库</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">13K+</div>
                <div className="text-xs text-white/40">单词</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">2</div>
                <div className="text-xs text-white/40">模式</div>
              </div>
            </div>
          </div>
        )}

        {/* 功能说明 */}
        <div className="mt-6">
          <h2 className="text-sm font-medium text-white/60 text-center mb-3">核心功能</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { title: '智能学习', desc: '连续4天答对' },
              { title: '随机模式', desc: '英译中/中译英' },
              { title: '进度追踪', desc: '记录学习数据' },
            ].map((item, i) => (
              <div key={i} className="bg-[#1e1e2e] rounded-xl p-3 text-center border border-white/5">
                <h4 className="text-xs font-medium text-white/80">{item.title}</h4>
                <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 目标设置弹窗 */}
        <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
          <DialogContent className="sm:max-w-sm bg-[#1e1e2e] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">设置每日学习目标</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {[50, 100, 200, 300, 500].map(g => (
                  <Button
                    key={g}
                    variant={newGoal === g.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewGoal(g.toString())}
                    className={newGoal === g.toString() 
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 border-0" 
                      : "border-white/20 text-white/60 hover:text-white hover:bg-white/10"
                    }
                  >
                    {g}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/50">自定义：</span>
                <Input
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="w-20 bg-white/5 border-white/10 text-white"
                  min={1}
                  max={1000}
                />
                <span className="text-sm text-white/50">个</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowGoalDialog(false)} className="text-white/60 hover:text-white">
                取消
              </Button>
              <Button onClick={handleUpdateGoal} className="bg-gradient-to-r from-pink-500 to-purple-500 border-0">
                确定
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
