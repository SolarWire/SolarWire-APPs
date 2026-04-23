import { create } from 'zustand';
import { GitCommit, GitStatus, GitBranch } from '../../shared/types/git';
import { useStatusStore } from './statusStore';
import { useSettingsStore } from './settingsStore';

interface GitState {
  isInitialized: boolean;
  status: GitStatus;
  history: GitCommit[];
  branches: GitBranch[];
  currentBranch: string;
  loading: boolean;
  selectedCommit: GitCommit | null;
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
  getGitLog: (filePath?: string) => Promise<GitCommit[]>;
}

const api = (window as any).api?.git;

export const useGitStore = create<GitState>((set, get) => ({
  isInitialized: false,
  status: { modified: [], staged: [], untracked: [] },
  history: [],
  branches: [],
  currentBranch: 'main',
  loading: false,
  selectedCommit: null,

  initGit: async (repoPath: string) => {
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
    if (!api) return;
    try {
      const status = await api.getStatus();
      set({ status });
    } catch (error) {
      console.error('Failed to refresh git status:', error);
    }
  },

  refreshHistory: async (filePath?: string) => {
    if (!api) return;
    try {
      const history = await api.getLog(filePath);
      set({ history });
    } catch (error) {
      console.error('Failed to refresh git history:', error);
    }
  },

  refreshBranches: async () => {
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
    if (!api) return;
    try {
      await api.stageFile(filePath);
      await get().refreshStatus();
    } catch (error) {
      console.error('Failed to stage file:', error);
    }
  },

  unstageFile: async (filePath: string) => {
    if (!api) return;
    try {
      await api.unstageFile(filePath);
      await get().refreshStatus();
    } catch (error) {
      console.error('Failed to unstage file:', error);
    }
  },

  stageAllModified: async () => {
    if (!api) return;
    try {
      await api.stageAllModified();
      await get().refreshStatus();
    } catch (error) {
      console.error('Failed to stage all modified files:', error);
    }
  },

  commit: async (message: string) => {
    if (!api) return;
    try {
      useStatusStore.getState().startOperation('git-commit', '提交中...');
      const { gitName, gitEmail } = useSettingsStore.getState();
      await api.commit(message, gitName || undefined, gitEmail || undefined);
      await get().refreshStatus();
      await get().refreshHistory();
      useStatusStore.getState().completeOperation('提交成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交失败';
      useStatusStore.getState().failOperation('Git 提交失败', errorMessage);
      console.error('Failed to commit:', error);
    }
  },

  checkoutBranch: async (branchName: string) => {
    if (!api) return;
    try {
      await api.checkoutBranch(branchName);
      await get().refreshStatus();
      await get().refreshBranches();
    } catch (error) {
      console.error('Failed to checkout branch:', error);
    }
  },

  push: async () => {
    if (!api) return;
    try {
      useStatusStore.getState().startOperation('git-push', '推送中...');
      await api.push();
      await get().refreshStatus();
      useStatusStore.getState().completeOperation('推送成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '推送失败';
      useStatusStore.getState().failOperation('Git 推送失败', errorMessage);
      console.error('Failed to push:', error);
    }
  },

  pull: async () => {
    if (!api) return;
    try {
      useStatusStore.getState().startOperation('git-pull', '拉取中...');
      await api.pull();
      await get().refreshStatus();
      useStatusStore.getState().completeOperation('拉取成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '拉取失败';
      useStatusStore.getState().failOperation('Git 拉取失败', errorMessage);
      console.error('Failed to pull:', error);
    }
  },

  fetch: async () => {
    if (!api) return;
    try {
      useStatusStore.getState().startOperation('git-fetch', '获取中...');
      await api.fetch();
      await get().refreshStatus();
      useStatusStore.getState().completeOperation('获取成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取失败';
      useStatusStore.getState().failOperation('Git 获取失败', errorMessage);
      console.error('Failed to fetch:', error);
    }
  },

  checkoutCommit: async (hash: string) => {
    if (!api) return;
    try {
      await api.checkoutCommit(hash);
      await get().refreshStatus();
    } catch (error) {
      console.error('Failed to checkout commit:', error);
    }
  },

  getFileDiff: async (filePath: string): Promise<string> => {
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

  getGitLog: async (filePath?: string): Promise<GitCommit[]> => {
    if (!api) return [];
    try {
      return await api.getLog(filePath);
    } catch (error) {
      console.error('Failed to get git log:', error);
      return [];
    }
  },
}));
