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

/**
 * 标准化 categoryId 的值
 * - 空字符串、undefined、null 都转换为 null
 * - 非空字符串保持不变
 */
export function normalizeCategoryId(categoryId: string | null | undefined): string | null {
  if (!categoryId || categoryId === '') {
    return null;
  }
  return categoryId;
}

/**
 * 判断组件是否未分类
 * 统一标准：categoryId 为 null 表示未分类
 */
export function isUncategorizedComponent(categoryId: string | null | undefined): boolean {
  return normalizeCategoryId(categoryId) === null;
}

/**
 * 判断组件是否未分类
 * @param categoryId 组件的分类ID
 * @param libraryCategories 库中的分类列表
 * @returns true表示未分类，false表示已分类
 * 
 * 判断逻辑：
 * 1. categoryId为null或空字符串表示未分类
 * 2. categoryId不在库的分类列表中，表示未分类
 * 
 * 注意：移除了isValidCategoryIdFormat检查，因为预设分类ID（如web-modules）不需要符合category-前缀格式
 */
export function isComponentUncategorized(categoryId: string | null | undefined, libraryCategories: Array<{ id: string }>): boolean {
  // 1. categoryId为null或空字符串表示未分类
  const normalizedId = normalizeCategoryId(categoryId);
  if (normalizedId === null) {
    return true;
  }

  // 2. categoryId不在库的分类列表中，表示未分类
  const categoryIds = new Set(libraryCategories.map(cat => cat.id));
  if (!categoryIds.has(normalizedId)) {
    return true;
  }

  return false;
}

/**
 *  categoryId
 * @param categoryId 
 * @returns 
 */
function isValidCategoryIdFormat(categoryId: string): boolean {
  // category-
  return /^category-[a-z0-9-]+$/.test(categoryId);
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
