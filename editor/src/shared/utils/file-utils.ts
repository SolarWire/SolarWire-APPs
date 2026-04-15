export async function readFile(filePath: string): Promise<string> {
  const api = (window as any).api;
  if (api && typeof api.readFile === 'function') {
    return await api.readFile(filePath);
  }

  // Fallback: try ipcRenderer if available (older setups)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ipcRenderer } = require('electron');
    return await ipcRenderer.invoke('file:read', filePath);
  } catch (err) {
    throw new Error('IPC not available in renderer');
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const api = (window as any).api;
  if (api && typeof api.writeFile === 'function') {
    await api.writeFile(filePath, content);
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ipcRenderer } = require('electron');
    await ipcRenderer.invoke('file:write', filePath, content);
    return;
  } catch (err) {
    throw new Error('IPC not available in renderer');
  }
}

// 选中状态管理
export interface SelectedItem {
  view: 'file' | 'requirement' | 'solarwire';
  path: string;
  snippetId?: string;
}

let selectedItem: SelectedItem | null = null;

/**
 * 设置选中项
 * @param view 视图类型
 * @param path 文件路径
 * @param snippetId 可选的snippet ID
 */
export function setSelectedItem(view: 'file' | 'requirement' | 'solarwire', path: string, snippetId?: string): void {
  selectedItem = {
    view,
    path,
    snippetId
  };
}

/**
 * 获取当前选中项
 * @returns 当前选中项或null
 */
export function getSelectedItem(): SelectedItem | null {
  return selectedItem;
}

/**
 * 清除选中项
 */
export function clearSelectedItem(): void {
  selectedItem = null;
}

/**
 * 获取指定视图的选中项
 * @param view 视图类型
 * @returns 该视图的选中项或null
 */
export function getSelectedItemForView(view: 'file' | 'requirement' | 'solarwire'): SelectedItem | null {
  return selectedItem && selectedItem.view === view ? selectedItem : null;
}

