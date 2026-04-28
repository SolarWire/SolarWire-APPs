/**
 * Component library utility functions
 * Separated from type definitions to reduce coupling
 */

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
  const type = parts[0];
  if (type !== 'library' && type !== 'category' && type !== 'component') return null;
  const libraryId = parts[1];
  const id = parts.slice(2).join(':');
  return { type, libraryId, id };
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
