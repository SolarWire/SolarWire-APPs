import { ipcMain } from 'electron';
import {
  initGit,
  isGitInitialized,
  getGitStatus,
  getGitLog,
  getGitBranches,
  getCurrentBranch,
  stageFile,
  stageAllModified,
  unstageFile,
  commit,
  checkoutBranch,
  push,
  pull,
  fetch,
  checkoutCommit,
  getFileDiff,
  getFileContentAtCommit,
  getFileDiffBetweenCommits,
} from '../git-manager';

export function registerGitHandlers(): void {
  ipcMain.handle('git:init', async (_event, repoPath: string) => {
    initGit(repoPath);
    return { success: true };
  });

  ipcMain.handle('git:isInitialized', async () => {
    return isGitInitialized();
  });

  ipcMain.handle('git:getStatus', async () => {
    return await getGitStatus();
  });

  ipcMain.handle('git:getLog', async (_event, filePath?: string) => {
    return await getGitLog(filePath);
  });

  ipcMain.handle('git:getBranches', async () => {
    return await getGitBranches();
  });

  ipcMain.handle('git:getCurrentBranch', async () => {
    return await getCurrentBranch();
  });

  ipcMain.handle('git:stageFile', async (_event, filePath: string) => {
    await stageFile(filePath);
    return { success: true };
  });

  ipcMain.handle('git:unstageFile', async (_event, filePath: string) => {
    await unstageFile(filePath);
    return { success: true };
  });

  ipcMain.handle('git:stageAllModified', async () => {
    await stageAllModified();
    return { success: true };
  });

  ipcMain.handle('git:commit', async (_event, message: string) => {
    await commit(message);
    return { success: true };
  });

  ipcMain.handle('git:checkoutBranch', async (_event, branchName: string) => {
    await checkoutBranch(branchName);
    return { success: true };
  });

  ipcMain.handle('git:push', async () => {
    await push();
    return { success: true };
  });

  ipcMain.handle('git:pull', async () => {
    await pull();
    return { success: true };
  });

  ipcMain.handle('git:fetch', async () => {
    await fetch();
    return { success: true };
  });

  ipcMain.handle('git:checkoutCommit', async (_event, hash: string) => {
    await checkoutCommit(hash);
    return { success: true };
  });

  ipcMain.handle('git:getFileDiff', async (_event, filePath: string) => {
    return await getFileDiff(filePath);
  });

  ipcMain.handle('git:getFileContentAtCommit', async (_event, filePath: string, commitHash: string) => {
    return await getFileContentAtCommit(filePath, commitHash);
  });

  ipcMain.handle('git:getFileDiffBetweenCommits', async (_event, filePath: string, commitHash1: string, commitHash2: string) => {
    return await getFileDiffBetweenCommits(filePath, commitHash1, commitHash2);
  });
}
