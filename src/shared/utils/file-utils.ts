import { fileSystemService } from '../../app/services/file-system-service';

export async function readFile(filePath: string): Promise<string> {
  return fileSystemService.readFile(filePath);
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fileSystemService.writeFile(filePath, content);
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

