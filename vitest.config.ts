import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // 测试环境
    environment: 'jsdom',
    
    // 全局测试 API
    globals: true,
    
    // 测试文件匹配模式
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/app/api/**/*.ts',
        'src/lib/**/*.ts',
        'src/contexts/**/*.tsx',
      ],
      exclude: [
        'src/app/api/**/route.ts', // 路由文件由集成测试覆盖
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
    
    // 设置文件
    setupFiles: ['./vitest.setup.ts'],
    
    // 超时配置
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 并行执行
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
