'use client';

import { useEffect, useRef } from 'react';

/**
 * iOS PWA白屏自动刷新组件
 * 
 * 解决iOS从桌面快捷方式打开PWA时白屏的问题
 */
export function PWARefresh() {
  const hasRefreshed = useRef(false);

  useEffect(() => {
    // 检测是否为iOS PWA模式
    const isIOSPWA = typeof window !== 'undefined' && 
      ('standalone' in window.navigator) && 
      (window.navigator as Navigator & { standalone: boolean }).standalone;

    if (!isIOSPWA) return;

    // 检测页面是否白屏
    const checkWhiteScreen = (): boolean => {
      // 检查body是否有内容
      const body = document.body;
      if (!body || body.innerHTML.length < 100) return true;
      
      // 检查是否有可见的根元素
      const root = document.querySelector('#__next') || document.body.firstElementChild;
      if (!root) return true;
      
      // 检查根元素是否有内容
      if (root.innerHTML.length < 50) return true;
      
      return false;
    };

    // 尝试刷新（带防抖，避免无限刷新）
    const tryRefresh = (reason: string) => {
      if (hasRefreshed.current) return;
      
      // 检查是否白屏
      if (checkWhiteScreen()) {
        hasRefreshed.current = true;
        console.log(`[PWA] 检测到白屏，原因: ${reason}，正在刷新...`);
        
        // 强制重新加载（跳过bfcache）
        window.location.reload();
      }
    };

    // 1. 页面显示时检测（从bfcache恢复）
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // 从bfcache恢复，延迟检测确保DOM渲染
        setTimeout(() => tryRefresh('pageshow persisted'), 100);
      }
    };

    // 2. 页面可见性变化时检测
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => tryRefresh('visibility change'), 100);
      }
    };

    // 3. 页面获得焦点时检测
    const handleFocus = () => {
      setTimeout(() => tryRefresh('window focus'), 100);
    };

    // 4. 初始加载时检测（延迟确保渲染完成）
    setTimeout(() => {
      tryRefresh('initial load');
    }, 500);

    // 注册事件监听
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return null;
}
