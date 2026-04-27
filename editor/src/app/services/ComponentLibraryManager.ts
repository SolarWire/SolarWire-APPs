import { ComponentLibrary, Component, ComponentCategory, ComponentLibraryMetadata, generateInternalId, generatePrefixedId, isPresetLibrary } from '../../shared/types/component';
import { indexedDBService } from './IndexedDBService';
import { parseSWC, serializeSWC } from '../../lib/components/swc-parser';

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

export class LibraryConflictError extends Error {
  constructor(public libraryId: string) {
    super(`组件库 ID "${libraryId}" 已存在`);
    this.name = 'LibraryConflictError';
  }
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

function ensureInternalId(component: Component, existingIds?: Set<string>): Component {
  if (!component.internalId) {
    return { ...component, internalId: generateInternalId(existingIds) };
  }
  return component;
}

function withoutInternalId(component: Component): Omit<Component, 'internalId'> {
  const { internalId, ...rest } = component;
  return rest;
}

interface SerializedComponentLibrary {
  $schema: string;
  metadata: ComponentLibraryMetadata;
  categories: ComponentCategory[];
  components: Array<Omit<Component, 'internalId'>>;
}

function cloneLibraryForSave(library: ComponentLibrary): SerializedComponentLibrary {
  return {
    $schema: library.$schema,
    metadata: library.metadata,
    categories: library.categories,
    components: library.components.map(c => withoutInternalId(c)),
  };
}

function ensureLibraryInternalIds(library: ComponentLibrary): ComponentLibrary {
  const existingIds = new Set(library.components.map(c => c.internalId).filter(Boolean));
  return {
    ...library,
    components: library.components.map(c => ensureInternalId(c, existingIds)),
  } as ComponentLibrary;
}

class ComponentLibraryManager {
  private libraries: Map<string, ComponentLibrary> = new Map();
  private libraryOrder: string[] = [];
  private thumbnailCache: Map<string, Map<string, string>> = new Map();
  private failedComponents: Map<string, Map<string, string>> = new Map();
  private operationLock: Promise<void> = Promise.resolve();

  private withLock<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.operationLock;
    let resolve: () => void;
    this.operationLock = new Promise(r => { resolve = r; });
    return prev.then(() => fn()).finally(() => resolve!());
  }

  async initialize(): Promise<void> {
    await indexedDBService.init();

    const presetLib = ensureLibraryInternalIds(defaultLibrary as unknown as ComponentLibrary);
    this.libraries.set(presetLib.metadata.id, presetLib);
    if (!this.libraryOrder.includes(presetLib.metadata.id)) {
      this.libraryOrder.push(presetLib.metadata.id);
    }

    const userLibraries = await indexedDBService.getAllLibraries();
    userLibraries.forEach(lib => {
      const libWithIds = ensureLibraryInternalIds(lib);
      this.libraries.set(libWithIds.metadata.id, libWithIds);
      if (!this.libraryOrder.includes(libWithIds.metadata.id)) {
        this.libraryOrder.push(libWithIds.metadata.id);
      }
    });
  }

  getLibraries(): ComponentLibrary[] {
    return this.libraryOrder.map(id => this.libraries.get(id)).filter((lib): lib is ComponentLibrary => lib !== undefined);
  }

  getLibrary(id: string): ComponentLibrary | null {
    return this.libraries.get(id) || null;
  }

  hasLibrary(id: string): boolean {
    return this.libraries.has(id);
  }

  async addLibrary(library: ComponentLibrary, overwrite?: boolean): Promise<void> {
    return this.withLock(async () => {
      const libWithInternalIds = ensureLibraryInternalIds(structuredClone(library));
      const id = libWithInternalIds.metadata.id;

      if (this.libraries.has(id) && !overwrite) {
        throw new LibraryConflictError(id);
      }

      this.libraries.set(id, libWithInternalIds);
      if (!this.libraryOrder.includes(id)) {
        this.libraryOrder.push(id);
      }
      if (!isPresetLibrary(id)) {
        const libForSave = cloneLibraryForSave(libWithInternalIds);
        await indexedDBService.saveLibrary(libForSave as unknown as ComponentLibrary);
      }
    });
  }

