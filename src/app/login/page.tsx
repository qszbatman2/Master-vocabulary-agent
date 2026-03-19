'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Mail, Lock, User, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerNickname, setRegisterNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { login, register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(loginEmail, loginPassword, rememberMe);
    
    setLoading(false);
    
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || '登录失败');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(registerEmail, registerPassword, registerNickname);
    
    setLoading(false);
    
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || '注册失败');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{ background: '#12121e' }}>
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
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse"
          style={{ 
            background: 'linear-gradient(135deg, #ff6b9d, #c44cff)',
            opacity: 0.2,
            animationDuration: '4s'
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse"
          style={{ 
            background: 'linear-gradient(135deg, #00f0ff, #7c4dff)',
            opacity: 0.15,
            animationDuration: '5s',
            animationDelay: '1s'
          }}
        />
      </div>

      {/* 页面顶部返回按钮 */}
      <Link href="/" className="fixed z-50 safe-area-top" style={{ top: 0, left: 0, paddingLeft: '1.5rem', paddingTop: '1.5rem' }}>
        <button 
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          style={{ background: 'rgba(30, 30, 46, 0.8)', color: '#a0a0b0', backdropFilter: 'blur(8px)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </Link>

      {/* 登录卡片 */}
      <div 
        className="relative w-full max-w-sm transition-all duration-700"
        style={{ 
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(30px)'
        }}
      >
        {/* Logo区域 */}
        <div 
          className="text-center mb-6 transition-all duration-700 delay-100"
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-transform duration-300 hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">欢迎回来</h1>
          <p className="text-sm" style={{ color: '#a0a0b0' }}>登录开始学习之旅</p>
        </div>

        {/* 卡片主体 */}
        <div 
          className="rounded-3xl p-6 transition-all duration-700 delay-200 group relative"
          style={{ 
            background: '#1e1e2e',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(30px)'
          }}
        >
          {/* 边缘发光效果 */}
          <div 
            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              boxShadow: '0 0 30px rgba(196, 76, 255, 0.2), inset 0 0 30px rgba(196, 76, 255, 0.03)'
            }}
          />

          <Tabs defaultValue="login" className="w-full relative">
            <TabsList 
              className="grid w-full grid-cols-2 h-11 rounded-xl mb-5 relative p-1"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <TabsTrigger 
                value="login" 
                className="rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=inactive]:text-gray-400"
              >
                登录
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=inactive]:text-gray-400"
              >
                注册
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-xs" style={{ color: '#a0a0b0' }}>邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a0a0b0' }} />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="h-11 pl-10 text-sm rounded-xl border-0 transition-all duration-200 focus:ring-2"
                      style={{ 
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white'
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-xs" style={{ color: '#a0a0b0' }}>密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a0a0b0' }} />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="请输入密码"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="h-11 pl-10 text-sm rounded-xl border-0 transition-all duration-200 focus:ring-2"
                      style={{ 
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white'
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-white/20 data-[state=checked]:border-0 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-purple-500"
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-xs cursor-pointer"
                    style={{ color: '#a0a0b0' }}
                  >
                    记住登录状态
                  </Label>
                </div>
                {error && (
                  <p className="text-xs text-center" style={{ color: '#ff6b9d' }}>{error}</p>
                )}
                <Button 
                  type="submit" 
                  className="w-full h-11 text-sm font-medium rounded-xl border-0 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
                  disabled={loading}
                >
                  {loading ? '登录中...' : '登录'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-xs" style={{ color: '#a0a0b0' }}>邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a0a0b0' }} />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="h-11 pl-10 text-sm rounded-xl border-0 transition-all duration-200 focus:ring-2"
                      style={{ 
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white'
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-nickname" className="text-xs" style={{ color: '#a0a0b0' }}>昵称（可选）</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a0a0b0' }} />
                    <Input
                      id="register-nickname"
                      type="text"
                      placeholder="请输入昵称"
                      value={registerNickname}
                      onChange={(e) => setRegisterNickname(e.target.value)}
                      className="h-11 pl-10 text-sm rounded-xl border-0 transition-all duration-200 focus:ring-2"
                      style={{ 
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white'
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-xs" style={{ color: '#a0a0b0' }}>密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a0a0b0' }} />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="至少6位"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 pl-10 text-sm rounded-xl border-0 transition-all duration-200 focus:ring-2"
                      style={{ 
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white'
                      }}
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-xs text-center" style={{ color: '#ff6b9d' }}>{error}</p>
                )}
                <Button 
                  type="submit" 
                  className="w-full h-11 text-sm font-medium rounded-xl border-0 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
                  disabled={loading}
                >
                  {loading ? '注册中...' : '注册'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* 底部装饰 */}
        <div 
          className="text-center mt-6 transition-all duration-700 delay-300"
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: '#a0a0b0' }}>
            <Sparkles className="w-3 h-3" />
            <span>开始你的单词学习之旅</span>
          </div>
        </div>
      </div>
    </div>
  );
}
