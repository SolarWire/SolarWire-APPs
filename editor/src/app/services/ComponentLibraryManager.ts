import { ComponentLibrary, Component, ComponentCategory } from '../../shared/types/component';
import { indexedDBService } from './IndexedDBService';
import { parseSWC, serializeSWC } from '../../lib/components/swc-parser';
import { generateThumbnailBatch } from '../../lib/components/thumbnail-generator';

import defaultLibrary from '../../lib/components/presets/default.swc.json';

export interface LibraryLoadProgress {
  phase: 'parsing' | 'generating-thumbnails' | 'done';
  progress: number;
  total: number;
  currentComponentId?: string;
  errors: Array<{ componentId: string; componentName: string; message: string }>;
}

export interface DropTarget {
  targetType: 'library' | 'category' | 'component';
  targetId: string;
  position: 'before' | 'after' | 'inside';
  sourceId?: string;
  sourceType?: 'category' | 'component';
}

function isThumbnailFailed(thumbnail: string): boolean {
  if (!thumbnail) return true;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(thumbnail, 'image/svg+xml');
    if (doc.querySelector('parsererror')) return true;
    if (!doc.querySelector('svg')) return true;
    return false;
  } catch {
    return true;
  }
}

class ComponentLibraryManager {
  private libraries: Map<string, ComponentLibrary> = new Map();
  private thumbnailCache: Map<string, Map<string, string>> = new Map();

  async initialize(): Promise<void> {
    await indexedDBService.init();

    const presetLib = defaultLibrary as unknown as ComponentLibrary;
    this.libraries.set(presetLib.metadata.id, structuredClone(presetLib));

    const userLibraries = await indexedDBService.getAllLibraries();
    userLibraries.forEach(lib => {
      this.libraries.set(lib.metadata.id, lib);
    });
  }

  getLibraries(): ComponentLibrary[] {
    return Array.from(this.libraries.values());
  }

  getLibrary(id: string): ComponentLibrary | null {
    return this.libraries.get(id) || null;
  }

  async addLibrary(library: ComponentLibrary): Promise<void> {
    this.libraries.set(library.metadata.id, structuredClone(library));
    if (!library.metadata.id.startsWith('preset-')) {
      await indexedDBService.saveLibrary(library);
    }
  }

  async createLibrary(metadata: { name: string; id?: string; description?: string; version?: string; author?: string }): Promise<ComponentLibrary> {
    const now = new Date().toISOString();
    const library: ComponentLibrary = {
      $schema: 'solarwire-component-library-v1',
      metadata: {
        id: metadata.id || `library-${Date.now()}`,
        name: metadata.name,
        description: metadata.description,
        version: metadata.version || '1.0.0',
        author: metadata.author,
        createdAt: now,
        updatedAt: now,
      },
      categories: [],
      components: [],
    };
    await this.addLibrary(library);
    return library;
  }

  async removeLibrary(id: string): Promise<void> {
    this.libraries.delete(id);
    this.thumbnailCache.delete(id);
    if (!id.startsWith('preset-')) {
      await indexedDBService.deleteLibrary(id);
    }
  }

  async updateLibrary(id: string, updates: Partial<ComponentLibrary>): Promise<void> {
    const library = this.libraries.get(id);
    if (!library) throw new Error(`Library ${id} not found`);

    const updated: ComponentLibrary = {
      ...library,
      ...updates,
      metadata: {
        ...library.metadata,
        ...(updates.metadata || {}),
        updatedAt: new Date().toISOString(),
      },
    };

    this.libraries.set(id, updated);
    if (!id.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }
  }

  async addComponent(libraryId: string, component: Component): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const updated: ComponentLibrary = {
      ...library,
      components: [...library.components, component],
      metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
    };

