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
  getCommitDetails,
} from '../git-manager';

/**
 * 验证文件路径 - 防止路径遍历
 */
function validateFilePath(filePath: string): void {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }
  // 防止路径遍历攻击
  if (filePath.includes('..')) {
    throw new Error('Invalid file path: contains ".."');
  }
}

/**
 * 验证 Commit Hash 格式
 */
function validateCommitHash(hash: string): void {
  if (!hash || typeof hash !== 'string') {
    throw new Error('Invalid commit hash');
  }
  // 7-40 位十六进制字符
  if (!/^[0-9a-f]{7,40}$/i.test(hash)) {
    throw new Error(`Invalid commit hash format: ${hash}`);
  }
}

export function registerGitHandlers(): void {
  ipcMain.handle('git:init', async (_event, repoPath: string) => {
    if (!repoPath || typeof repoPath !== 'string') {
      throw new Error('Invalid repository path');
    }
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
    if (filePath) {
      validateFilePath(filePath);
    }
    return await getGitLog(filePath);
  });

  ipcMain.handle('git:getBranches', async () => {
    return await getGitBranches();
  });

  ipcMain.handle('git:getCurrentBranch', async () => {
    return await getCurrentBranch();
  });

  ipcMain.handle('git:stageFile', async (_event, filePath: string) => {
    validateFilePath(filePath);
    await stageFile(filePath);
    return { success: true };
  });

  ipcMain.handle('git:unstageFile', async (_event, filePath: string) => {
    validateFilePath(filePath);
    await unstageFile(filePath);
    return { success: true };
  });

  ipcMain.handle('git:stageAllModified', async () => {
    await stageAllModified();
    return { success: true };
  });

  ipcMain.handle('git:commit', async (_event, message: string) => {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Commit message cannot be empty');
    }
    // 限制提交消息长度
    if (message.length > 10000) {
      throw new Error('Commit message too long (max 10000 characters)');
    }
    await commit(message);
    return { success: true };
  });

  ipcMain.handle('git:checkoutBranch', async (_event, branchName: string) => {
    if (!branchName || typeof branchName !== 'string') {
      throw new Error('Invalid branch name');
    }
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
    validateCommitHash(hash);
    await checkoutCommit(hash);
    return { success: true };
  });

  ipcMain.handle('git:getFileDiff', async (_event, filePath: string) => {
    validateFilePath(filePath);
    return await getFileDiff(filePath);
  });

  ipcMain.handle('git:getFileContentAtCommit', async (_event, filePath: string, commitHash: string) => {
    validateFilePath(filePath);
    validateCommitHash(commitHash);
    return await getFileContentAtCommit(filePath, commitHash);
  });

  ipcMain.handle('git:getFileDiffBetweenCommits', async (_event, filePath: string, commitHash1: string, commitHash2: string) => {
    validateFilePath(filePath);
    validateCommitHash(commitHash1);
    validateCommitHash(commitHash2);
    return await getFileDiffBetweenCommits(filePath, commitHash1, commitHash2);
  });

  ipcMain.handle('git:getCommitDetails', async (_event, commitHash: string) => {
    validateCommitHash(commitHash);
    return await getCommitDetails(commitHash);
  });
}
