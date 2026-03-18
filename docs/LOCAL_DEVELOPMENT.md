# 本地开发指南

本文档介绍如何在本地拉起沙箱环境，进行英语单词学习平台的开发和调试。

## 一、环境要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 20.x | 推荐使用 Node.js 24 |
| pnpm | >= 9.x | 必须使用 pnpm，禁止 npm/yarn |
| Git | 任意版本 | 代码版本管理 |

### 1.1 安装 Node.js

```bash
# macOS (使用 Homebrew)
brew install node@20

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows (使用 winget)
winget install OpenJS.NodeJS.LTS
```

### 1.2 安装 pnpm

```bash
npm install -g pnpm
```

## 二、克隆项目

```bash
# 克隆仓库
git clone https://github.com/qszbatman2/Master-vocabulary-agent.git

# 进入项目目录
cd Master-vocabulary-agent
```

## 三、安装依赖

```bash
# 安装所有依赖
pnpm install
```

## 四、配置环境变量

### 4.1 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 数据库配置 (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 管理员密钥 (可选，默认为 vocabulary-admin-2024)
ADMIN_KEY=your_admin_key

# AI 服务配置 (可选)
AI_SERVICE_URL=your_ai_service_url
AI_SERVICE_API_KEY=your_ai_api_key
```

### 4.2 获取数据库凭证

1. 登录 [Coze 平台](https://www.coze.cn)
2. 进入项目设置 → 数据库
3. 复制 Supabase 连接信息

### 4.3 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 服务角色密钥 |
| `ADMIN_KEY` | ⬜ | 管理员 API 密钥，默认 `vocabulary-admin-2024` |
| `AI_SERVICE_URL` | ⬜ | AI 服务地址 |
| `AI_SERVICE_API_KEY` | ⬜ | AI 服务 API 密钥 |

## 五、启动开发服务

### 5.1 启动开发环境

```bash
# 方式 1: 使用 pnpm (推荐)
pnpm dev

# 方式 2: 使用 coze CLI (如果在 Coze 沙箱环境)
coze dev
```

### 5.2 访问应用

启动成功后，访问：

```
http://localhost:5000
```

### 5.3 热更新

开发环境支持热模块替换 (HMR)，修改代码后页面会自动刷新。

## 六、常用命令

```bash
# 开发环境
pnpm dev              # 启动开发服务 (端口 5000)

# 构建和部署
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务

# 代码检查
pnpm lint             # 运行 ESLint
npx tsc --noEmit      # TypeScript 类型检查

# 测试
pnpm test             # 运行测试用例
```

## 七、项目结构

```
.
├── src/
│   ├── app/                 # Next.js App Router 页面
│   │   ├── api/             # API 路由
│   │   ├── components/      # 页面组件
│   │   └── ...
│   ├── components/ui/       # shadcn/ui 组件库
│   ├── lib/                 # 工具函数
│   └── storage/             # 数据库操作
├── scripts/                 # 构建和部署脚本
├── docs/                    # 文档
├── .coze                    # Coze 沙箱配置
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 八、常见问题

### Q1: 端口 5000 被占用怎么办？

```bash
# 查找占用端口的进程
lsof -i :5000          # macOS/Linux
netstat -ano | findstr :5000  # Windows

# 终止进程
kill -9 <PID>
```

### Q2: 依赖安装失败？

```bash
# 清除缓存并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm store prune
pnpm install
```

### Q3: 数据库连接失败？

1. 检查 `.env.local` 文件是否存在
2. 确认环境变量值是否正确
3. 检查网络是否能访问 Supabase

### Q4: TypeScript 类型错误？

```bash
# 重新生成类型定义
npx tsc --noEmit
```

### Q5: 页面样式不生效？

```bash
# 重新构建 Tailwind CSS
pnpm build
```

## 九、与沙箱环境对比

| 功能 | 本地开发 | 沙箱环境 |
|------|----------|----------|
| 代码编辑 | 任意 IDE | 在线编辑器 |
| 公网访问 | 需内网穿透 | 自动提供域名 |
| 数据库 | 需配置环境变量 | 预配置 |
| 热更新 | ✅ 支持 | ✅ 支持 |
| 部署 | 手动推送到 Git | 自动部署 |

## 十、部署流程

```
本地开发 → git push → GitHub → 沙箱环境自动拉取 → 自动部署
```

1. **本地开发完成** → 测试通过
2. **提交代码** → `git add . && git commit -m "feat: 新功能"`
3. **推送到 GitHub** → `git push origin main`
4. **自动部署** → 沙箱环境自动拉取并重启服务

## 十一、参考链接

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 组件库](https://ui.shadcn.com)
- [Supabase 文档](https://supabase.com/docs)
