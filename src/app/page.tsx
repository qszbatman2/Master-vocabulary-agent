'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, LogIn, LogOut, User, RotateCcw, BookMarked, Sparkles, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Stats {
  today: { practicedCount: number; masteredCount: number; };
  total: { masteredCount: number; reviewingCount: number; newWordsCount: number; totalWords: number; };
}

export default function Home() {
  const { user, logout, token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (user && token) fetchStats();
  }, [user, token]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats', { headers: { authorization: `Bearer ${token}` } });
      if (response.ok) setStats(await response.json());
    } catch (error) { console.error('Failed to fetch stats:', error); }
  };

  const toggleTheme = () => document.documentElement.classList.toggle('dark');

  return (
    <div className={cn("min-h-screen flex flex-col", isDark ? "bg-[#121212]" : "bg-gray-50")}>
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col max-w-md">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-[#1E1E1E] border border-[#333]" : "bg-white shadow")}>
              <Sparkles className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <span className={cn("font-bold text-lg", isDark ? "text-white" : "text-gray-900")}>Vocab</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333]" : "bg-white shadow hover:shadow-md")}>
              {isDark ? <Sun className="w-5 h-5 text-[#00E5FF]" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-2">
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm", isDark ? "bg-[#1E1E1E] text-white border border-[#333]" : "bg-white shadow text-gray-700")}>
                  <User className="w-4 h-4 text-[#00E5FF]" />
                  <span>{user.nickname}</span>
                </div>
                <button onClick={logout} className={cn("flex items-center gap-1 px-3 py-1.5 rounded-full text-sm", isDark ? "bg-[#1E1E1E] text-gray-400 hover:text-white hover:bg-[#2A2A2A] border border-[#333]" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                  <LogOut className="w-4 h-4" />登出
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#00E5FF] text-black font-medium text-sm hover:bg-[#00C8DC]">
                  <LogIn className="w-4 h-4" />登录
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className={cn("text-3xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>背单词</h1>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>今天学习了吗？每天进步一点点</p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/vocabulary" className="block">
            <div className={cn("p-4 rounded-xl text-center", isDark ? "bg-[#1E1E1E] hover:bg-[#252525] border border-[#333]" : "bg-white shadow hover:shadow-md border border-gray-100")}>
              <div className={cn("w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center", isDark ? "bg-[#00E5FF]/10" : "bg-cyan-50")}>
                <BookOpen className="w-6 h-6 text-[#00E5FF]" />
              </div>
              <div className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>单词库</div>
              <div className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>{stats?.total.totalWords || 0} 词</div>
            </div>
          </Link>

          <Link href="/practice" className="block">
            <div className={cn("p-4 rounded-xl text-center", isDark ? "bg-[#1E1E1E] hover:bg-[#252525] border border-[#333]" : "bg-white shadow hover:shadow-md border border-gray-100")}>
              <div className={cn("w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center", isDark ? "bg-[#00E5FF]/10" : "bg-cyan-50")}>
                <GraduationCap className="w-6 h-6 text-[#00E5FF]" />
              </div>
              <div className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>背单词</div>
              <div className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>无尽模式</div>
            </div>
          </Link>

          <Link href="/practice?mode=wrong_words" className="block">
            <div className={cn("p-4 rounded-xl text-center", isDark ? "bg-[#1E1E1E] hover:bg-[#252525] border border-[#333]" : "bg-white shadow hover:shadow-md border border-gray-100")}>
              <div className={cn("w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center", isDark ? "bg-[#00E5FF]/10" : "bg-cyan-50")}>
                <RotateCcw className="w-6 h-6 text-[#00E5FF]" />
              </div>
              <div className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>错题集</div>
              <div className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>{stats?.total.reviewingCount || 0} 词待复习</div>
            </div>
          </Link>

          <Link href="/vocabulary?filter=mastered" className="block">
            <div className={cn("p-4 rounded-xl text-center", isDark ? "bg-[#1E1E1E] hover:bg-[#252525] border border-[#333]" : "bg-white shadow hover:shadow-md border border-gray-100")}>
              <div className={cn("w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center", isDark ? "bg-[#00E5FF]/10" : "bg-cyan-50")}>
                <BookMarked className="w-6 h-6 text-[#00E5FF]" />
              </div>
              <div className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>已掌握</div>
              <div className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>{stats?.total.masteredCount || 0} 词</div>
            </div>
          </Link>
        </div>

        {/* 今日统计 */}
        {user && stats && (
          <div className={cn("p-4 rounded-xl mb-6", isDark ? "bg-[#1E1E1E] border border-[#333]" : "bg-white shadow border border-gray-100")}>
            <div className={cn("text-sm font-medium mb-3", isDark ? "text-white" : "text-gray-900")}>今日进度</div>
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("p-3 rounded-lg", isDark ? "bg-[#252525]" : "bg-gray-50")}>
                <div className="text-xl font-bold text-[#00E5FF]">{stats.today.practicedCount}</div>
                <div className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>已练习</div>
              </div>
              <div className={cn("p-3 rounded-lg", isDark ? "bg-[#252525]" : "bg-gray-50")}>
                <div className="text-xl font-bold text-[#00E5FF]">{stats.today.masteredCount}</div>
                <div className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>已掌握</div>
              </div>
            </div>
          </div>
        )}

        {/* 底部提示 */}
        {!user && (
          <div className={cn("mt-auto p-4 rounded-xl text-center", isDark ? "bg-[#1E1E1E] border border-[#333]" : "bg-white shadow")}>
            <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>登录后可记录学习进度</p>
            <Link href="/login">
              <button className="mt-2 w-full py-2 rounded-lg bg-[#00E5FF] text-black font-medium hover:bg-[#00C8DC]">
                立即登录
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
