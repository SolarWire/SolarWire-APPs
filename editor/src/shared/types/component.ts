export const PRESET_ID_PREFIX = 'preset-';
export const UNCATEGORIZED_NODE_ID = '__uncategorized__';

export function isPresetLibrary(id: string): boolean {
  return id.startsWith(PRESET_ID_PREFIX);
}

export function makeUncategorizedKey(libraryId: string): string {
  return `${libraryId}:${UNCATEGORIZED_NODE_ID}`;
}

export function makeNodeId(type: 'library' | 'category' | 'component', id: string, libraryId: string): string {
  return `${type}:${libraryId}:${id}`;
}

export function parseNodeId(nodeId: string): { type: 'library' | 'category' | 'component'; libraryId: string; id: string } | null {
  const parts = nodeId.split(':');
  if (parts.length < 3) return null;
  const type = parts[0] as 'library' | 'category' | 'component';
  const libraryId = parts[1];
  const id = parts.slice(2).join(':');
  return { type, libraryId, id };
}

export interface ComponentLibraryMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentCategory {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Component {
  id: string;
  internalId: string;
  name: string;
  description?: string;
  categoryId?: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export function generateInternalId(existingIds?: Set<string>): string {
  let id: string;
  do {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Uint32Array(4);
    crypto.getRandomValues(randomBytes);
    const random = Array.from(randomBytes)
      .map(val => val.toString(36).padStart(8, '0'))
      .join('');
    id = `${timestamp}-${random}`;
  } while (existingIds?.has(id));
  return id;
}

export function generatePrefixedId(prefix: string, existingIds?: Set<string>): string {
  let id: string;
  do {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Uint32Array(2);
    crypto.getRandomValues(randomBytes);
    const random = Array.from(randomBytes)
      .map(val => val.toString(36).padStart(8, '0'))
      .join('');
    id = `${prefix}-${timestamp}-${random}`;
  } while (existingIds?.has(id));
  return id;
}

export interface ComponentLibrary {
  $schema: 'solarwire-component-library-v1';
  metadata: ComponentLibraryMetadata;
  categories: ComponentCategory[];
  components: Component[];
}

export interface ComponentLibraryItem {
  id: string;
  name: string;
  description?: string;
  componentCount: number;
  isPreset: boolean;
  source: 'preset' | 'indexeddb' | 'file';
}
