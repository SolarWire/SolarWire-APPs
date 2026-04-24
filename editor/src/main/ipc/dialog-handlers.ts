import { ipcMain, dialog, OpenDialogOptions, SaveDialogOptions } from 'electron';

export function registerDialogHandlers(): void {
  ipcMain.handle('dialog:openFile', async (_event, options?: OpenDialogOptions) => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile', 'openDirectory', 'multiSelections'],
      ...options,
    });

    return res.filePaths;
  });

  ipcMain.handle('dialog:saveFile', async (_event, options?: SaveDialogOptions) => {
    const res = await dialog.showSaveDialog(options || {
      filters: [{ name: 'All Files', extensions: ['*'] }],
    });
    return res;
  });
}
