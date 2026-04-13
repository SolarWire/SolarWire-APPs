import { test, expect } from '../fixtures/electron';
import fs from 'fs';
import path from 'path';

test.describe('Git Workflow', () => {
  const testRepoDir = path.join(__dirname, '../../temp-test-repo');
  
  test.beforeAll(() => {
    // 创建测试目录
    if (!fs.existsSync(testRepoDir)) {
      fs.mkdirSync(testRepoDir, { recursive: true });
    }
  });
  
  test.afterAll(() => {
    // 清理
    if (fs.existsSync(testRepoDir)) {
      fs.rmSync(testRepoDir, { recursive: true, force: true });
    }
  });

  test('should initialize git repo and commit', async ({ page }) => {
    // 1. 打开文件夹对话框 (模拟)
    // 注意: 实际测试中需要通过 Electron dialog API
    
    // 2. 输入内容
    const editor = page.locator('.monaco-editor textarea').first();
    await editor.fill('# Test Content');
    
    // 3. 切换到 Git 面板
    await page.click('[data-testid="view-git"]');
    
    // 4. 暂存并提交
    await page.click('[data-testid="stage-all-btn"]');
    await page.fill('[data-testid="commit-message-input"]', 'Initial commit');
    await page.click('[data-testid="commit-btn"]');
    
    // 5. 验证提交成功
    await expect(page.locator('[data-testid="git-status"]')).toContainText('No changes');
  });

  test('should show error banner on git failure', async ({ page }) => {
    // 模拟 Git 错误场景
    // 这需要 mock IPC handlers
    
    // 验证错误横幅显示
    await expect(page.locator('.git-error-banner')).toBeVisible();
  });
});
