import { useState, useCallback } from 'react';

export interface SelectedItem {
  view: 'file' | 'solarwire';
  path: string;
  snippetId?: string;
}

export const useSelection = () => {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const setSelection = useCallback((view: 'file' | 'solarwire', path: string, snippetId?: string) => {
    setSelectedItem({ view, path, snippetId });
  }, []);

  const getSelectionForView = useCallback((view: 'file' | 'solarwire') => {
    return selectedItem && selectedItem.view === view ? selectedItem : null;
  }, [selectedItem]);

  const clearSelection = useCallback(() => {
    setSelectedItem(null);
  }, []);

  return {
    selectedItem,
    setSelection,
    getSelectionForView,
    clearSelection
  };
};
