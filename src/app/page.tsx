'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, GraduationCap, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* 头部导航 */}
        <div className="flex justify-end mb-8">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <User className="w-5 h-5" />
                <span>{user.nickname}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                登出
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button>
                <LogIn className="w-4 h-4 mr-2" />
                登录/注册
              </Button>
            </Link>
          )}
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            英语单词学习平台
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            收录雅思、托福、GRE、日常等10000+词汇，通过科学的练习方式，助你高效记忆单词
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* 单词库卡片 */}
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500">
            <Link href="/vocabulary">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                    <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">单词库</CardTitle>
                    <CardDescription className="text-base">
                      浏览所有词汇
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  收录雅思、托福、GRE、日常等10000+词汇，包含音标、释义和例句，支持分类浏览和搜索
                </p>
                <Button className="w-full mt-4" variant="outline">
                  进入单词库
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* 背单词卡片 */}
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-500">
            <Link href={user ? "/practice" : "/login"}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                    <GraduationCap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">背单词</CardTitle>
                    <CardDescription className="text-base">
                      开始练习
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  {user 
                    ? '选择词库进行练习，支持英译中和中译英随机模式，标记已掌握单词'
                    : '请先登录以开始背单词练习，系统将记录您的学习进度'
                  }
                </p>
                <Button className="w-full mt-4" variant="outline">
                  {user ? '开始练习' : '登录后练习'}
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* 统计信息 */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-white dark:bg-gray-800 rounded-full shadow-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">4</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">词库分类</div>
            </div>
            <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">10000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">精选单词</div>
            </div>
            <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">2</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">练习模式</div>
            </div>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">核心功能</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">智能学习</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  连续4次正确自动标记为已掌握，智能追踪学习进度
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">随机模式</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  每道题随机英译中或中译英，全面提升词汇能力
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">进度追踪</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  登录后记录学习数据，查看已掌握和未掌握单词
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
