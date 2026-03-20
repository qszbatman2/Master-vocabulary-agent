'use client';

import { useEffect } from 'react';

/**
 * iOS PWA白屏自动刷新组件
 * 
 * 解决iOS从桌面快捷方式打开PWA时白屏的问题
 * 使用 sessionStorage 防止无限刷新
 */
export function PWARefresh() {
  useEffect(() => {
    // 检测是否为iOS PWA模式
    const isIOSPWA = typeof window !== 'undefined' && 
      ('standalone' in window.navigator) && 
      (window.navigator as Navigator & { standalone: boolean }).standalone;

    if (!isIOSPWA) return;

    // 检查是否已经刷新过（使用 sessionStorage 防止无限刷新）
    const hasRefreshed = sessionStorage.getItem('pwa-refreshed');
    if (hasRefreshed) {
      // 清除标记，下次访问可以再次检测
      sessionStorage.removeItem('pwa-refreshed');
      return;
    }

    // 仅在 pageshow 从 bfcache 恢复时刷新
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log('[PWA] 从bfcache恢复，正在刷新...');
        sessionStorage.setItem('pwa-refreshed', 'true');
        window.location.reload();
      }
    };

    // 注册事件监听
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return null;
}
