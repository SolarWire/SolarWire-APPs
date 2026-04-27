import { create } from 'zustand';
import { ComponentLibrary, Component, ComponentCategory, makeNodeId, parseNodeId, makeUncategorizedKey, isPresetLibrary } from '../../shared/types/component';
import { componentLibraryManager, LibraryLoadProgress, DropTarget, LibraryConflictError } from '../services/ComponentLibraryManager';

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

  showComponentManager: boolean;
  setShowComponentManager: (show: boolean) => void;

  libraries: ComponentLibrary[];
  activeLibraryId: string | null;

  selectedNodeId: string | null;
  selectedNodeType: TreeNodeType | null;
  selectedLibraryId: string | null;
  selectedComponentId: string | null;
  selectedCategoryId: string | null;

  expandedNodes: Set<string>;

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

  getComponentThumbnail: (libraryId: string, componentInternalId: string) => string | null;
  setComponentThumbnail: (libraryId: string, componentInternalId: string, thumbnail: string) => void;

  openManagerAtComponent: (libraryId: string, componentInternalId: string) => void;
}

export const useComponentLibraryStore = create<ComponentLibraryStore>((set, get) => ({
  showComponentLibrary: false,
  showComponentManager: false,
  libraries: [],
  activeLibraryId: null,
  selectedNodeId: null,
  selectedNodeType: null,
  selectedLibraryId: null,
  selectedComponentId: null,
  selectedCategoryId: null,
  expandedNodes: new Set(),
  searchQuery: '',
  activeCategoryId: null,
  isLibraryLoading: false,

  setShowComponentLibrary: (show) => set({ showComponentLibrary: show }),
  setShowComponentManager: (show) => set({ showComponentManager: show }),

  initialize: async () => {
    await componentLibraryManager.initialize();
    set({
      libraries: componentLibraryManager.getLibraries(),
      activeLibraryId: componentLibraryManager.getLibraries()[0]?.metadata.id || null,
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

  toggleNode: (nodeId) => set((state) => {
    const newExpanded = new Set(state.expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    return { expandedNodes: newExpanded };
  }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveCategoryId: (activeCategoryId) => set({ activeCategoryId }),

  addComponent: async (libraryId, component) => {
    await componentLibraryManager.addComponent(libraryId, component);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  updateComponent: async (libraryId, componentInternalId, updates) => {
    await componentLibraryManager.updateComponent(libraryId, componentInternalId, updates);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  deleteComponent: async (libraryId, componentInternalId) => {
    await componentLibraryManager.deleteComponent(libraryId, componentInternalId);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  createComponent: async (libraryId, categoryId, component) => {
    const newComponent = await componentLibraryManager.createComponent(libraryId, categoryId, component);
    set({ libraries: componentLibraryManager.getLibraries() });
    return newComponent;
  },

  addLibrary: async (library) => {
    await componentLibraryManager.addLibrary(library);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  removeLibrary: async (libraryId) => {
    await componentLibraryManager.removeLibrary(libraryId);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  updateLibrary: async (libraryId, updates) => {
    await componentLibraryManager.updateLibrary(libraryId, updates);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  createLibrary: async (metadata) => {
    const library = await componentLibraryManager.createLibrary(metadata);
    set({ libraries: componentLibraryManager.getLibraries() });
    return library;
  },

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

  createCategory: async (libraryId, category) => {
    const newCategory = await componentLibraryManager.createCategory(libraryId, category);
    set({ libraries: componentLibraryManager.getLibraries() });
    return newCategory;
  },

  updateCategory: async (libraryId, categoryId, updates) => {
    await componentLibraryManager.updateCategory(libraryId, categoryId, updates);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  deleteCategory: async (libraryId, categoryId) => {
    await componentLibraryManager.deleteCategory(libraryId, categoryId);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  moveCategory: async (sourceLibraryId, categoryId, targetLibraryId, targetCategoryId, position) => {
    try {
      if (sourceLibraryId === targetLibraryId) {
        if (targetCategoryId) {
          await componentLibraryManager.moveCategoryInList(sourceLibraryId, categoryId, targetCategoryId, position as 'before' | 'after');
        } else {
          await componentLibraryManager.moveCategoryToEnd(sourceLibraryId, categoryId, position as 'before' | 'after');
        }
      } else {
        await componentLibraryManager.moveCategoryToLibrary(sourceLibraryId, categoryId, targetLibraryId, targetCategoryId, position);
      }
      set({ libraries: componentLibraryManager.getLibraries() });
    } catch (error) {
      if (error instanceof Error && error.message.includes('预设组件库不可修改')) {
        alert(error.message);
      }
      throw error;
    }
  },

  moveComponent: async (sourceLibraryId, componentInternalId, targetLibraryId, targetCategoryId, targetComponentInternalId, position) => {
    try {
      if (sourceLibraryId === targetLibraryId) {
        await componentLibraryManager.moveComponentInCategory(sourceLibraryId, componentInternalId, targetCategoryId, targetComponentInternalId, position);
      } else {
        await componentLibraryManager.moveComponentToCategory(sourceLibraryId, componentInternalId, targetLibraryId, targetCategoryId, targetComponentInternalId, position);
      }
      set({ libraries: componentLibraryManager.getLibraries() });
    } catch (error) {
      if (error instanceof Error && error.message.includes('预设组件库不可修改')) {
        alert(error.message);
      }
      throw error;
    }
  },

  moveLibrary: async (sourceLibraryId, targetLibraryId, position) => {
    await componentLibraryManager.moveLibraryInList(sourceLibraryId, targetLibraryId, position);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  getComponentThumbnail: (libraryId, componentId) => {
    return componentLibraryManager.getComponentThumbnail(libraryId, componentId);
  },

  setComponentThumbnail: (libraryId, componentId, thumbnail) => {
    componentLibraryManager.setComponentThumbnail(libraryId, componentId, thumbnail);
  },

  openManagerAtComponent: (libraryId, componentInternalId) => {
    set({
      selectedLibraryId: libraryId,
      selectedComponentId: componentInternalId,
      selectedNodeId: makeNodeId('component', componentInternalId, libraryId),
      selectedNodeType: 'component',
      selectedCategoryId: null,
      showComponentManager: true,
    });
  },
}));
