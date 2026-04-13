/**
 * IPC 测试工具函数
 */

import { ipcMain } from 'electron';

/**
 * 模拟 IPC 调用
 */
export function mockIpcCall(channel: string, ...args: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const handler = (ipcMain.handle as any).mock.calls
      .find((call: any[]) => call[0] === channel);
    
    if (handler) {
      const callback = handler[1];
      try {
        const result = callback(null, ...args);
        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    } else {
      reject(new Error(`No handler registered for channel: ${channel}`));
    }
  });
}

/**
 * 清除所有 IPC 处理器
 */
export function clearIpcHandlers() {
  (ipcMain.handle as any).mockClear();
}

/**
 * 验证 IPC 处理器是否注册
 */
export function expectIpcHandlerRegistered(channel: string) {
  const handlers = (ipcMain.handle as any).mock.calls
    .map((call: any[]) => call[0]);
  expect(handlers).toContain(channel);
}
