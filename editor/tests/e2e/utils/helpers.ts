import { Page } from '@playwright/test';

/**
 * 在编辑器中输入 SolarWire 代码
 */
export async function typeSolarWireCode(page: Page, code: string) {
  const editor = page.locator('.monaco-editor textarea').first();
  await editor.fill(code);
  // 等待防抖渲染
  await page.waitForTimeout(400);
}

/**
 * 等待 SVG 渲染完成
 */
export async function waitForSVGRender(page: Page, timeout = 5000) {
  await page.waitForSelector('.svg-container svg', { timeout });
}

/**
 * 拖拽 SVG 元素
 */
export async function dragElement(
  page: Page, 
  elementId: string, 
  dx: number, 
  dy: number
) {
  const element = page.locator(`[data-element-id="${elementId}"]`).first();
  const box = await element.boundingBox();
  
  if (!box) throw new Error('Element not found');
  
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dx, startY + dy);
  await page.mouse.up();
  
  // 等待节流更新
  await page.waitForTimeout(500);
}

/**
 * 获取编辑器内容
 */
export async function getEditorContent(page: Page): Promise<string> {
  const editor = page.locator('.monaco-editor textarea').first();
  return await editor.inputValue();
}

/**
 * 切换到 Git 面板
 */
export async function switchToGitView(page: Page) {
  await page.click('[data-testid="view-git"]');
  await page.waitForSelector('.git-view', { timeout: 3000 });
}

/**
 * 提交 Git 更改
 */
export async function commitGitChanges(page: Page, commitMessage: string) {
  // 暂存所有更改
  await page.click('[data-testid="stage-all-btn"]');
  
  // 输入提交消息
  await page.fill('[data-testid="commit-message-input"]', commitMessage);
  
  // 提交
  await page.click('[data-testid="commit-btn"]');
  
  // 等待提交完成
  await page.waitForTimeout(1000);
}

/**
 * 在测试模式下设置测试目录
 */
export async function setTestDirectory(page: Page, directoryPath: string) {
  await page.evaluate((path) => {
    if ((window as any).testAPI) {
      return (window as any).testAPI.setTestDirectory(path);
    }
    throw new Error('Test API not available');
  }, directoryPath);
  
  // 等待目录设置完成
  await page.waitForTimeout(1000);
}
