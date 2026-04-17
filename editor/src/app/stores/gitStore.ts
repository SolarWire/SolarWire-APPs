import { create } from 'zustand';
import { GitCommit, GitStatus, GitBranch } from '../../shared/types/git';

interface GitAnalysisProgress {
  total: number;
  processed: number;
  status: 'running' | 'completed' | 'cancelled';
  matchingCommits?: number;
  onCancel?: () => void;
}

interface GitState {
  isInitialized: boolean;
  status: GitStatus;
  history: GitCommit[];
  branches: GitBranch[];
  currentBranch: string;
  loading: boolean;
  selectedCommit: GitCommit | null;
  // 版本对比相关
  isDiffMode: boolean;
  leftCommit: GitCommit | null;
  rightCommit: GitCommit | null;
  leftFileContent: string;
  rightFileContent: string;
  fileDiff: string;
  // 版本分析进度
  gitAnalysis: GitAnalysisProgress | null;
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
  // 版本对比相关方法
  enterDiffMode: () => void;
  exitDiffMode: () => void;
  setLeftCommit: (commit: GitCommit | null) => void;
  setRightCommit: (commit: GitCommit | null) => void;
  loadLeftFileContent: (filePath: string, commitHash: string) => Promise<void>;
  loadRightFileContent: (filePath: string, commitHash: string) => Promise<void>;
  loadFileDiff: (filePath: string, commitHash1: string, commitHash2: string) => Promise<void>;
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
  isDiffMode: false,
  leftCommit: null,
  rightCommit: null,
  leftFileContent: '',
  rightFileContent: '',
  fileDiff: '',
  gitAnalysis: null,

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
      await api.commit(message);
      await get().refreshStatus();
      await get().refreshHistory();
    } catch (error) {
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
      await api.push();
      await get().refreshStatus();
    } catch (error) {
      console.error('Failed to push:', error);
    }
  },

  pull: async () => {
    if (!api) return;
    try {
      await api.pull();
      await get().refreshStatus();
    } catch (error) {
      console.error('Failed to pull:', error);
    }
  },

  fetch: async () => {
    if (!api) return;
    try {
      await api.fetch();
      await get().refreshStatus();
    } catch (error) {
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
    if (!api) return;
    try {
      const content = await api.getFileContentAtCommit(filePath, commitHash);
      set({ leftFileContent: content });
    } catch (error) {
      console.error('Failed to load left file content:', error);
    }
  },

  loadRightFileContent: async (filePath: string, commitHash: string) => {
    if (!api) return;
    try {
      const content = await api.getFileContentAtCommit(filePath, commitHash);
      set({ rightFileContent: content });
    } catch (error) {
      console.error('Failed to load right file content:', error);
    }
  },

  loadFileDiff: async (filePath: string, commitHash1: string, commitHash2: string) => {
    if (!api) return;
    try {
      const diff = await api.getFileDiffBetweenCommits(filePath, commitHash1, commitHash2);
      set({ fileDiff: diff });
    } catch (error) {
      console.error('Failed to load file diff:', error);
    }
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
