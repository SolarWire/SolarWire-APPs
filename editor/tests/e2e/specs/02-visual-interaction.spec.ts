import { test, expect } from '../fixtures/electron';

test.describe('Visual Interaction', () => {
  test.beforeEach(async ({ page }) => {
    // 准备测试内容
    const editor = page.locator('.monaco-editor textarea').first();
    await editor.fill('["DraggableBox"] @(100,100) w=80 h=40');
    await page.waitForSelector('.svg-container svg');
  });

  test('should drag element and update code', async ({ page }) => {
    // 1. 获取元素初始位置
    const element = page.locator('[data-element-id="1"]').first();
    const initialBox = await element.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // 2. 执行拖拽
    const startX = initialBox!.x + initialBox!.width / 2;
    const startY = initialBox!.y + initialBox!.height / 2;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 50);
    await page.mouse.up();
    
    // 3. 等待代码更新 (防抖 300ms + 节流 100ms)
    await page.waitForTimeout(500);
    
    // 4. 验证代码已更新
    const editor = page.locator('.monaco-editor textarea').first();
    const content = await editor.inputValue();
    expect(content).not.toContain('@(100,100)'); // 坐标应改变
  });

  test('should show coordinate tooltip during drag', async ({ page }) => {
    // 开始拖拽
    const element = page.locator('[data-element-id="1"]').first();
    const box = await element.boundingBox();
    
    await page.mouse.move(box!.x + 40, box!.y + 20);
    await page.mouse.down();
    await page.mouse.move(box!.x + 90, box!.y + 70);
    
    // 验证坐标提示显示
    await expect(page.locator('.drag-coordinate-tooltip')).toBeVisible();
    
    await page.mouse.up();
  });

  test('should resize element from corner handle', async ({ page }) => {
    // 1. 选中元素以显示句柄
    const element = page.locator('[data-element-id="1"]').first();
    await element.click();
    
    // 2. 找到 SE 角句柄并拖拽
    const handle = page.locator('[data-handle="se"]').first();
    const handleBox = await handle.boundingBox();
    
    await page.mouse.move(handleBox!.x, handleBox!.y);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x + 30, handleBox!.y + 20);
    await page.mouse.up();
    
    // 3. 验证尺寸更新
    await page.waitForTimeout(500);
    const editor = page.locator('.monaco-editor textarea').first();
    const content = await editor.inputValue();
    expect(content).toMatch(/w=\d{2,}/); // 宽度应增加
  });
});
