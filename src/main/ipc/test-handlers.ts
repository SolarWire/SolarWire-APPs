import { ipcMain } from 'electron';
import path from 'path';
import { setAllowedRoot } from '../file-manager';

/**
 * 注册测试相关的 IPC 处理程序
 */
export function registerTestHandlers(): void {
  /**
   * 在测试模式下设置测试目录
   * 用于绕过 Electron 对话框，直接设置项目根目录
   */
  ipcMain.handle('test:set-directory', async (_, testPath: string) => {
    try {
      // 确保路径是绝对路径
      const absolutePath = path.isAbsolute(testPath) ? testPath : path.resolve(testPath);
      
      // 设置项目根目录
      setAllowedRoot(absolutePath);
      
      return {
        success: true,
        path: absolutePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set test directory'
      };
    }
  });
}
