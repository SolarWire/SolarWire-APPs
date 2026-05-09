import { ipcMain } from 'electron';
import { readFile, readFileAsBuffer, writeFile, listFiles, getFileTree, collectSolarWireSnippets, copyFile, ensureDir, readImageAsBase64, setAllowedRoot, rename, deleteFile, deleteDirectory, mkdir, exists, showItemInFolder } from '../file-manager';

export function registerFileHandlers(): void {
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    return await readFile(filePath);
  });

  ipcMain.handle('file:readAsBuffer', async (_event, filePath: string) => {
    return await readFileAsBuffer(filePath);
  });

  ipcMain.handle('file:write', async (_event, filePath: string, content: string | ArrayBuffer | Uint8Array, allowOutsideProject?: boolean) => {
    await writeFile(filePath, content, allowOutsideProject);
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

  ipcMain.handle('file:rename', async (_event, oldPath: string, newPath: string) => {
    await rename(oldPath, newPath);
    return { success: true };
  });

  ipcMain.handle('file:deleteFile', async (_event, filePath: string) => {
    await deleteFile(filePath);
    return { success: true };
  });

  ipcMain.handle('file:deleteDirectory', async (_event, dirPath: string) => {
    await deleteDirectory(dirPath);
    return { success: true };
  });

  ipcMain.handle('file:mkdir', async (_event, dirPath: string) => {
    await mkdir(dirPath);
    return { success: true };
  });

  ipcMain.handle('file:exists', async (_event, filePath: string) => {
    return await exists(filePath);
  });

  ipcMain.handle('file:showItemInFolder', async (_event, filePath: string) => {
    await showItemInFolder(filePath);
    return { success: true };
  });
}
