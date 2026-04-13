import { test as base, _electron, Page } from '@playwright/test';
import path from 'path';

interface ElectronFixtures {
  electronApp: Awaited<ReturnType<typeof _electron.launch>>;
  page: Page;
}

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    // 构建后运行 E2E 测试
    const appPath = path.join(__dirname, '../../../dist/main/index.js');
    
    const app = await _electron.launch({
      args: [appPath],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    await use(app);
    await app.close();
  },

  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await use(page);
  }
});

export { expect } from '@playwright/test';
