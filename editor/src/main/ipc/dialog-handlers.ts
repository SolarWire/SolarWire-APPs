import { ipcMain, dialog, OpenDialogOptions } from 'electron';
import { setAllowedRoot } from '../file-manager';

export function registerDialogHandlers(): void {
  ipcMain.handle('dialog:openFile', async (_event, options?: OpenDialogOptions) => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile', 'openDirectory', 'multiSelections'],
      ...options,
    });
    
    // 如果用户选择了目录，设置为允许的根目录
    if (!res.canceled && res.filePaths.length > 0) {
      const selectedPath = res.filePaths[0];
      setAllowedRoot(selectedPath);
    }
    
    return res.filePaths;
  });
}
