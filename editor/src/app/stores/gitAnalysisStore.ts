import { create } from 'zustand';

interface GitAnalysisProgress {
  total: number;
  processed: number;
  status: 'running' | 'completed' | 'cancelled';
  matchingCommits?: number;
  onCancel?: () => void;
}

interface GitAnalysisState {
  gitAnalysis: GitAnalysisProgress | null;
}

interface GitAnalysisActions {
  setGitAnalysis: (progress: GitAnalysisProgress | null) => void;
  cancelAnalysis: () => void;
}

type GitAnalysisStore = GitAnalysisState & GitAnalysisActions;

export const useGitAnalysisStore = create<GitAnalysisStore>((set) => ({
  gitAnalysis: null,

  setGitAnalysis: (progress) => set({ gitAnalysis: progress }),

  cancelAnalysis: () => set((state) => {
    if (state.gitAnalysis?.onCancel) {
      state.gitAnalysis.onCancel();
    }
    return { gitAnalysis: null };
  }),
}));
