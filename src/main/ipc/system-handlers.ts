import { ipcMain, shell } from 'electron';

export function registerSystemHandlers(): void {
  // Open file with system default program
  ipcMain.handle('system:openWithSystem', async (_event, filePath: string) => {
    try {
      await shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      console.error('Failed to open file with system:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  // Open file with system default program (alias)
  ipcMain.handle('system:openPath', async (_event, filePath: string) => {
    try {
      await shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      console.error('Failed to open path with system:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  // Show item in folder
  ipcMain.handle('system:showItemInFolder', async (_event, filePath: string) => {
    try {
      await shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      console.error('Failed to show item in folder:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });
}
