'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BookOpen, GraduationCap, LogIn, LogOut, User, CheckCircle, RotateCcw, BookMarked, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  today: { practicedCount: number; masteredCount: number; };
  total: { masteredCount: number; reviewingCount: number; newWordsCount: number; totalWords: number; };
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
  const [history, setHistory] = useState<Array<{ date: string; correctCount: number }>>([]);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState('200');
  const [isLoaded, setIsLoaded] = useState(false);

  // 计算累计打卡天数
  const streakDays = history.filter(h => h.correctCount > 0).length;

  // 计算连续打卡天数
  const consecutiveDays = (() => {
    if (history.length === 0) return 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayRecord = history.find(h => h.date === todayStr);
    if (!todayRecord || todayRecord.correctCount === 0) return 0;
    const dateSet = new Set(history.filter(h => h.correctCount > 0).map(h => h.date));
    let count = 0;
    let currentDate = new Date(today);
    while (dateSet.has(currentDate.toISOString().split('T')[0])) {
      count++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    return count;
  })();

  useEffect(() => {
    setIsLoaded(true);
    if (user && token) {
      fetchStats();
      fetchDailyProgress();
      fetchHistory();
    }
  }, [user, token]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/stats/dashboard?days=365', { headers: { authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats', { headers: { authorization: `Bearer ${token}` } });
      if (response.ok) setStats(await response.json());
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchDailyProgress = async () => {
    try {
      const response = await fetch('/api/daily-progress', { headers: { authorization: `Bearer ${token}` } });
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
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
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
    <div className="min-h-screen flex flex-col overflow-hidden safe-area-top" style={{ background: '#12121e' }}>
      {/* 背景网格纹理 */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* 背景渐变光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse"
          style={{ 
            background: 'linear-gradient(135deg, #ff6b9d, #c44cff)',
            opacity: 0.25,
            animationDuration: '4s'
          }}
        />
        <div 
          className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse"
          style={{ 
            background: 'linear-gradient(135deg, #00f0ff, #7c4dff)',
            opacity: 0.15,
            animationDuration: '5s',
            animationDelay: '1s'
          }}
        />
        <div 
          className="absolute -bottom-20 right-1/4 w-[450px] h-[450px] rounded-full blur-[100px] animate-pulse"
          style={{ 
            background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
            opacity: 0.2,
            animationDuration: '6s',
            animationDelay: '2s'
          }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-8 flex-1 flex flex-col max-w-2xl">
        {/* 头部导航 - 入场动画 */}
        <div 
          className="flex justify-between items-center mb-10 transition-all duration-700"
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)'
          }}
        >
          <div className="text-white/40 text-sm font-medium tracking-wider">
            VOCABULARY
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#a0a0b0' }}>
                <User className="w-4 h-4" />
                <span>{user.nickname}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-white/50 hover:text-white hover:bg-white/10 border-0 transition-all duration-200 active:scale-95"
              >
                <LogOut className="w-4 h-4 mr-1" />
                登出
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button 
                size="sm"
                className="text-white border-0 font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
              >
                <LogIn className="w-4 h-4 mr-1" />
                登录
              </Button>
            </Link>
          )}
        </div>

        {/* 主标题区域 - 入场动画 */}
        <div 
          className="mb-10 transition-all duration-700 delay-100"
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {user ? `Hello, ${user.nickname} 👋` : '英语单词学习平台'}
          </h1>
          <p className="text-base" style={{ color: '#a0a0b0' }}>
            {user ? '开始今天的学习吧' : '登录后记录学习进度'}
          </p>
        </div>

        {/* 功能卡片 - 入场动画 */}
        <div className="grid grid-cols-2 gap-5 mb-10">
          {/* 背单词卡片 */}
          <Link href={user ? "/practice" : "/login"} className="block">
            <div 
              className="group relative rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] h-full overflow-hidden"
              style={{ 
                background: '#1e1e2e',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
                transitionDelay: '200ms'
              }}
            >
              {/* 边缘发光效果 */}
              <div 
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: '0 0 30px rgba(0, 240, 255, 0.3), inset 0 0 30px rgba(0, 240, 255, 0.05)'
                }}
              />
              <div className="relative flex flex-col items-center text-center gap-4">
                <div 
                  className="p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110 animate-pulse"
                  style={{ 
                    background: 'linear-gradient(135deg, #00f0ff, #7c4dff)',
                    animationDuration: '3s'
                  }}
                >
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">背单词</h3>
                  <p className="text-sm mt-1" style={{ color: '#a0a0b0' }}>
                    {user ? '开始练习' : '登录练习'}
                  </p>
                </div>
                {user && dailyProgress && (
                  <button 
                    onClick={(e) => { e.preventDefault(); setShowGoalDialog(true); }}
                    className="text-sm px-4 py-1.5 rounded-full transition-all duration-200 hover:scale-105"
                    style={{ 
                      color: '#00f0ff',
                      background: 'rgba(0, 240, 255, 0.1)'
                    }}
                  >
                    今日 {dailyProgress.completed}/{dailyProgress.dailyGoal}
                  </button>
                )}
              </div>
            </div>
          </Link>

          {/* 单词库卡片 */}
          <Link href="/vocabulary" className="block">
            <div 
              className="group relative rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] h-full overflow-hidden"
              style={{ 
                background: '#1e1e2e',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
                transitionDelay: '300ms'
              }}
            >
              {/* 边缘发光效果 */}
              <div 
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: '0 0 30px rgba(255, 107, 157, 0.3), inset 0 0 30px rgba(255, 107, 157, 0.05)'
                }}
              />
              <div className="relative flex flex-col items-center text-center gap-4">
                <div 
                  className="p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff)' }}
                >
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">单词库</h3>
                  <p className="text-sm mt-1" style={{ color: '#a0a0b0' }}>浏览全部词汇</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 打卡统计卡片 */}
        {user && (
          <Link href="/stats">
            <div className="flex items-center justify-center gap-8 p-4 mb-4 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(0,0,0,0.14)' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#a0a0b0' }}>累计</span>
                <span className="text-xl font-bold" style={{ color: '#4ade80' }}>{streakDays}</span>
                <span className="text-sm" style={{ color: '#a0a0b0' }}>天</span>
              </div>
              <div className="w-px h-6 bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#a0a0b0' }}>连续</span>
                <span className="text-xl font-bold" style={{ color: '#fbbf24' }}>{consecutiveDays}</span>
                <span className="text-sm" style={{ color: '#a0a0b0' }}>天</span>
              </div>
            </div>
          </Link>
        )}

        {/* 统计信息 - 入场动画 */}
        {user && stats ? (
          <div
            className="group relative rounded-3xl p-6 mb-8 overflow-hidden transition-all duration-700"
            style={{
              background: '#1e1e2e',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '350ms'
            }}
          >
            {/* 边缘发光效果 */}
            <div
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                boxShadow: '0 0 30px rgba(0, 255, 136, 0.2), inset 0 0 30px rgba(0, 255, 136, 0.03)'
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4" style={{ color: '#a0a0b0' }} />
                <span className="text-sm font-medium" style={{ color: '#a0a0b0' }}>累计进度</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div
                  className="text-center p-4 rounded-2xl transition-transform duration-200 hover:scale-105"
                  style={{ background: 'rgba(0, 255, 136, 0.08)' }}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <CheckCircle className="w-4 h-4" style={{ color: '#00ff88' }} />
                    <span className="text-2xl font-bold" style={{ color: '#00ff88' }}>
                      {stats.total.masteredCount}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: '#a0a0b0' }}>已掌握</div>
                </div>
                <div
                  className="text-center p-4 rounded-2xl transition-transform duration-200 hover:scale-105"
                  style={{ background: 'rgba(255, 107, 157, 0.08)' }}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <RotateCcw className="w-4 h-4" style={{ color: '#ff6b9d' }} />
                    <span className="text-2xl font-bold" style={{ color: '#ff6b9d' }}>
                      {stats.total.reviewingCount}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: '#a0a0b0' }}>复习中</div>
                </div>
                <div
                  className="text-center p-4 rounded-2xl transition-transform duration-200 hover:scale-105"
                  style={{ background: 'rgba(0, 240, 255, 0.08)' }}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <BookMarked className="w-4 h-4" style={{ color: '#00f0ff' }} />
                    <span className="text-2xl font-bold" style={{ color: '#00f0ff' }}>
                      {stats.total.newWordsCount}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: '#a0a0b0' }}>剩余新词</div>
                </div>
              </div>

              {/* 进度条 */}
              <div>
                <div className="flex justify-between text-sm mb-2" style={{ color: '#a0a0b0' }}>
                  <span>总进度</span>
                  <span className="font-medium" style={{ color: '#00ff88' }}>
                    {stats.total.totalWords > 0 ? Math.round(stats.total.masteredCount / stats.total.totalWords * 100) : 0}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${stats.total.totalWords > 0 ? Math.min(100, stats.total.masteredCount / stats.total.totalWords * 100) : 0}%`,
                      background: 'linear-gradient(135deg, #00ff88, #00d4ff)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 未登录状态统计 */
          <div
            className="rounded-3xl p-6 mb-8 text-center transition-all duration-700"
            style={{
              background: '#1e1e2e',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '350ms'
            }}
          >
            <div className="flex items-center justify-center gap-10">
              {[
                { value: '16', label: '词库', gradient: 'linear-gradient(135deg, #ff6b9d, #c44cff)' },
                { value: '13K+', label: '单词', gradient: 'linear-gradient(135deg, #00f0ff, #7c4dff)' },
                { value: '2', label: '模式', gradient: 'linear-gradient(135deg, #00ff88, #00d4ff)' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{
                      background: item.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {item.value}
                  </div>
                  <div className="text-xs" style={{ color: '#a0a0b0' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 功能说明 - 入场动画 */}
        <div
          className="transition-all duration-700"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
            transitionDelay: '450ms'
          }}
        >
          <h2 className="text-sm font-medium text-center mb-4" style={{ color: '#a0a0b0' }}>核心功能</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: '智能学习', desc: '连续4天答对' },
              { title: '随机模式', desc: '英译中/中译英' },
              { title: '进度追踪', desc: '记录学习数据' },
            ].map((item, i) => (
              <div 
                key={i} 
                className="group rounded-2xl p-4 text-center transition-all duration-200 hover:scale-105 cursor-default"
                style={{ background: '#1e1e2e' }}
              >
                <h4 className="text-sm font-medium text-white group-hover:text-white/90">{item.title}</h4>
                <p className="text-xs mt-1" style={{ color: '#a0a0b0' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 文章导入入口 - 入场动画 */}
        <div
          className="transition-all duration-700 mt-6"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
            transitionDelay: '500ms'
          }}
        >
          <Link href="/article-import" className="block">
            <div 
              className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] overflow-hidden"
              style={{ 
                background: '#1e1e2e',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* 边缘发光效果 */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: '0 0 20px rgba(124, 77, 255, 0.2), inset 0 0 20px rgba(124, 77, 255, 0.03)'
                }}
              />
              <div className="relative flex items-center gap-4">
                <div 
                  className="p-3 rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: 'linear-gradient(135deg, #7c4dff, #ff6b9d)' }}
                >
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-white">从文章添加生词</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#a0a0b0' }}>粘贴英文文章，点选生词加入复习</p>
                </div>
                <div className="text-white/30 group-hover:text-white/50 transition-colors">→</div>
              </div>
            </div>
          </Link>
        </div>

        {/* 目标设置弹窗 */}
        <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
          <DialogContent 
            className="sm:max-w-sm border-0"
            style={{ background: '#1e1e2e', borderRadius: '24px' }}
          >
            <DialogHeader>
              <DialogTitle className="text-white text-lg">设置每日学习目标</DialogTitle>
            </DialogHeader>
            <div className="py-5">
              <div className="flex flex-wrap gap-3 mb-5">
                {[50, 100, 200, 300, 500].map(g => (
                  <Button
                    key={g}
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewGoal(g.toString())}
                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                    style={
                      newGoal === g.toString() 
                        ? { background: 'linear-gradient(135deg, #ff6b9d, #c44cff)', color: 'white', border: 'none' } 
                        : { color: '#a0a0b0', background: 'rgba(255,255,255,0.05)' }
                    }
                  >
                    {g}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: '#a0a0b0' }}>自定义</span>
                <Input
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="w-24 bg-white/5 border-white/10 text-white text-center"
                  min={1}
                  max={1000}
                />
                <span className="text-sm" style={{ color: '#a0a0b0' }}>个/天</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowGoalDialog(false)} 
                className="text-white/60 hover:text-white transition-all duration-200"
              >
                取消
              </Button>
              <Button 
                onClick={handleUpdateGoal} 
                className="text-white border-0 transition-all duration-200 hover:scale-105 active:scale-95"
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
