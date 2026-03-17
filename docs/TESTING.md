# 自动化测试指南

## 一、测试策略概览

### 1.1 测试金字塔

```
        /\
       /  \
      / E2E\         ← 端到端测试 (少量，慢)
     /______\
    /        \
   / 集成测试  \      ← API + 数据库 (适量，中等)
  /__________\
 /            \
/   单元测试    \    ← 函数/组件 (大量，快)
/______________\
```

### 1.2 当前测试覆盖目标

| 层级 | 目标覆盖率 | 工具 | 执行时机 |
|------|-----------|------|----------|
| 单元测试 | 80% | Vitest | 每次提交 |
| 集成测试 | 60% | Vitest + MSW | PR 合并 |
| E2E 测试 | 核心流程 | Playwright | 发布前 |

---

## 二、快速开始

### 2.1 安装依赖

```bash
pnpm install
```

### 2.2 运行测试

```bash
# 运行所有测试（监听模式）
pnpm test

# 单次运行
pnpm test:run

# 生成覆盖率报告
pnpm test:coverage

# 打开测试 UI
pnpm test:ui
```

---

## 三、测试用例编写规范

### 3.1 文件命名

```
src/
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts      ← 单元测试
├── app/api/
│   ├── auth/
│   └── __tests__/
│       └── auth.test.ts       ← API 测试
└── components/
    ├── Button.tsx
    └── __tests__/
        └── Button.test.tsx    ← 组件测试
```

### 3.2 测试命名规范

```typescript
describe('功能模块/组件名', () => {
  describe('方法名/功能点', () => {
    it('应该 [期望行为] 当 [条件]', () => {
      // 测试代码
    });
  });
});
```

**示例**：
```typescript
describe('calculateMasteryState', () => {
  describe('普通单词答对', () => {
    it('应该记录有效答对当首次答对时', () => {
      // ...
    });
  });
});
```

### 3.3 AAA 模式

```typescript
it('应该正确计算掌握状态', () => {
  // Arrange (准备)
  const context = {
    isCorrect: true,
    isRoundWrongWord: false,
    existingStatus: null,
  };

  // Act (执行)
  const result = calculateMasteryState(context);

  // Assert (断言)
  expect(result.dailyCorrectCount).toBe(1);
  expect(result.isMastered).toBe(false);
});
```

---

## 四、测试类型详解

### 4.1 单元测试

**适用场景**：
- 纯函数（无副作用）
- 工具函数
- 业务逻辑算法

**示例**：见 `src/__tests__/lib/mastery-logic.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getTodayDateString, isToday } from '@/lib/date-utils';

describe('日期工具', () => {
  it('应该返回 YYYY-MM-DD 格式', () => {
    const result = getTodayDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

### 4.2 集成测试

**适用场景**：
- API 接口
- 数据库操作
- 外部服务调用

**示例**：见 `src/__tests__/api/auth.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock 外部依赖
vi.mock('@/storage/database/supabase-client', () => ({
  getSupabaseClient: vi.fn(() => mockClient),
}));

describe('POST /api/auth/login', () => {
  it('应该成功登录', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: '123' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

### 4.3 组件测试

**适用场景**：
- UI 组件渲染
- 用户交互
- 状态变化

**示例**：见 `src/__tests__/components/auth.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginForm', () => {
  it('点击登录应该调用 onLogin', async () => {
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} />);

    await userEvent.type(screen.getByPlaceholderText('邮箱'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('密码'), 'password');
    await userEvent.click(screen.getByText('登录'));

    expect(onLogin).toHaveBeenCalled();
  });
});
```

---

## 五、Mock 策略

### 5.1 Mock 数据库

```typescript
// vitest.setup.ts
vi.mock('@/storage/database/supabase-client', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    })),
  })),
}));
```

### 5.2 Mock fetch

```typescript
// 测试文件中
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: 'mock' }),
  });
});
```

### 5.3 Mock localStorage

```typescript
// vitest.setup.ts 中已配置
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  // ...
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

---

## 六、最佳实践

### 6.1 测试原则

1. **独立原则**：每个测试应该独立运行，不依赖其他测试
2. **快速原则**：单元测试应该在毫秒级完成
3. **可重复**：多次运行结果一致
4. **自验证**：测试应该自动判断通过/失败

### 6.2 避免的反模式

```typescript
// ❌ 测试实现细节
expect(component.state.count).toBe(1);

// ✅ 测试行为
expect(screen.getByText('Count: 1')).toBeInTheDocument();

// ❌ 测试中包含逻辑
const result = a + b;
expect(result).toBe(3);

// ✅ 直接断言
expect(add(1, 2)).toBe(3);

// ❌ 共享状态
let data;
beforeEach(() => { data = {}; });

// ✅ 独立初始化
beforeEach(() => { data = createMockData(); });
```

### 6.3 测试数据管理

```typescript
// test/fixtures/users.ts
export const mockUsers = {
  valid: { email: 'test@example.com', password: 'password123' },
  invalid: { email: '', password: '' },
  admin: { email: 'admin@example.com', password: 'admin123' },
};

// 测试中使用
import { mockUsers } from '@/test/fixtures/users';

it('应该拒绝无效用户', () => {
  const result = login(mockUsers.invalid);
  expect(result.success).toBe(false);
});
```

---

## 七、CI/CD 集成

### 7.1 GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 7.2 Pre-commit Hook

```bash
# .husky/pre-commit
pnpm test:run
```

---

## 八、测试覆盖率目标

| 模块 | 当前 | 目标 |
|------|------|------|
| lib/utils | - | 90% |
| lib/mastery-logic | - | 95% |
| api/auth | - | 80% |
| api/practice | - | 75% |
| components | - | 60% |

---

## 九、常见问题

### Q1: 测试中如何处理异步？

```typescript
// 使用 waitFor
await waitFor(() => {
  expect(screen.getByText('加载完成')).toBeInTheDocument();
});

// 使用 findBy (自带等待)
const element = await screen.findByText('加载完成');
```

### Q2: 如何测试错误场景？

```typescript
it('应该抛出错误当参数无效', () => {
  expect(() => validateEmail('invalid')).toThrow('无效邮箱');
});
```

### Q3: 如何跳过某些测试？

```typescript
it.skip('暂时跳过', () => { /* ... */ });
it.only('只运行这个', () => { /* ... */ });
```
