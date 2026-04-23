import { ipcMain } from 'electron';
import { readFile, writeFile, listFiles, getFileTree, collectSolarWireSnippets, copyFile, ensureDir, readImageAsBase64, setAllowedRoot } from '../file-manager';

export function registerFileHandlers(): void {
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    return await readFile(filePath);
  });

  ipcMain.handle('file:write', async (_event, filePath: string, content: string | ArrayBuffer | Uint8Array) => {
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

  ipcMain.handle('file:copy', async (_event, srcPath: string, destPath: string) => {
    await copyFile(srcPath, destPath);
    return { success: true };
  });

  ipcMain.handle('file:ensureDir', async (_event, dirPath: string) => {
    await ensureDir(dirPath);
    return { success: true };
  });

  ipcMain.handle('file:readImageAsBase64', async (_event, imagePath: string) => {
    return await readImageAsBase64(imagePath);
  });

  ipcMain.handle('file:setAllowedRoot', async (_event, dirPath: string) => {
    setAllowedRoot(dirPath);
    return { success: true };
  });
}
