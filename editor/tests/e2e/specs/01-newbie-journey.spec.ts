import { test, expect } from '../fixtures/electron';

test.describe('New User Journey', () => {
  test('should complete first diagram creation', async ({ page }) => {
    // 1. 等待应用加载
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
    
    // 2. 在编辑器中输入 SolarWire 代码
    const editor = page.locator('.monaco-editor textarea').first();
    await editor.fill(`# My First Diagram
["Start"] @(200,50) w=80 h=40
["Process"] @(200,150) w=80 h=40
-- @(200,90)->(200,150)`);
    
    // 3. 等待 SVG 渲染
    await page.waitForSelector('.svg-container svg', { timeout: 5000 });
    
    // 4. 验证 SVG 包含预期元素
    const svgContent = await page.locator('.svg-container').innerHTML();
    expect(svgContent).toContain('rect');
    expect(svgContent).toContain('line');
    
    // 5. 截图验证
    await expect(page).toHaveScreenshot('first-diagram.png', {
      maxDiffPixels: 500
    });
  });

  test('should show welcome screen on first launch', async ({ page }) => {
    // 验证欢迎界面元素
    await expect(page.locator('.welcome-screen')).toBeVisible();
  });
});
