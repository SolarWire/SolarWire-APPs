import { create } from 'zustand';

interface GitStatus {
  modified: string[];
  staged: string[];
  untracked: string[];
}

interface GitCommit {
  hash: string;
  shortHash: string;
  date: string;
  message: string;
  authorName: string;
}

interface GitBranch {
  name: string;
  isCurrent: boolean;
}

interface GitState {
  isInitialized: boolean;
  status: GitStatus;
  history: GitCommit[];
  branches: GitBranch[];
  currentBranch: string;
  loading: boolean;
  error: string | null;
  selectedCommit: GitCommit | null;
  // 版本对比相关
  isDiffMode: boolean;
  leftCommit: GitCommit | null;
  rightCommit: GitCommit | null;
  leftFileContent: string;
  rightFileContent: string;
  fileDiff: string;
  initGit: (repoPath: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshHistory: (filePath?: string) => Promise<void>;
  refreshBranches: () => Promise<void>;
  stageFile: (filePath: string) => Promise<void>;
  stageAllModified: () => Promise<void>;
  unstageFile: (filePath: string) => Promise<void>;
  commit: (message: string) => Promise<void>;
  checkoutBranch: (branchName: string) => Promise<void>;
  push: () => Promise<void>;
  pull: () => Promise<void>;
  fetch: () => Promise<void>;
  checkoutCommit: (hash: string) => Promise<void>;
  getFileDiff: (filePath: string) => Promise<string>;
  selectCommit: (commit: GitCommit | null) => void;
  clearError: () => void;
  // 版本对比相关方法
  enterDiffMode: () => void;
  exitDiffMode: () => void;
  setLeftCommit: (commit: GitCommit | null) => void;
  setRightCommit: (commit: GitCommit | null) => void;
  loadLeftFileContent: (filePath: string, commitHash: string) => Promise<void>;
  loadRightFileContent: (filePath: string, commitHash: string) => Promise<void>;
  loadFileDiff: (filePath: string, commitHash1: string, commitHash2: string) => Promise<void>;
}

// 每次需要时获取 api，以便在测试中可以 mock
function getApi() {
  return (window as any).api?.git;
}

// Git 操作并发锁 - 防止多个 Git 操作同时执行导致状态不一致
let gitOperationLock = false;

/**
 * 获取 Git 操作锁，如果锁已被占用则抛出错误
 */
function acquireGitLock(): void {
  if (gitOperationLock) {
    throw new Error('Git operation in progress, please wait');
  }
  gitOperationLock = true;
}

/**
 * 释放 Git 操作锁
 */
function releaseGitLock(): void {
  gitOperationLock = false;
}

/**
 * 带重试的异步操作工具函数
 * 指数退避策略：1s, 2s, 4s...
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i === maxRetries - 1) break;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError ?? new Error('Unknown error');
}

export const useGitStore = create<GitState>((set, get) => ({
  isInitialized: false,
  status: { modified: [], staged: [], untracked: [] },
  history: [],
  branches: [],
  currentBranch: 'main',
  loading: false,
  error: null,
  selectedCommit: null,
  isDiffMode: false,
  leftCommit: null,
  rightCommit: null,
  leftFileContent: '',
  rightFileContent: '',
  fileDiff: '',

  initGit: async (repoPath: string) => {
    const api = getApi();
    if (!api) return;
    try {
      await api.init(repoPath);
      set({ isInitialized: true });
      await get().refreshStatus();
      await get().refreshHistory();
      await get().refreshBranches();
    } catch (error) {
      console.error('Failed to init git:', error);
    }
  },

  refreshStatus: async () => {
    const api = getApi();
    if (!api) return;
    try {
      const status = await api.getStatus();
      set({ status });
    } catch (error) {
      console.error('Failed to refresh git status:', error);
    }
  },

  refreshHistory: async (filePath?: string) => {
    const api = getApi();
    if (!api) return;
    try {
      const history = await api.getLog(filePath);
      set({ history });
    } catch (error) {
      console.error('Failed to refresh git history:', error);
    }
  },

  refreshBranches: async () => {
    const api = getApi();
    if (!api) return;
    try {
      const branches = await api.getBranches();
      const currentBranch = await api.getCurrentBranch();
      set({ branches, currentBranch });
    } catch (error) {
      console.error('Failed to refresh git branches:', error);
    }
  },

  stageFile: async (filePath: string) => {
    const api = getApi();
    if (!api) return;
    try {
      await api.stageFile(filePath);
      await get().refreshStatus();
    } catch (error) {
      console.error('Failed to stage file:', error);
    }
  },

  unstageFile: async (filePath: string) => {
    const api = getApi();
    if (!api) return;
    try {
      await api.unstageFile(filePath);
      await get().refreshStatus();
    } catch (error) {
      console.error('Failed to unstage file:', error);
    }
  },

  stageAllModified: async () => {
    const api = getApi();
    if (!api) return;
    try {
      await api.stageAllModified();
      await get().refreshStatus();
    } catch (error) {
      console.error('Failed to stage all modified files:', error);
    }
  },

  commit: async (message: string) => {
    const api = getApi();
    if (!api) return;
    set({ loading: true, error: null });
    acquireGitLock();
    try {
      await withRetry(() => api.commit(message));
      await Promise.all([
        get().refreshStatus(),
        get().refreshHistory()
      ]);
    } catch (error: any) {
      const msg = error.message || 'Commit failed';
      set({ error: msg });
      throw error;
    } finally {
      releaseGitLock();
      set({ loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  checkoutBranch: async (branchName: string) => {
    const api = getApi();
    if (!api) return;
    set({ loading: true, error: null });
    acquireGitLock();
    try {
      await withRetry(() => api.checkoutBranch(branchName));
      await Promise.all([
        get().refreshStatus(),
        get().refreshBranches()
      ]);
    } catch (error: any) {
      set({ error: error.message || 'Checkout branch failed' });
      throw error;
    } finally {
      releaseGitLock();
      set({ loading: false });
    }
  },

  push: async () => {
    const api = getApi();
    if (!api) return;
    set({ loading: true, error: null });
    acquireGitLock();
    try {
      await withRetry(() => api.push());
      await get().refreshStatus();
    } catch (error: any) {
      set({ error: error.message || 'Push failed' });
      throw error;
    } finally {
      releaseGitLock();
      set({ loading: false });
    }
  },

  pull: async () => {
    const api = getApi();
    if (!api) return;
    set({ loading: true, error: null });
    acquireGitLock();
    try {
      await withRetry(() => api.pull());
      await get().refreshStatus();
    } catch (error: any) {
      set({ error: error.message || 'Pull failed' });
      throw error;
    } finally {
      releaseGitLock();
      set({ loading: false });
    }
  },

  fetch: async () => {
    const api = getApi();
    if (!api) return;
    set({ loading: true, error: null });
    acquireGitLock();
    try {
      await withRetry(() => api.fetch());
      await get().refreshStatus();
    } catch (error: any) {
      set({ error: error.message || 'Fetch failed' });
      throw error;
    } finally {
      releaseGitLock();
      set({ loading: false });
    }
  },

  checkoutCommit: async (hash: string) => {
    const api = getApi();
    if (!api) return;
    set({ loading: true, error: null });
    acquireGitLock();
    try {
      await withRetry(() => api.checkoutCommit(hash));
      await get().refreshStatus();
    } catch (error: any) {
      set({ error: error.message || 'Checkout commit failed' });
      throw error;
    } finally {
      releaseGitLock();
      set({ loading: false });
    }
  },

  getFileDiff: async (filePath: string): Promise<string> => {
    const api = getApi();
    if (!api) return '';
    try {
      return await api.getFileDiff(filePath);
    } catch (error) {
      console.error('Failed to get file diff:', error);
      return '';
    }
  },

  selectCommit: (commit: GitCommit | null) => {
    set({ selectedCommit: commit });
  },

  enterDiffMode: () => {
    set({ isDiffMode: true });
  },

  exitDiffMode: () => {
    set({ 
      isDiffMode: false,
      leftCommit: null,
      rightCommit: null,
      leftFileContent: '',
      rightFileContent: '',
      fileDiff: ''
    });
  },

  setLeftCommit: (commit: GitCommit | null) => {
    set({ leftCommit: commit });
  },

  setRightCommit: (commit: GitCommit | null) => {
    set({ rightCommit: commit });
  },

  loadLeftFileContent: async (filePath: string, commitHash: string) => {
    const api = getApi();
    if (!api) return;
    try {
      const content = await api.getFileContentAtCommit(filePath, commitHash);
      set({ leftFileContent: content });
    } catch (error) {
      console.error('Failed to load left file content:', error);
    }
  },

  loadRightFileContent: async (filePath: string, commitHash: string) => {
    const api = getApi();
    if (!api) return;
    try {
      const content = await api.getFileContentAtCommit(filePath, commitHash);
      set({ rightFileContent: content });
    } catch (error) {
      console.error('Failed to load right file content:', error);
    }
  },

  loadFileDiff: async (filePath: string, commitHash1: string, commitHash2: string) => {
    const api = getApi();
    if (!api) return;
    try {
      const diff = await api.getFileDiffBetweenCommits(filePath, commitHash1, commitHash2);
      set({ fileDiff: diff });
    } catch (error) {
      console.error('Failed to load file diff:', error);
    }
  },
}));