  async createLibrary(metadata: { name: string; id?: string; description?: string; version?: string; author?: string }): Promise<ComponentLibrary> {
    const existingIds = new Set(this.libraries.keys());
    const now = new Date().toISOString();
    const library: ComponentLibrary = {
      $schema: 'solarwire-component-library-v1',
      metadata: {
        id: metadata.id || generatePrefixedId('library', existingIds),
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
    return this.withLock(async () => {
      this.libraries.delete(id);
      this.libraryOrder = this.libraryOrder.filter(libId => libId !== id);
      this.thumbnailCache.delete(id);
      this.failedComponents.delete(id);
      if (!isPresetLibrary(id)) {
        await indexedDBService.deleteLibrary(id);
      }
    });
  }

  async moveLibraryInList(sourceLibraryId: string, targetLibraryId: string, position: 'before' | 'after'): Promise<void> {
    return this.withLock(async () => {
      const sourceIndex = this.libraryOrder.indexOf(sourceLibraryId);
      const targetIndex = this.libraryOrder.indexOf(targetLibraryId);

      if (sourceIndex === -1 || targetIndex === -1) return;
      if (sourceIndex === targetIndex) return;

      const newOrder = [...this.libraryOrder];
      newOrder.splice(sourceIndex, 1);

      const insertIndex = position === 'before' ? newOrder.indexOf(targetLibraryId) : newOrder.indexOf(targetLibraryId) + 1;
      newOrder.splice(insertIndex, 0, sourceLibraryId);
      this.libraryOrder = newOrder;
    });
  }

  async updateLibrary(id: string, updates: Partial<ComponentLibrary>): Promise<void> {
    return this.withLock(async () => {
      if (isPresetLibrary(id)) {
        throw new Error('预设组件库不可修改');
      }
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
      const libForSave = cloneLibraryForSave(updated);
      await indexedDBService.saveLibrary(libForSave as unknown as ComponentLibrary);
    });
  }

  async addComponent(libraryId: string, component: Component): Promise<void> {
    return this.withLock(async () => {
      if (isPresetLibrary(libraryId)) {
        throw new Error('预设组件库不可修改');
      }
      const library = this.libraries.get(libraryId);
      if (!library) throw new Error(`Library ${libraryId} not found`);

      const existingIds = new Set(library.components.map(c => c.internalId));
      const componentWithInternalId = ensureInternalId(component, existingIds);
      const updated: ComponentLibrary = {
        ...library,
        components: [...library.components, componentWithInternalId],
        metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
      };

      this.libraries.set(libraryId, updated);
      const libForSave = cloneLibraryForSave(updated);
      await indexedDBService.saveLibrary(libForSave as unknown as ComponentLibrary);
    });
  }

  async createComponent(libraryId: string, categoryId: string | null, component: Partial<Component>): Promise<Component> {
    return this.withLock(async () => {
      if (isPresetLibrary(libraryId)) {
        throw new Error('预设组件库不可修改');
      }
      const library = this.libraries.get(libraryId);
      if (!library) throw new Error(`Library ${libraryId} not found`);

      const now = new Date().toISOString();
      const existingIds = new Set(library.components.map(c => c.internalId));
      const newComponent: Component = {
        id: component.id || generatePrefixedId('component', existingIds),
        internalId: generateInternalId(existingIds),
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
      const libForSave = cloneLibraryForSave(updated);
      await indexedDBService.saveLibrary(libForSave as unknown as ComponentLibrary);

      if (newComponent.code) {
        const { generateThumbnail } = await import('../../lib/components/thumbnail-generator');
        const thumbnail = await generateThumbnail(newComponent.code);
        this.setComponentThumbnail(libraryId, newComponent.internalId, thumbnail);
        if (isThumbnailFailed(thumbnail)) {
          this.setFailedComponent(libraryId, newComponent.internalId, 'SolarWire 代码解析失败');
        } else {
          this.clearFailedComponent(libraryId, newComponent.internalId);
        }
      }

      return newComponent;
    });
  }

  async updateComponent(libraryId: string, componentInternalId: string, updates: Partial<Component>): Promise<void> {
    return this.withLock(async () => {
      if (isPresetLibrary(libraryId)) {
        throw new Error('预设组件库不可修改');
      }
      const library = this.libraries.get(libraryId);
      if (!library) throw new Error(`Library ${libraryId} not found`);

      const index = library.components.findIndex(c => c.internalId === componentInternalId);
      if (index === -1) throw new Error(`Component ${componentInternalId} not found`);

      const updatedComponents = [...library.components];
      updatedComponents[index] = { ...updatedComponents[index], ...updates, updatedAt: new Date().toISOString() };

      const updated: ComponentLibrary = {
        ...library,
        components: updatedComponents,
        metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
      };

      this.libraries.set(libraryId, updated);
      const libForSave = cloneLibraryForSave(updated);
      await indexedDBService.saveLibrary(libForSave as unknown as ComponentLibrary);

      if (updates.code !== undefined) {
        const { generateThumbnail } = await import('../../lib/components/thumbnail-generator');
        const thumbnail = await generateThumbnail(updates.code);
        this.setComponentThumbnail(libraryId, componentInternalId, thumbnail);
        if (isThumbnailFailed(thumbnail)) {
          this.setFailedComponent(libraryId, componentInternalId, 'SolarWire 代码解析失败');
        } else {
          this.clearFailedComponent(libraryId, componentInternalId);
        }
      }
    });
  }

  async deleteComponent(libraryId: string, componentInternalId: string): Promise<void> {
    return this.withLock(async () => {
      if (isPresetLibrary(libraryId)) {
        throw new Error('预设组件库不可修改');
      }
      const library = this.libraries.get(libraryId);
      if (!library) throw new Error(`Library ${libraryId} not found`);

      const updated: ComponentLibrary = {
        ...library,
        components: library.components.filter(c => c.internalId !== componentInternalId),
        metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
      };

      this.thumbnailCache.get(libraryId)?.delete(componentInternalId);
      this.failedComponents.get(libraryId)?.delete(componentInternalId);
      this.libraries.set(libraryId, updated);
      const libForSave = cloneLibraryForSave(updated);
      await indexedDBService.saveLibrary(libForSave as unknown as ComponentLibrary);
    });
  }

  async createCategory(libraryId: string, category: { name: string; id?: string }): Promise<ComponentCategory> {
    return this.withLock(async () => {
      if (isPresetLibrary(libraryId)) {
        throw new Error('预设组件库不可修改');
      }
      const library = this.libraries.get(libraryId);
      if (!library) throw new Error(`Library ${libraryId} not found`);

      const existingIds = new Set(library.categories.map(c => c.id));
      const newCategory: ComponentCategory = {
        id: category.id || generatePrefixedId('category', existingIds),
        name: category.name || '新分类',
        parentId: null,
      };

      const updated: ComponentLibrary = {
        ...library,
        categories: [...library.categories, newCategory],
        metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
      };

      this.libraries.set(libraryId, updated);
      await indexedDBService.saveLibrary(updated as unknown as ComponentLibrary);

      return newCategory;
    });
  }

  async updateCategory(libraryId: string, categoryId: string, updates: Partial<ComponentCategory>): Promise<void> {
    return this.withLock(async () => {
      if (isPresetLibrary(libraryId)) {
        throw new Error('预设组件库不可修改');
      }
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
      await indexedDBService.saveLibrary(updated as unknown as ComponentLibrary);
    });
  }

  async deleteCategory(libraryId: string, categoryId: string): Promise<void> {
    return this.withLock(async () => {
      if (isPresetLibrary(libraryId)) {
        throw new Error('预设组件库不可修改');
      }
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
      await indexedDBService.saveLibrary(updated as unknown as ComponentLibrary);
    });
  }

  async moveCategoryInList(libraryId: string, categoryId: string, targetId: string, position: 'before' | 'after'): Promise<void> {
    return this.withLock(async () => {
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
      if (!isPresetLibrary(libraryId)) {
        await indexedDBService.saveLibrary(updated as unknown as ComponentLibrary);
      }
    });
  }

  async moveCategoryToEnd(libraryId: string, categoryId: string, position: 'before' | 'after'): Promise<void> {
    return this.withLock(async () => {
      const library = this.libraries.get(libraryId);
      if (!library) throw new Error(`Library ${libraryId} not found`);

      const categories = [...library.categories];
      const sourceIndex = categories.findIndex(c => c.id === categoryId);
      if (sourceIndex === -1) return;

      const [moved] = categories.splice(sourceIndex, 1);
      if (position === 'before') {
        categories.unshift(moved);
      } else {
        categories.push(moved);
      }

      const updated: ComponentLibrary = {
        ...library,
        categories,
        metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
      };

      this.libraries.set(libraryId, updated);
      if (!isPresetLibrary(libraryId)) {
        await indexedDBService.saveLibrary(updated as unknown as ComponentLibrary);
      }
    });
  }

  async moveCategoryToLibrary(sourceLibraryId: string, categoryId: string, targetLibraryId: string, targetCategoryId: string | null, position: 'before' | 'after' | 'inside'): Promise<void> {
    return this.withLock(async () => {
      if (isPresetLibrary(sourceLibraryId) || isPresetLibrary(targetLibraryId)) {
        throw new Error('预设组件库不可修改');
      }

      if (sourceLibraryId === targetLibraryId) {
        if (targetCategoryId) {
          return this.moveCategoryInList(sourceLibraryId, categoryId, targetCategoryId, position as 'before' | 'after');
        } else {
          return this.moveCategoryToEnd(sourceLibraryId, categoryId, position as 'before' | 'after');
        }
      }

      const sourceLibrary = this.libraries.get(sourceLibraryId);
      const targetLibrary = this.libraries.get(targetLibraryId);
      if (!sourceLibrary || !targetLibrary) return;

      const catIndex = sourceLibrary.categories.findIndex(c => c.id === categoryId);
      if (catIndex === -1) return;

      const sourceCategories = [...sourceLibrary.categories];
      const [movedCategory] = sourceCategories.splice(catIndex, 1);

      if (targetLibrary.categories.some(c => c.id === movedCategory.id)) {
        const existingIds = new Set(targetLibrary.categories.map(c => c.id));
        movedCategory.id = generatePrefixedId('category', existingIds);
      }

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
        if (position === 'before') {
          targetCategories.unshift(movedCategory);
        } else {
          targetCategories.push(movedCategory);
        }
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

      const sourceForSave = cloneLibraryForSave(updatedSource);
      await indexedDBService.saveLibrary(sourceForSave as unknown as ComponentLibrary);
      const targetForSave = cloneLibraryForSave(updatedTarget);
      await indexedDBService.saveLibrary(targetForSave as unknown as ComponentLibrary);
    });
  }

  async moveComponentInCategory(libraryId: string, componentInternalId: string, targetCategoryId: string | null, targetComponentInternalId: string, position: 'before' | 'after'): Promise<void> {
    return this.withLock(async () => {
      if (isPresetLibrary(libraryId)) {
        throw new Error('预设组件库不可修改');
      }
      const library = this.libraries.get(libraryId);
      if (!library) return;

      const components = [...library.components];
      const componentIndex = components.findIndex(c => c.internalId === componentInternalId);
      if (componentIndex === -1) return;

      const [movedComponent] = components.splice(componentIndex, 1);
      const updatedMovedComponent = { ...movedComponent, categoryId: targetCategoryId || undefined };

      if (targetComponentInternalId) {
        const targetIndex = components.findIndex(c => c.internalId === targetComponentInternalId);
        if (targetIndex === -1) {
          components.push(updatedMovedComponent);
        } else {
          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
          components.splice(insertIndex, 0, updatedMovedComponent);
        }
      } else {
        components.push(updatedMovedComponent);
      }

      const updated: ComponentLibrary = {
        ...library,
        components,
        metadata: { ...library.metadata, updatedAt: new Date().toISOString() },
      };

      this.libraries.set(libraryId, updated);
      const libForSave = cloneLibraryForSave(updated);
      await indexedDBService.saveLibrary(libForSave as unknown as ComponentLibrary);
    });
  }

  async moveComponentToCategory(
    sourceLibraryId: string,
    componentInternalId: string,
    targetLibraryId: string,
    targetCategoryId: string | null,
    targetComponentInternalId: string | null,
    position: 'before' | 'after'
  ): Promise<void> {
    return this.withLock(async () => {
      if (isPresetLibrary(sourceLibraryId) || isPresetLibrary(targetLibraryId)) {
        throw new Error('预设组件库不可修改');
      }

      const sourceLibrary = this.libraries.get(sourceLibraryId);
      const targetLibrary = this.libraries.get(targetLibraryId);
      if (!sourceLibrary || !targetLibrary) return;

      const compIndex = sourceLibrary.components.findIndex(c => c.internalId === componentInternalId);
      if (compIndex === -1) return;

      const sourceComponents = [...sourceLibrary.components];
      const [movedComponent] = sourceComponents.splice(compIndex, 1);
      const updatedMovedComponent = { ...movedComponent, categoryId: targetCategoryId || undefined };

      let targetComponents: Component[];
      if (targetComponentInternalId) {
        const insertIndex = targetLibrary.components.findIndex(c => c.internalId === targetComponentInternalId);
        if (insertIndex >= 0) {
          const finalIndex = position === 'before' ? insertIndex : insertIndex + 1;
          targetComponents = [
            ...targetLibrary.components.slice(0, finalIndex),
            updatedMovedComponent,
            ...targetLibrary.components.slice(finalIndex)
          ];
        } else {
          targetComponents = [...targetLibrary.components, updatedMovedComponent];
        }
      } else {
        targetComponents = [...targetLibrary.components, updatedMovedComponent];
      }

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

      const sourceForSave = cloneLibraryForSave(updatedSource);
      await indexedDBService.saveLibrary(sourceForSave as unknown as ComponentLibrary);
      const targetForSave = cloneLibraryForSave(updatedTarget);
      await indexedDBService.saveLibrary(targetForSave as unknown as ComponentLibrary);

      if (sourceLibraryId !== targetLibraryId) {
        const sourceThumbCache = this.thumbnailCache.get(sourceLibraryId);
        const targetThumbCache = this.thumbnailCache.get(targetLibraryId) || new Map();
        if (sourceThumbCache?.has(componentInternalId)) {
          targetThumbCache.set(componentInternalId, sourceThumbCache.get(componentInternalId)!);
          sourceThumbCache.delete(componentInternalId);
        }
        const sourceFailedCache = this.failedComponents.get(sourceLibraryId);
        const targetFailedCache = this.failedComponents.get(targetLibraryId) || new Map();
        if (sourceFailedCache?.has(componentInternalId)) {
          targetFailedCache.set(componentInternalId, sourceFailedCache.get(componentInternalId)!);
          sourceFailedCache.delete(componentInternalId);
        }
        this.thumbnailCache.set(targetLibraryId, targetThumbCache);
        this.failedComponents.set(targetLibraryId, targetFailedCache);
      }
    });
  }

  getComponentThumbnail(libraryId: string, componentInternalId: string): string | null {
    return this.thumbnailCache.get(libraryId)?.get(componentInternalId) || null;
  }

  setComponentThumbnail(libraryId: string, componentInternalId: string, thumbnail: string): void {
    if (!this.thumbnailCache.has(libraryId)) {
      this.thumbnailCache.set(libraryId, new Map());
    }
    this.thumbnailCache.get(libraryId)!.set(componentInternalId, thumbnail);
  }

  getFailedComponent(libraryId: string, componentInternalId: string): string | null {
    return this.failedComponents.get(libraryId)?.get(componentInternalId) || null;
  }

  setFailedComponent(libraryId: string, componentInternalId: string, message: string): void {
    if (!this.failedComponents.has(libraryId)) {
      this.failedComponents.set(libraryId, new Map());
    }
    this.failedComponents.get(libraryId)!.set(componentInternalId, message);
  }

  clearFailedComponent(libraryId: string, componentInternalId: string): void {
    this.failedComponents.get(libraryId)?.delete(componentInternalId);
  }

  exportLibrary(libraryId: string): void {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const libraryForExport = cloneLibraryForSave(library);
    const content = serializeSWC(libraryForExport as unknown as ComponentLibrary);
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
    return this.withLock(async () => {
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
        const existingIds = new Set(this.libraries.keys());
        library.metadata.id = generatePrefixedId('imported', existingIds);
      }

      if (this.libraries.has(library.metadata.id)) {
        const existingIds = new Set(this.libraries.keys());
        const newId = generatePrefixedId(library.metadata.id, existingIds);
        library.metadata.id = newId;
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

      const allExistingInternalIds = new Set<string>();
      for (const [, lib] of this.libraries) {
        lib.components.forEach(c => { if (c.internalId) allExistingInternalIds.add(c.internalId); });
      }

      library = ensureLibraryInternalIds(library);
      library.components = library.components.map(c => {
        if (c.internalId && allExistingInternalIds.has(c.internalId)) {
          return { ...c, internalId: generateInternalId(allExistingInternalIds) };
        }
        return c;
      });

      this.libraries.set(library.metadata.id, library);
      if (!this.libraryOrder.includes(library.metadata.id)) {
        this.libraryOrder.push(library.metadata.id);
      }
      if (!isPresetLibrary(library.metadata.id)) {
        const libForSave = cloneLibraryForSave(library);
        await indexedDBService.saveLibrary(libForSave as unknown as ComponentLibrary);
      }

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
        this.setComponentThumbnail(library.metadata.id, component.internalId, thumbnail);

        const failed = isThumbnailFailed(thumbnail);
        if (failed) {
          this.setFailedComponent(library.metadata.id, component.internalId, 'SolarWire 代码解析失败');
          errors.push({
            componentId: component.internalId,
            componentName: component.name,
            message: 'SolarWire 代码解析失败',
          });
        } else {
          this.clearFailedComponent(library.metadata.id, component.internalId);
        }

        onProgress?.({
          phase: 'generating-thumbnails',
          progress: i + 1,
          total: library.components.length,
          currentComponentId: component.internalId,
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
    });
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
      this.setComponentThumbnail(libraryId, component.internalId, thumbnail);

      const failed = isThumbnailFailed(thumbnail);
      if (failed) {
        this.setFailedComponent(libraryId, component.internalId, 'SolarWire 代码解析失败');
        errors.push({
          componentId: component.internalId,
          componentName: component.name,
          message: 'SolarWire 代码解析失败',
        });
      } else {
        this.clearFailedComponent(libraryId, component.internalId);
      }

      onProgress?.({
        phase: 'generating-thumbnails',
        progress: i + 1,
        total,
        currentComponentId: component.internalId,
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
      if (isPresetLibrary(library.metadata.id)) {
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
