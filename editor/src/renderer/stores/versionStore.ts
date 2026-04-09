import { create } from 'zustand';

interface GitCommit {
  id: string;
  timestamp: number;
  author: string;
  message: string;
  files: string[];
}

interface VersionState {
  versions: GitCommit[];
  selectedVersion: string | null;
  setVersions: (versions: GitCommit[]) => void;
  setSelectedVersion: (version: string | null) => void;
}

export const useVersionStore = create<VersionState>((set) => ({
  versions: [],
  selectedVersion: null,
  setVersions: (versions) => set({ versions }),
  setSelectedVersion: (version) => set({ selectedVersion: version }),
}));
