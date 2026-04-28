import { create } from 'zustand';

export interface SelectedItem {
  view: 'file' | 'requirement' | 'solarwire';
  path: string;
  snippetId?: string;
}

export interface SelectionState {
  selectedItem: SelectedItem | null;
  setSelection: (view: 'file' | 'requirement' | 'solarwire', path: string, snippetId?: string) => void;
  getSelectionForView: (view: 'file' | 'requirement' | 'solarwire') => SelectedItem | null;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedItem: null,
  setSelection: (view: 'file' | 'requirement' | 'solarwire', path: string, snippetId?: string) => {
    set({ selectedItem: { view, path, snippetId } });
  },
  getSelectionForView: (view: 'file' | 'requirement' | 'solarwire') => {
    const { selectedItem } = get();
    return selectedItem && selectedItem.view === view ? selectedItem : null;
  },
  clearSelection: () => {
    set({ selectedItem: null });
  },
}));
