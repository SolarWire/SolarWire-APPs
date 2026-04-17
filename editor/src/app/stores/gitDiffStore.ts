import { create } from 'zustand';
import { GitCommit } from '../../shared/types/git';

interface GitDiffState {
  isDiffMode: boolean;
  leftCommit: GitCommit | null;
  rightCommit: GitCommit | null;
  leftFileContent: string;
  rightFileContent: string;
  fileDiff: string;
}

interface GitDiffActions {
  enterDiffMode: () => void;
  exitDiffMode: () => void;
  setLeftCommit: (commit: GitCommit | null) => void;
  setRightCommit: (commit: GitCommit | null) => void;
  loadLeftFileContent: (filePath: string, commitHash: string) => Promise<void>;
  loadRightFileContent: (filePath: string, commitHash: string) => Promise<void>;
  loadFileDiff: (filePath: string, commitHash1: string, commitHash2: string) => Promise<void>;
}

type GitDiffStore = GitDiffState & GitDiffActions;

const api = (window as any).api?.git;

export const useGitDiffStore = create<GitDiffStore>((set) => ({
  isDiffMode: false,
  leftCommit: null,
  rightCommit: null,
  leftFileContent: '',
  rightFileContent: '',
  fileDiff: '',

  enterDiffMode: () => set({ isDiffMode: true }),
  
  exitDiffMode: () => set({ 
    isDiffMode: false,
    leftCommit: null,
    rightCommit: null,
    leftFileContent: '',
    rightFileContent: '',
    fileDiff: ''
  }),
  
  setLeftCommit: (commit) => set({ leftCommit: commit }),
  
  setRightCommit: (commit) => set({ rightCommit: commit }),
  
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
}));
