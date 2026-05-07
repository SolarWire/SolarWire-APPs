import { create } from 'zustand';
import { ComponentLibrary, Component, ComponentCategory, makeNodeId, parseNodeId, makeUncategorizedKey, isPresetLibrary } from '../../shared/types/component';
import { componentLibraryManager, LibraryLoadProgress, DropTarget, LibraryConflictError } from '../services/ComponentLibraryManager';
import { createLibraryRefreshHelper, reorderArray } from './helpers/library-crud';

export interface FailedComponentInfo {
  libraryId: string;
  componentId: string;
  componentName: string;
  message: string;
}

export type TreeNodeType = 'library' | 'category' | 'component';

export interface TreeNode {
  type: TreeNodeType;
  id: string;
  libraryId: string;
  name: string;
  isExpanded?: boolean;
  isVirtualUncategorized?: boolean;
}

interface ComponentLibraryStore {
  showComponentLibrary: boolean;
  setShowComponentLibrary: (show: boolean) => void;

  isInitialized: boolean;

  libraries: ComponentLibrary[];
  activeLibraryId: string | null;

  selectedNodeId: string | null;
  selectedNodeType: TreeNodeType | null;
  selectedLibraryId: string | null;
  selectedComponentId: string | null;
  selectedCategoryId: string | null;

  expandedNodes: string[];

  searchQuery: string;
  activeCategoryId: string | null;

  isLibraryLoading: boolean;

  initialize: () => Promise<void>;

