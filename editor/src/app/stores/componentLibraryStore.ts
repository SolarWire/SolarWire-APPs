import { create } from 'zustand';
import { ComponentLibrary, Component, ComponentCategory } from '../../shared/types/component';
import { componentLibraryManager, LibraryLoadProgress, DropTarget } from '../services/ComponentLibraryManager';

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
  
  selectedLibraryId: string | null;
  selectedComponentId: string | null;
  selectedCategoryId: string | null;
  selectedNodeId: string | null;
  selectedNodeType: TreeNodeType | null;
  
  expandedNodes: Set<string>;
  
  searchQuery: string;
  activeCategoryId: string | null;
  
  isLibraryLoading: boolean;
  
  initialize: () => Promise<void>;
  
  setActiveLibrary: (libraryId: string | null) => void;
  setSelectedLibrary: (libraryId: string | null) => void;
  setSelectedComponent: (componentId: string | null) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setSelectedNode: (nodeId: string | null, nodeType: TreeNodeType | null, libraryId: string | null) => void;
  toggleNode: (nodeId: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategoryId: (categoryId: string | null) => void;
  
  addComponent: (libraryId: string, component: Component) => Promise<void>;
  updateComponent: (libraryId: string, componentId: string, updates: Partial<Component>) => Promise<void>;
  deleteComponent: (libraryId: string, componentId: string) => Promise<void>;
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
  moveComponent: (sourceLibraryId: string, componentId: string, targetLibraryId: string, targetCategoryId: string | null, targetComponentId: string, position: 'before' | 'after') => void;
  
  getComponentThumbnail: (libraryId: string, componentId: string) => string | null;
  setComponentThumbnail: (libraryId: string, componentId: string, thumbnail: string) => void;
  
  openManagerAtComponent: (libraryId: string, componentId: string) => void;
}

export const useComponentLibraryStore = create<ComponentLibraryStore>((set, get) => ({
  showComponentLibrary: false,
  showComponentManager: false,
  libraries: [],
  activeLibraryId: null,
  selectedLibraryId: null,
  selectedComponentId: null,
  selectedCategoryId: null,
  selectedNodeId: null,
  selectedNodeType: null,
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
  setSelectedLibrary: (libraryId) => set({ selectedLibraryId: libraryId }),
  setSelectedComponent: (componentId) => set({ selectedComponentId: componentId }),
  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),
  
  setSelectedNode: (nodeId, nodeType, libraryId) => set({ 
    selectedNodeId: nodeId, 
    selectedNodeType: nodeType,
    selectedLibraryId: nodeType === 'library' ? nodeId : libraryId,
    selectedComponentId: nodeType === 'component' ? nodeId : null,
    selectedCategoryId: nodeType === 'category' ? nodeId : null,
  }),
  
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

  updateComponent: async (libraryId, componentId, updates) => {
    await componentLibraryManager.updateComponent(libraryId, componentId, updates);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  deleteComponent: async (libraryId, componentId) => {
    await componentLibraryManager.deleteComponent(libraryId, componentId);
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
  },
  
  moveComponent: async (sourceLibraryId, componentId, targetLibraryId, targetCategoryId, targetComponentId, position) => {
    if (sourceLibraryId === targetLibraryId) {
      await componentLibraryManager.moveComponentInCategory(sourceLibraryId, componentId, targetCategoryId, targetComponentId, position);
    } else {
      await componentLibraryManager.moveComponentToCategory(sourceLibraryId, componentId, targetLibraryId, targetCategoryId, targetComponentId, position);
    }
    set({ libraries: componentLibraryManager.getLibraries() });
  },
  
  getComponentThumbnail: (libraryId, componentId) => {
    return componentLibraryManager.getComponentThumbnail(libraryId, componentId);
  },
  
  setComponentThumbnail: (libraryId, componentId, thumbnail) => {
    componentLibraryManager.setComponentThumbnail(libraryId, componentId, thumbnail);
  },
  
  openManagerAtComponent: (libraryId, componentId) => {
    set({ 
      selectedLibraryId: libraryId,
      selectedComponentId: componentId,
      selectedNodeId: componentId,
      selectedNodeType: 'component',
      showComponentManager: true,
    });
  },
}));
