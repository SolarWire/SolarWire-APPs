import { ComponentLibrary } from '../../../shared/types/component';
import { componentLibraryManager } from '../../services/ComponentLibraryManager';

type SetLibraries = (update: { libraries: ComponentLibrary[] }) => void;

export function createLibraryRefreshHelper(set: SetLibraries) {
  return async function withLibraryRefresh<T>(operation: () => Promise<T>): Promise<T> {
    const result = await operation();
    set({ libraries: componentLibraryManager.getLibraries() });
    return result;
  };
}

export type ReorderDirection = 'top' | 'up' | 'down' | 'bottom';

export function reorderArray<T>(items: T[], currentIndex: number, direction: ReorderDirection): T[] | null {
  const length = items.length;
  let newIndex: number;
  switch (direction) {
    case 'top': newIndex = 0; break;
    case 'up': newIndex = Math.max(0, currentIndex - 1); break;
    case 'down': newIndex = Math.min(length - 1, currentIndex + 1); break;
    case 'bottom': newIndex = length - 1; break;
  }
  if (newIndex === currentIndex) return null;
  const result = [...items];
  const [removed] = result.splice(currentIndex, 1);
  result.splice(newIndex, 0, removed);
  return result;
}