    this.libraries.set(libraryId, updated);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }
  }

  async createComponent(libraryId: string, categoryId: string | null, component: Partial<Component>): Promise<Component> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const now = new Date().toISOString();
    const newComponent: Component = {
      id: component.id || `component-${Date.now()}`,
      name: component.name || '新组件',
      description: component.description,
      categoryId: categoryId || undefined,
      code: component.code || '',
      createdAt: now,
      updatedAt: now,
    };

    const updated: ComponentLibrary = {
      ...library,
      components: [...library.components, newComponent],
      metadata: { ...library.metadata, updatedAt: now },
    };

    this.libraries.set(libraryId, updated);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }

    if (newComponent.code) {
      const { generateThumbnail } = await import('../../lib/components/thumbnail-generator');
      const thumbnail = await generateThumbnail(newComponent.code);
      this.setComponentThumbnail(libraryId, newComponent.id, thumbnail);
    }

    return newComponent;
  }

  async updateComponent(libraryId: string, componentId: string, updates: Partial<Component>): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const index = library.components.findIndex(c => c.id === componentId);
    if (index === -1) throw new Error(`Component ${componentId} not found`);

    const updatedComponents = [...library.components];
    updatedComponents[index] = { ...updatedComponents[index], ...updates, updatedAt: new Date().toISOString() };

    const updated: ComponentLibrary = {
      ...library,
      components: updatedComponents,
      metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
    };

    this.libraries.set(libraryId, updated);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }

    if (updates.code) {
      const cache = this.thumbnailCache.get(libraryId);
      if (cache) {
        const { generateThumbnail } = await import('../../lib/components/thumbnail-generator');
        const thumbnail = await generateThumbnail(updates.code);
        cache.set(componentId, thumbnail);
      }
    }
  }

  async deleteComponent(libraryId: string, componentId: string): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const updated: ComponentLibrary = {
      ...library,
      components: library.components.filter(c => c.id !== componentId),
      metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
    };

    this.thumbnailCache.get(libraryId)?.delete(componentId);
    this.libraries.set(libraryId, updated);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }
  }

  async createCategory(libraryId: string, category: { name: string; id?: string }): Promise<ComponentCategory> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const newCategory: ComponentCategory = {
      id: category.id || `category-${Date.now()}`,
      name: category.name || '新分类',
      parentId: null,
    };

    const updated: ComponentLibrary = {
      ...library,
      categories: [...library.categories, newCategory],
      metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
    };

    this.libraries.set(libraryId, updated);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }

    return newCategory;
  }

  async updateCategory(libraryId: string, categoryId: string, updates: Partial<ComponentCategory>): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const index = library.categories.findIndex(c => c.id === categoryId);
    if (index === -1) throw new Error(`Category ${categoryId} not found`);

    const updatedCategories = [...library.categories];
    updatedCategories[index] = { ...updatedCategories[index], ...updates };

    const updated: ComponentLibrary = {
      ...library,
      categories: updatedCategories,
      metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
    };

    this.libraries.set(libraryId, updated);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }
  }

  async deleteCategory(libraryId: string, categoryId: string): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const updatedComponents = library.components.map(c =>
      c.categoryId === categoryId ? { ...c, categoryId: undefined } : c
    );

    const updated: ComponentLibrary = {
      ...library,
      categories: library.categories.filter(c => c.id !== categoryId),
      components: updatedComponents,
      metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
    };

    this.libraries.set(libraryId, updated);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }
  }

  async moveCategoryInList(libraryId: string, categoryId: string, targetId: string, position: 'before' | 'after'): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const categories = [...library.categories];
    const sourceIndex = categories.findIndex(c => c.id === categoryId);
    const targetIndex = categories.findIndex(c => c.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [moved] = categories.splice(sourceIndex, 1);
    const newTargetIndex = categories.findIndex(c => c.id === targetId);
    const insertIndex = position === 'before' ? newTargetIndex : newTargetIndex + 1;
    categories.splice(insertIndex, 0, moved);

    const updated: ComponentLibrary = {
      ...library,
      categories,
      metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
    };

    this.libraries.set(libraryId, updated);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }
  }

  async moveCategoryToLibrary(sourceLibraryId: string, categoryId: string, targetLibraryId: string, targetCategoryId: string | null, position: 'before' | 'after' | 'inside'): Promise<void> {
    const sourceLibrary = this.libraries.get(sourceLibraryId);
    const targetLibrary = this.libraries.get(targetLibraryId);
    if (!sourceLibrary || !targetLibrary) return;

    const catIndex = sourceLibrary.categories.findIndex(c => c.id === categoryId);
    if (catIndex === -1) return;

    const sourceCategories = [...sourceLibrary.categories];
    const [movedCategory] = sourceCategories.splice(catIndex, 1);

    const componentsToMove = sourceLibrary.components.filter(c => c.categoryId === categoryId);
    const sourceComponents = sourceLibrary.components.filter(c => c.categoryId !== categoryId);

    const targetCategories = [...targetLibrary.categories];
    const targetComponents = [...targetLibrary.components];

    componentsToMove.forEach(c => {
      targetComponents.push({ ...c, categoryId: movedCategory.id });
    });

    if (position === 'inside') {
      targetCategories.push(movedCategory);
    } else if (targetCategoryId) {
      const targetCatIndex = targetCategories.findIndex(c => c.id === targetCategoryId);
      if (targetCatIndex >= 0) {
        const insertIndex = position === 'before' ? targetCatIndex : targetCatIndex + 1;
        targetCategories.splice(insertIndex, 0, movedCategory);
      } else {
        targetCategories.push(movedCategory);
      }
    } else {
      targetCategories.push(movedCategory);
    }

    const now = new Date().toISOString();
    const updatedSource: ComponentLibrary = {
      ...sourceLibrary,
      categories: sourceCategories,
      components: sourceComponents,
      metadata: { ...sourceLibrary.metadata, updatedAt: now },
    };
    const updatedTarget: ComponentLibrary = {
      ...targetLibrary,
      categories: targetCategories,
      components: targetComponents,
      metadata: { ...targetLibrary.metadata, updatedAt: now },
    };

    this.libraries.set(sourceLibraryId, updatedSource);
    this.libraries.set(targetLibraryId, updatedTarget);

    if (!sourceLibraryId.startsWith('preset-')) await indexedDBService.saveLibrary(updatedSource);
    if (!targetLibraryId.startsWith('preset-')) await indexedDBService.saveLibrary(updatedTarget);
  }

  async moveComponentInCategory(libraryId: string, componentId: string, targetCategoryId: string | null, targetComponentId: string, position: 'before' | 'after'): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) return;

    const components = [...library.components];
    const componentIndex = components.findIndex(c => c.id === componentId);
    if (componentIndex === -1) return;

    const [movedComponent] = components.splice(componentIndex, 1);
    const updatedMovedComponent = { ...movedComponent, categoryId: targetCategoryId || undefined };

    if (targetComponentId) {
      const targetIndex = components.findIndex(c => c.id === targetComponentId);
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      components.splice(insertIndex, 0, updatedMovedComponent);
    } else {
      components.push(updatedMovedComponent);
    }

    const updated: ComponentLibrary = {
      ...library,
      components,
      metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
    };

    this.libraries.set(libraryId, updated);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }
  }

  async moveComponentToCategory(sourceLibraryId: string, componentId: string, targetLibraryId: string, targetCategoryId: string | null): Promise<void> {
    const sourceLibrary = this.libraries.get(sourceLibraryId);
    const targetLibrary = this.libraries.get(targetLibraryId);
    if (!sourceLibrary || !targetLibrary) return;

    const compIndex = sourceLibrary.components.findIndex(c => c.id === componentId);
    if (compIndex === -1) return;

    const sourceComponents = [...sourceLibrary.components];
    const [movedComponent] = sourceComponents.splice(compIndex, 1);
    const updatedMovedComponent = { ...movedComponent, categoryId: targetCategoryId || undefined };

    const targetComponents = [...targetLibrary.components, updatedMovedComponent];

    const now = new Date().toISOString();
    const updatedSource: ComponentLibrary = {
      ...sourceLibrary,
      components: sourceComponents,
      metadata: { ...sourceLibrary.metadata, updatedAt: now },
    };
    const updatedTarget: ComponentLibrary = {
      ...targetLibrary,
      components: targetComponents,
      metadata: { ...targetLibrary.metadata, updatedAt: now },
    };

    this.libraries.set(sourceLibraryId, updatedSource);
    this.libraries.set(targetLibraryId, updatedTarget);

    if (!sourceLibraryId.startsWith('preset-')) await indexedDBService.saveLibrary(updatedSource);
    if (!targetLibraryId.startsWith('preset-')) await indexedDBService.saveLibrary(updatedTarget);
  }

  getComponentThumbnail(libraryId: string, componentId: string): string | null {
    return this.thumbnailCache.get(libraryId)?.get(componentId) || null;
  }

  setComponentThumbnail(libraryId: string, componentId: string, thumbnail: string): void {
    if (!this.thumbnailCache.has(libraryId)) {
      this.thumbnailCache.set(libraryId, new Map());
    }
    this.thumbnailCache.get(libraryId)!.set(componentId, thumbnail);
  }

  exportLibrary(libraryId: string): void {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const content = serializeSWC(library);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${library.metadata.name.replace(/\s+/g, '-').toLowerCase()}.swc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importLibrary(
    file: File,
    onProgress?: (progress: LibraryLoadProgress) => void
  ): Promise<{ library: ComponentLibrary; errors: Array<{ componentId: string; componentName: string; message: string }> }> {
    const text = await file.text();
    const isJSON = text.trim().startsWith('{');

    let library: ComponentLibrary;
    let parseErrors: Array<{ componentId?: string; componentName?: string; line: number; message: string }> = [];

    if (isJSON) {
      library = JSON.parse(text) as ComponentLibrary;
      if (!library.$schema || !library.metadata || !library.components) {
        throw new Error('Invalid component library file format');
      }
    } else {
      const result = parseSWC(text);
      library = result.library;
      parseErrors = result.errors;
    }

    if (!library.metadata.id) {
      library.metadata.id = `imported-${Date.now()}`;
    }

    const errors = parseErrors.map(e => ({
      componentId: e.componentId || '',
      componentName: e.componentName || '',
      message: e.message,
    }));

    onProgress?.({
      phase: 'parsing',
      progress: parseErrors.length === 0 ? library.components.length : 0,
      total: library.components.length,
      errors,
    });

    await this.addLibrary(library);

    onProgress?.({
      phase: 'generating-thumbnails',
      progress: 0,
      total: library.components.length,
      errors,
    });

    for (let i = 0; i < library.components.length; i++) {
      const component = library.components[i];
      const { generateThumbnail } = await import('../../lib/components/thumbnail-generator');
      const thumbnail = await generateThumbnail(component.code);
      this.setComponentThumbnail(library.metadata.id, component.id, thumbnail);

      const failed = isThumbnailFailed(thumbnail);
      if (failed) {
        errors.push({
          componentId: component.id,
          componentName: component.name,
          message: 'SolarWire 代码解析失败',
        });
      }

      onProgress?.({
        phase: 'generating-thumbnails',
        progress: i + 1,
        total: library.components.length,
        currentComponentId: component.id,
        errors,
      });

      if (i % 5 === 4) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    onProgress?.({
      phase: 'done',
      progress: library.components.length,
      total: library.components.length,
      errors,
    });

    return { library, errors };
  }

  async generateThumbnailsForLibrary(libraryId: string, onProgress?: (progress: LibraryLoadProgress) => void): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) return;

    const total = library.components.length;
    const errors: Array<{ componentId: string; componentName: string; message: string }> = [];

    for (let i = 0; i < library.components.length; i++) {
      const component = library.components[i];
      const { generateThumbnail } = await import('../../lib/components/thumbnail-generator');
      const thumbnail = await generateThumbnail(component.code);
      this.setComponentThumbnail(libraryId, component.id, thumbnail);

      const failed = isThumbnailFailed(thumbnail);
      if (failed) {
        errors.push({
          componentId: component.id,
          componentName: component.name,
          message: 'SolarWire 代码解析失败',
        });
      }

      onProgress?.({
        phase: 'generating-thumbnails',
        progress: i + 1,
        total,
        currentComponentId: component.id,
        errors,
      });

      if (i % 5 === 4) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    onProgress?.({
      phase: 'done',
      progress: total,
      total,
      errors,
    });
  }

  async loadPresetLibraries(onProgress?: (progress: LibraryLoadProgress) => void): Promise<void> {
    for (const [, library] of this.libraries) {
      if (library.metadata.id.startsWith('preset-')) {
        await this.generateThumbnailsForLibrary(library.metadata.id, onProgress);
      }
    }
  }

  getThumbnailCache(libraryId: string): Map<string, string> {
    return this.thumbnailCache.get(libraryId) || new Map();
  }

  setThumbnailCache(libraryId: string, cache: Map<string, string>): void {
    this.thumbnailCache.set(libraryId, cache);
  }
}

export const componentLibraryManager = new ComponentLibraryManager();
