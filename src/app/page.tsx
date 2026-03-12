'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BookOpen, GraduationCap, LogIn, LogOut, User, TrendingUp, CheckCircle, RotateCcw, BookMarked, Settings, Flame, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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

// 火焰进度组件
function FireProgress({ 
  completed, 
  goal, 
  onSettingsClick 
}: { 
  completed: number; 
  goal: number; 
  onSettingsClick: () => void;
}) {
  const progress = Math.min(100, Math.round((completed / goal) * 100));
  const isCompleted = completed >= goal;
  
  // 计算火焰数量（0-10个）
  const fireCount = Math.min(10, Math.floor(progress / 10));
  
  return (
    <div className="relative py-1">
      {/* 火焰进度条 */}
      <div className="flex items-center justify-center gap-0.5 mb-1">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "transition-all duration-300 transform",
              i < fireCount ? "scale-100 opacity-100" : "scale-75 opacity-30"
            )}
          >
            <Flame 
              className={cn(
                "w-4 h-4",
                i < fireCount 
                  ? "text-orange-500 animate-pulse" 
                  : "text-gray-300 dark:text-gray-600"
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          </div>
        ))}
      </div>
      
      {/* 进度文字 */}
      <div className="flex items-center justify-center gap-2">
        {isCompleted ? (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
            <Sparkles className="w-4 h-4 animate-bounce" />
            <span className="font-bold">目标达成！</span>
            <Sparkles className="w-4 h-4 animate-bounce" />
          </div>
        ) : (
          <span className="text-base font-bold text-gray-900 dark:text-white">
            <span className="text-orange-500">{completed}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-600">{goal}</span>
          </span>
        )}
      </div>
      
      {/* 设置按钮 */}
      <button
        onClick={onSettingsClick}
        className="absolute right-0 top-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        <Settings className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
      </button>
    </div>
  );
}

export default function Home() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
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
        headers: {
          authorization: `Bearer ${token}`,
        },
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
        headers: {
          authorization: `Bearer ${token}`,
        },
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
    if (!goal || goal < 1 || goal > 1000) {
      return;
    }
    
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

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
        {/* 头部导航 */}
        <div className="flex justify-end mb-4">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-sm">
                <User className="w-4 h-4" />
                <span>{user.nickname}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1" />
                登出
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">
                <LogIn className="w-4 h-4 mr-1" />
                登录/注册
              </Button>
            </Link>
          )}
        </div>

        {/* 主标题 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            英语单词学习平台
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
            收录雅思、托福、GRE、日常等词汇，助你高效记忆单词
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 md:max-w-4xl md:mx-auto mb-6">
          {/* 单词库卡片 */}
          <Link href="/vocabulary" className="block">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 h-full">
              <CardHeader className="p-3 md:p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base md:text-xl">单词库</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      浏览词汇
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 hidden md:block">
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                  雅思、托福、GRE等词汇
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 背单词卡片 */}
          <Link href={user ? "/practice" : "/login"} className="block">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-purple-500 h-full">
              <CardHeader className="p-3 md:p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-2 md:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base md:text-xl">背单词</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      {user ? '开始练习' : '登录练习'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 hidden md:block">
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                  {user ? '英译中/中译英随机模式' : '登录后记录学习进度'}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 统计信息 */}
        <div className="mb-4">
          {user && stats ? (
            <div className="max-w-2xl mx-auto">
              {/* 今日学习进度 - 火焰进度条 */}
              <Card className="mb-2">
                <CardHeader className="p-2 pb-1">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    今日学习进度
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  {dailyProgress ? (
                    <FireProgress 
                      completed={dailyProgress.completed}
                      goal={dailyProgress.dailyGoal}
                      onSettingsClick={() => setShowGoalDialog(true)}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 目标设置弹窗 */}
              <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>设置每日学习目标</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[50, 100, 200, 300, 500].map(g => (
                        <Button
                          key={g}
                          variant={newGoal === g.toString() ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewGoal(g.toString())}
                        >
                          {g} 个
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">自定义：</span>
                      <Input
                        type="number"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        className="w-24"
                        min={1}
                        max={1000}
                      />
                      <span className="text-sm text-gray-500">个单词</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                      取消
                    </Button>
                    <Button onClick={handleUpdateGoal}>
                      确定
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* 累计统计 */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm">累计进度</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-lg md:text-xl font-bold text-green-600">{stats.total.masteredCount}</span>
                      </div>
                      <div className="text-xs text-gray-500">已掌握</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <RotateCcw className="w-3 h-3 text-orange-500" />
                        <span className="text-lg md:text-xl font-bold text-orange-600">{stats.total.reviewingCount}</span>
                      </div>
                      <div className="text-xs text-gray-500">复习中</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BookMarked className="w-3 h-3 text-blue-500" />
                        <span className="text-lg md:text-xl font-bold text-blue-600">{stats.total.newWordsCount}</span>
                      </div>
                      <div className="text-xs text-gray-500">剩余新词</div>
                    </div>
                  </div>
                  {/* 进度条 */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>总进度</span>
                      <span>{stats.total.totalWords > 0 ? Math.round(stats.total.masteredCount / stats.total.totalWords * 100) : 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-300"
                        style={{ width: `${stats.total.totalWords > 0 ? Math.min(100, stats.total.masteredCount / stats.total.totalWords * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center gap-4 md:gap-8 px-4 py-2 md:px-8 md:py-4 bg-white dark:bg-gray-800 rounded-full shadow-md text-xs md:text-sm">
                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400">8</div>
                  <div className="text-gray-600 dark:text-gray-400">词库</div>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-400">8500+</div>
                  <div className="text-gray-600 dark:text-gray-400">单词</div>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">2</div>
                  <div className="text-gray-600 dark:text-gray-400">模式</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 功能说明 */}
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-lg md:text-xl font-bold text-center mb-4 text-gray-900 dark:text-white">核心功能</h2>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <Card className="p-2 md:p-4">
              <CardHeader className="p-0 mb-1 md:mb-2">
                <CardTitle className="text-xs md:text-base">智能学习</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                  连续4次正确自动掌握
                </p>
              </CardContent>
            </Card>
            <Card className="p-2 md:p-4">
              <CardHeader className="p-0 mb-1 md:mb-2">
                <CardTitle className="text-xs md:text-base">随机模式</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                  英译中/中译英随机
                </p>
              </CardContent>
            </Card>
            <Card className="p-2 md:p-4">
              <CardHeader className="p-0 mb-1 md:mb-2">
                <CardTitle className="text-xs md:text-base">进度追踪</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                  记录学习数据
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
