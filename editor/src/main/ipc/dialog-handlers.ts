import { ipcMain, dialog, OpenDialogOptions } from 'electron';

export function registerDialogHandlers(): void {
  ipcMain.handle('dialog:openFile', async (_event, options?: OpenDialogOptions) => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile', 'openDirectory', 'multiSelections'],
      ...options,
    });
    return res.filePaths;
  });
}
