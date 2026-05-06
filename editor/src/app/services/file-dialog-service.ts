/**
 * 文件对话框选项
 */
export interface OpenFileDialogOptions {
  properties?: ('openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent')[];
  filters?: Array<{ name: string; extensions: string[] }>;
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
}

/**
 * 文件对话框服务接口
 * 用于解耦组件与 Electron API 的直接依赖
 */
export interface IFileDialogService {
  openFileDialog(options: OpenFileDialogOptions): Promise<string[] | null>;
  saveFileDialog?(options: SaveFileDialogOptions): Promise<string | null>;
}

/**
 * 保存文件对话框选项
 */
export interface SaveFileDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  buttonLabel?: string;
}

/**
 * Electron 文件对话框服务实现
 */
export class ElectronFileDialogService implements IFileDialogService {
  async openFileDialog(options: OpenFileDialogOptions): Promise<string[] | null> {
    const api = (window as any).api;
    if (!api?.openFileDialog) {
      console.warn('File dialog API not available');
      return null;
    }

    try {
      const paths = await api.openFileDialog(options);
      return paths;
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      return null;
    }
  }

  async saveFileDialog(options: SaveFileDialogOptions): Promise<string | null> {
    const api = (window as any).api;
    if (!api?.saveFileDialog) {
      console.warn('Save file dialog API not available');
      return null;
    }

    try {
      const path = await api.saveFileDialog(options);
      return path;
    } catch (error) {
      console.error('Failed to open save file dialog:', error);
      return null;
    }
  }
}

// 单例实例
export const fileDialogService = new ElectronFileDialogService();
