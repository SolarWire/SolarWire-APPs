import { ipcMain } from 'electron';
import { readFile, writeFile, listFiles, getFileTree, collectSolarWireSnippets } from '../file-manager';

export function registerFileHandlers(): void {
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    return await readFile(filePath);
  });

  ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    await writeFile(filePath, content);
    return { success: true };
  });

  ipcMain.handle('file:listDirectory', async (_event, dirPath: string) => {
    return await listFiles(dirPath);
  });

  ipcMain.handle('file:getFileTree', async (_event, dirPath: string, depth = 3) => {
    return await getFileTree(dirPath, depth);
  });

  ipcMain.handle('file:collectSolarWireSnippets', async (_event, dirPath: string) => {
    return await collectSolarWireSnippets(dirPath);
  });
}