  setActiveLibrary: (libraryId: string | null) => void;
  setSelectedNode: (nodeId: string | null, nodeType: TreeNodeType | null, libraryId: string | null) => void;
  toggleNode: (nodeId: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategoryId: (categoryId: string | null) => void;

  addComponent: (libraryId: string, component: Component) => Promise<void>;
  updateComponent: (libraryId: string, componentInternalId: string, updates: Partial<Component>) => Promise<void>;
  deleteComponent: (libraryId: string, componentInternalId: string) => Promise<void>;
  createComponent: (libraryId: string, categoryId: string | null, component: Partial<Component>) => Promise<Component>;

  addLibrary: (library: ComponentLibrary) => Promise<void>;
  removeLibrary: (libraryId: string) => Promise<void>;
  updateLibrary: (libraryId: string, updates: Partial<ComponentLibrary>) => Promise<void>;
  createLibrary: (metadata: { name: string; id?: string; description?: string; version?: string; author?: string }) => Promise<ComponentLibrary>;
  exportLibrary: (libraryId: string) => void;
  importLibrary: (file: File) => Promise<void>;

  createCategory: (libraryId: string, category: { name: string; id?: string }) => Promise<ComponentCategory>;
  updateCategory: (libraryId: string, categoryId: string, updates: Partial<ComponentCategory>) => Promise<void>;
  deleteCategory: (libraryId: string, categoryId: string) => Promise<void>;

  moveCategory: (sourceLibraryId: string, categoryId: string, targetLibraryId: string, targetCategoryId: string | null, position: 'before' | 'after' | 'inside') => void;
  moveComponent: (sourceLibraryId: string, componentInternalId: string, targetLibraryId: string, targetCategoryId: string | null, targetComponentInternalId: string, position: 'before' | 'after') => void;
  moveLibrary: (sourceLibraryId: string, targetLibraryId: string, position: 'before' | 'after') => void;

  reorderLibrary: (libraryId: string, direction: 'top' | 'up' | 'down' | 'bottom') => void;
  reorderCategory: (libraryId: string, categoryId: string, direction: 'top' | 'up' | 'down' | 'bottom') => void;
  reorderComponent: (libraryId: string, componentId: string, direction: 'top' | 'up' | 'down' | 'bottom') => void;

  getComponentThumbnail: (libraryId: string, componentInternalId: string) => string | null;
  setComponentThumbnail: (libraryId: string, componentInternalId: string, thumbnail: string) => void;

  openManagerAtComponent: (libraryId: string, componentInternalId: string) => void;
}

export const useComponentLibraryStore = create<ComponentLibraryStore>((set, get) => {
  const withRefresh = createLibraryRefreshHelper(set);

  return {
  showComponentLibrary: false,
  isInitialized: false,
  libraries: [],
  activeLibraryId: null,
  selectedNodeId: null,
  selectedNodeType: null,
  selectedLibraryId: null,
  selectedComponentId: null,
  selectedCategoryId: null,
  expandedNodes: [],
  searchQuery: '',
  activeCategoryId: null,
  isLibraryLoading: false,

  setShowComponentLibrary: async (show) => {
    set({ showComponentLibrary: show });
  },

  initialize: async () => {
    if (get().isInitialized) return;
    await componentLibraryManager.initialize();
    set({
      libraries: componentLibraryManager.getLibraries(),
      activeLibraryId: componentLibraryManager.getLibraries()[0]?.metadata.id || null,
      isInitialized: true,
    });
  },

  setActiveLibrary: (libraryId) => set({ activeLibraryId: libraryId }),

  setSelectedNode: (nodeId, nodeType, libraryId) => {
    if (!nodeId || !nodeType) {
      set({
        selectedNodeId: null,
        selectedNodeType: null,
        selectedLibraryId: null,
        selectedComponentId: null,
        selectedCategoryId: null,
      });
      return;
    }

    const namespacedId = makeNodeId(nodeType, nodeId, libraryId || '');

    set({
      selectedNodeId: namespacedId,
      selectedNodeType: nodeType,
      selectedLibraryId: nodeType === 'library' ? nodeId : libraryId,
      selectedComponentId: nodeType === 'component' ? nodeId : null,
      selectedCategoryId: nodeType === 'category' ? nodeId : null,
    });
  },

  toggleNode: (nodeId) => {
    const currentState = get();
    const newExpanded = [...currentState.expandedNodes];
    const index = newExpanded.indexOf(nodeId);
    if (index > -1) {
      newExpanded.splice(index, 1);
    } else {
      newExpanded.push(nodeId);
    }
    set({ ...currentState, expandedNodes: newExpanded });
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveCategoryId: (activeCategoryId) => set({ activeCategoryId }),

  addComponent: (libraryId, component) =>
    withRefresh(() => componentLibraryManager.addComponent(libraryId, component)),

  updateComponent: (libraryId, componentInternalId, updates) =>
    withRefresh(() => componentLibraryManager.updateComponent(libraryId, componentInternalId, updates)),

  deleteComponent: (libraryId, componentInternalId) =>
    withRefresh(() => componentLibraryManager.deleteComponent(libraryId, componentInternalId)),

  createComponent: (libraryId, categoryId, component) =>
    withRefresh(() => componentLibraryManager.createComponent(libraryId, categoryId, component)),

  addLibrary: (library) =>
    withRefresh(() => componentLibraryManager.addLibrary(library)),

  removeLibrary: (libraryId) =>
    withRefresh(() => componentLibraryManager.removeLibrary(libraryId)),

  updateLibrary: (libraryId, updates) =>
    withRefresh(() => componentLibraryManager.updateLibrary(libraryId, updates)),

  createLibrary: (metadata) =>
    withRefresh(() => componentLibraryManager.createLibrary(metadata)),

  exportLibrary: (libraryId) => {
    componentLibraryManager.exportLibrary(libraryId);
  },

  importLibrary: async (file) => {
    set({ isLibraryLoading: true });
    try {
      await componentLibraryManager.importLibrary(file);
      set({
        libraries: componentLibraryManager.getLibraries(),
        isLibraryLoading: false,
      });
    } catch (error) {
      set({ isLibraryLoading: false });
      throw error;
    }
  },

  createCategory: (libraryId, category) =>
    withRefresh(() => componentLibraryManager.createCategory(libraryId, category)),

  updateCategory: (libraryId, categoryId, updates) =>
    withRefresh(() => componentLibraryManager.updateCategory(libraryId, categoryId, updates)),

  deleteCategory: (libraryId, categoryId) =>
    withRefresh(() => componentLibraryManager.deleteCategory(libraryId, categoryId)),

  moveCategory: (sourceLibraryId, categoryId, targetLibraryId, targetCategoryId, position) =>
    withRefresh(async () => {
      if (sourceLibraryId === targetLibraryId) {
        if (targetCategoryId) {
          await componentLibraryManager.moveCategoryInList(sourceLibraryId, categoryId, targetCategoryId, position as 'before' | 'after');
        } else {
          await componentLibraryManager.moveCategoryToEnd(sourceLibraryId, categoryId, position as 'before' | 'after');
        }
      } else {
        await componentLibraryManager.moveCategoryToLibrary(sourceLibraryId, categoryId, targetLibraryId, targetCategoryId, position);
      }
    }),

  moveComponent: (sourceLibraryId, componentInternalId, targetLibraryId, targetCategoryId, targetComponentInternalId, position) =>
    withRefresh(async () => {
      if (sourceLibraryId === targetLibraryId) {
        await componentLibraryManager.moveComponentInCategory(sourceLibraryId, componentInternalId, targetCategoryId, targetComponentInternalId, position);
      } else {
        await componentLibraryManager.moveComponentToCategory(sourceLibraryId, componentInternalId, targetLibraryId, targetCategoryId, targetComponentInternalId, position);
      }
    }),

  moveLibrary: (sourceLibraryId, targetLibraryId, position) =>
    withRefresh(() => componentLibraryManager.moveLibraryInList(sourceLibraryId, targetLibraryId, position)),

  reorderLibrary: (libraryId, direction) => {
    const state = get();
    const index = state.libraries.findIndex(lib => lib.metadata.id === libraryId);
    if (index === -1) return;
    const reordered = reorderArray(state.libraries, index, direction);
    if (!reordered) return;
    set({ libraries: reordered });
  },

  reorderCategory: (libraryId, categoryId, direction) => {
    const state = get();
    const libraries = [...state.libraries];
    const libraryIndex = libraries.findIndex(lib => lib.metadata.id === libraryId);
    if (libraryIndex === -1) return;

    const library = { ...libraries[libraryIndex] };
    const index = library.categories.findIndex(cat => cat.id === categoryId);
    if (index === -1) return;

    const reordered = reorderArray(library.categories, index, direction);
    if (!reordered) return;

    library.categories = reordered;
    libraries[libraryIndex] = library;
    set({ libraries });
  },

  reorderComponent: (libraryId, componentId, direction) => {
    const state = get();
    const libraries = [...state.libraries];
    const libraryIndex = libraries.findIndex(lib => lib.metadata.id === libraryId);
    if (libraryIndex === -1) return;

    const library = { ...libraries[libraryIndex] };
    const index = library.components.findIndex(comp => comp.internalId === componentId);
    if (index === -1) return;

    const reordered = reorderArray(library.components, index, direction);
    if (!reordered) return;

    library.components = reordered;
    libraries[libraryIndex] = library;
    set({ libraries });
  },

  getComponentThumbnail: (libraryId, componentId) => {
    return componentLibraryManager.getComponentThumbnail(libraryId, componentId);
  },

  setComponentThumbnail: (libraryId, componentId, thumbnail) => {
    componentLibraryManager.setComponentThumbnail(libraryId, componentId, thumbnail);
  },

  openManagerAtComponent: (libraryId, componentInternalId) => {
    const state = get();
    const library = state.libraries.find(lib => lib.metadata.id === libraryId);
    const component = library?.components.find(comp => comp.internalId === componentInternalId);

    const nodesToExpand = new Set<string>();

    nodesToExpand.add(libraryId);

    if (component?.categoryId) {
      nodesToExpand.add(component.categoryId);
    }

    set({
      selectedLibraryId: libraryId,
      selectedComponentId: componentInternalId,
      selectedNodeId: makeNodeId('component', componentInternalId, libraryId),
      selectedNodeType: 'component',
      selectedCategoryId: component?.categoryId || null,
      expandedNodes: Array.from(new Set([...state.expandedNodes, ...nodesToExpand])),
    });
  },
  };
});
