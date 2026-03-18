import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:5000';

// 页面配置
const pages = [
  { path: '/', name: '首页', file: 'home.png', wait: 2000 },
  { path: '/login', name: '登录页', file: 'login.png', wait: 1500 },
  { path: '/vocabulary', name: '词库页', file: 'vocabulary.png', wait: 3000 },
  { path: '/practice', name: '练习页', file: 'practice.png', wait: 3000, needAuth: true },
  { path: '/article-import', name: '文章导入页', file: 'article-import.png', wait: 2000 },
];

async function main() {
  const screenshotDir = join(process.cwd(), 'screenshots');
  
  // 创建截图目录
  if (!existsSync(screenshotDir)) {
    mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
  });

  console.log('📸 开始截取页面截图...\n');

  for (const page of pages) {
    console.log(`📄 正在截取: ${page.name} (${page.path})`);
    
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14 Pro 尺寸
      deviceScaleFactor: 2,
    });

    const browserPage = await context.newPage();

    try {
      // 如果需要登录，先设置登录状态
      if (page.needAuth) {
        // 设置一个模拟的登录 token
        await browserPage.context().addCookies([
          {
            name: 'auth_token',
            value: 'MjowMDAwMDAwMDAwMDAwMA==', // 模拟 token
            domain: 'localhost',
            path: '/',
          },
        ]);
      }

      await browserPage.goto(`${BASE_URL}${page.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // 等待页面加载
      await browserPage.waitForTimeout(page.wait);

      // 截图
      const screenshotPath = join(screenshotDir, page.file);
      await browserPage.screenshot({
        path: screenshotPath,
        fullPage: false,
      });

      console.log(`   ✅ 已保存: ${screenshotPath}`);
    } catch (error) {
      console.log(`   ❌ 截图失败: ${error}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\n✨ 截图完成！');
}

main().catch(console.error);
