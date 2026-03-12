'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, GraduationCap, LogIn, LogOut, User, TrendingUp, CheckCircle, RotateCcw, BookMarked, Sparkles, Moon, Sun } from 'lucide-react';
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

export default function Home() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 检测深色模式
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    
    // 监听主题变化
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchStats();
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

  const handleLogout = () => {
    logout();
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col relative overflow-hidden",
      isDark 
        ? "bg-[#121212]" 
        : "bg-gradient-to-br from-pink-50 via-white to-cyan-50"
    )}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-30",
          isDark ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20" : "bg-gradient-to-br from-pink-200 to-cyan-200"
        )} />
        <div className={cn(
          "absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full blur-3xl opacity-20",
          isDark ? "bg-gradient-to-tr from-purple-500/20 to-cyan-500/20" : "bg-gradient-to-tr from-cyan-200 to-purple-200"
        )} />
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col relative z-10">
        {/* 头部导航 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isDark ? "bg-[#1E1E1E] neon-border" : "bg-white shadow-lg"
            )}>
              <Sparkles className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <span className={cn(
              "font-bold text-lg",
              isDark ? "text-white neon-text" : "text-gray-900"
            )}>
              Vocab
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 深浅模式切换 */}
            <button
              onClick={toggleTheme}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isDark 
                  ? "bg-[#1E1E1E] hover:bg-[#2A2A2A] neon-border" 
                  : "bg-white shadow-md hover:shadow-lg"
              )}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-[#00E5FF]" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            {user ? (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                  isDark ? "bg-[#1E1E1E] text-white" : "bg-white shadow-sm text-gray-700"
                )}>
                  <User className="w-4 h-4 text-[#00E5FF]" />
                  <span>{user.nickname}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all",
                    isDark 
                      ? "bg-[#1E1E1E] text-gray-400 hover:text-white hover:bg-[#2A2A2A]" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  登出
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#00E5FF] text-black font-medium text-sm neon-glow hover:neon-glow-strong transition-all">
                  <LogIn className="w-4 h-4" />
                  登录
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* 主标题 */}
        <div className="text-center mb-8">
          <h1 className={cn(
            "text-3xl md:text-5xl font-bold mb-3",
            isDark ? "text-white" : "text-gray-900"
          )}>
            <span className="gradient-text">背单词</span>
          </h1>
          <p className={cn(
            "text-sm md:text-base",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            今天学习了吗？每天进步一点点
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
          {/* 单词库卡片 */}
          <Link href="/vocabulary" className="block">
            <div className={cn(
              "group p-4 rounded-2xl transition-all duration-300 cursor-pointer card-hover h-full",
              isDark 
                ? "bg-[#1E1E1E] neon-border hover:neon-glow" 
                : "bg-white shadow-lg hover:shadow-xl border border-gray-100"
            )}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  isDark ? "bg-[#00E5FF]/10" : "bg-cyan-50"
                )}>
                  <BookOpen className="w-7 h-7 text-[#00E5FF]" />
                </div>
                <div>
                  <div className={cn(
                    "font-bold text-lg mb-1",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    单词库
                  </div>
                  <div className={cn(
                    "text-xs",
                    isDark ? "text-gray-500" : "text-gray-500"
                  )}>
                    13,220 词
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 背单词卡片 */}
          <Link href={user ? "/practice" : "/login"} className="block">
            <div className={cn(
              "group p-4 rounded-2xl transition-all duration-300 cursor-pointer card-hover h-full",
              isDark 
                ? "bg-[#00E5FF] neon-glow-strong" 
                : "bg-gradient-to-br from-cyan-400 to-cyan-500 shadow-lg"
            )}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/20">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg mb-1 text-white">
                    背单词
                  </div>
                  <div className="text-xs text-white/80">
                    {user ? '开始练习' : '登录练习'}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 统计信息 */}
        <div className="max-w-md mx-auto w-full">
          {user && stats ? (
            <div className="space-y-4">
              {/* 今日统计 */}
              <div className={cn(
                "p-4 rounded-2xl",
                isDark ? "bg-[#1E1E1E] neon-border" : "bg-white shadow-lg"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[#00E5FF]" />
                  <span className={cn(
                    "text-sm font-medium",
                    isDark ? "text-white" : "text-gray-900"
                  )}>今日学习</span>
                </div>
                <div className="flex justify-around">
                  <div className="text-center">
                    <div className={cn(
                      "text-2xl font-bold",
                      isDark ? "text-[#00E5FF] neon-text" : "text-cyan-500"
                    )}>{stats.today.practicedCount}</div>
                    <div className={cn(
                      "text-xs mt-1",
                      isDark ? "text-gray-500" : "text-gray-500"
                    )}>已背单词</div>
                  </div>
                  <div className={cn(
                    "w-px h-10",
                    isDark ? "bg-[#2A2A2A]" : "bg-gray-200"
                  )} />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{stats.today.masteredCount}</div>
                    <div className={cn(
                      "text-xs mt-1",
                      isDark ? "text-gray-500" : "text-gray-500"
                    )}>今日掌握</div>
                  </div>
                </div>
              </div>

              {/* 累计统计 */}
              <div className={cn(
                "p-4 rounded-2xl",
                isDark ? "bg-[#1E1E1E] neon-border" : "bg-white shadow-lg"
              )}>
                <div className={cn(
                  "text-sm font-medium mb-3",
                  isDark ? "text-white" : "text-gray-900"
                )}>累计进度</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className={cn(
                    "text-center p-3 rounded-xl",
                    isDark ? "bg-green-500/10" : "bg-green-50"
                  )}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xl font-bold text-green-500">{stats.total.masteredCount}</span>
                    </div>
                    <div className={cn(
                      "text-xs",
                      isDark ? "text-gray-500" : "text-gray-500"
                    )}>已掌握</div>
                  </div>
                  <div className={cn(
                    "text-center p-3 rounded-xl",
                    isDark ? "bg-orange-500/10" : "bg-orange-50"
                  )}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <RotateCcw className="w-3 h-3 text-orange-500" />
                      <span className="text-xl font-bold text-orange-500">{stats.total.reviewingCount}</span>
                    </div>
                    <div className={cn(
                      "text-xs",
                      isDark ? "text-gray-500" : "text-gray-500"
                    )}>复习中</div>
                  </div>
                  <div className={cn(
                    "text-center p-3 rounded-xl",
                    isDark ? "bg-[#00E5FF]/10" : "bg-cyan-50"
                  )}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <BookMarked className="w-3 h-3 text-[#00E5FF]" />
                      <span className="text-xl font-bold text-[#00E5FF]">{stats.total.newWordsCount}</span>
                    </div>
                    <div className={cn(
                      "text-xs",
                      isDark ? "text-gray-500" : "text-gray-500"
                    )}>剩余新词</div>
                  </div>
                </div>
                
                {/* 进度条 */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className={isDark ? "text-gray-500" : "text-gray-500"}>总进度</span>
                    <span className="text-[#00E5FF] font-medium">
                      {stats.total.totalWords > 0 ? Math.round(stats.total.masteredCount / stats.total.totalWords * 100) : 0}%
                    </span>
                  </div>
                  <div className={cn(
                    "h-2 rounded-full overflow-hidden",
                    isDark ? "bg-[#2A2A2A]" : "bg-gray-100"
                  )}>
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${stats.total.totalWords > 0 ? Math.min(100, stats.total.masteredCount / stats.total.totalWords * 100) : 0}%`,
                        background: 'linear-gradient(90deg, #00E5FF 0%, #D900FF 100%)',
                        boxShadow: '0 0 10px rgba(0, 229, 255, 0.5)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 未登录状态 */
            <div className={cn(
              "inline-flex items-center gap-6 px-6 py-4 rounded-2xl mx-auto",
              isDark ? "bg-[#1E1E1E] neon-border" : "bg-white shadow-lg"
            )}>
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-[#00E5FF] neon-text" : "text-cyan-500"
                )}>16</div>
                <div className={cn(
                  "text-xs mt-1",
                  isDark ? "text-gray-500" : "text-gray-500"
                )}>词库</div>
              </div>
              <div className={cn(
                "w-px h-10",
                isDark ? "bg-[#2A2A2A]" : "bg-gray-200"
              )} />
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-[#E5FF00]" : "text-yellow-500"
                )}>13K+</div>
                <div className={cn(
                  "text-xs mt-1",
                  isDark ? "text-gray-500" : "text-gray-500"
                )}>单词</div>
              </div>
              <div className={cn(
                "w-px h-10",
                isDark ? "bg-[#2A2A2A]" : "bg-gray-200"
              )} />
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-[#D900FF]" : "text-purple-500"
                )}>2</div>
                <div className={cn(
                  "text-xs mt-1",
                  isDark ? "text-gray-500" : "text-gray-500"
                )}>模式</div>
              </div>
            </div>
          )}
        </div>

        {/* 功能说明 */}
        <div className="max-w-md mx-auto w-full mt-8">
          <h2 className={cn(
            "text-lg font-bold text-center mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>核心功能</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: "智能学习", desc: "4天掌握机制", icon: "🧠" },
              { title: "错题复习", desc: "自动记录错题", icon: "🔄" },
              { title: "多词库", desc: "雅思托福GRE", icon: "📚" },
            ].map((item, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-xl text-center",
                  isDark ? "bg-[#1E1E1E]" : "bg-white shadow-sm"
                )}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isDark ? "text-white" : "text-gray-900"
                )}>{item.title}</div>
                <div className={cn(
                  "text-xs",
                  isDark ? "text-gray-500" : "text-gray-500"
                )}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
