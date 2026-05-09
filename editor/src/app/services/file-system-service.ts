/**
 * 文件系统服务接口
 * 用于解耦组件与 Electron 文件系统 API 的直接依赖
 */
export interface IFileSystemService {
  readFile(filePath: string): Promise<string>;
  readFileAsBuffer(filePath: string): Promise<ArrayBuffer>;
  writeFile(filePath: string, content: string | Uint8Array): Promise<void>;
  parseTableFile(filePath: string): Promise<any[]>;
  saveTableFile(filePath: string, sheets: any[]): Promise<{ success: boolean; error?: string }>;
  getFileTree(dirPath: string): Promise<FileNode[]>;
  ensureDir(dirPath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  mkdir(filePath: string): Promise<void>;
}

/**
 * 文件节点接口
 */
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

/**
 * Electron 文件系统服务实现
 */
export class ElectronFileSystemService implements IFileSystemService {
  async readFile(filePath: string): Promise<string> {
    const api = (window as any).api;
    if (api && typeof api.readFile === 'function') {
      return await api.readFile(filePath);
    }
    throw new Error('File API not available');
  }

  async readFileAsBuffer(filePath: string): Promise<ArrayBuffer> {
    const api = (window as any).api;
    if (api && typeof api.readFileAsBuffer === 'function') {
      return await api.readFileAsBuffer(filePath);
    }
    throw new Error('File API not available');
  }

  async parseTableFile(filePath: string): Promise<any[]> {
    const api = (window as any).api;
    if (api && typeof api.parseTableFile === 'function') {
      return await api.parseTableFile(filePath);
    }
    throw new Error('File API not available');
  }

  async saveTableFile(filePath: string, sheets: any[]): Promise<{ success: boolean; error?: string }> {
    const api = (window as any).api;
    if (api && typeof api.saveTableFile === 'function') {
      return await api.saveTableFile(filePath, sheets);
    }
    throw new Error('File API not available');
  }

  async writeFile(filePath: string, content: string | Uint8Array): Promise<void> {
    const api = (window as any).api;
    if (api && typeof api.writeFile === 'function') {
      await api.writeFile(filePath, content);
    } else {
      throw new Error('File API not available');
    }
  }

  async getFileTree(dirPath: string): Promise<FileNode[]> {
    const api = (window as any).api;
    if (api && typeof api.getFileTree === 'function') {
      return await api.getFileTree(dirPath);
    }
    throw new Error('File API not available');
  }

  async ensureDir(dirPath: string): Promise<void> {
    const api = (window as any).api;
    if (api && typeof api.ensureDir === 'function') {
      await api.ensureDir(dirPath);
    } else {
      throw new Error('File API not available');
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const api = (window as any).api;
    if (api && typeof api.exists === 'function') {
      return await api.exists(filePath);
    }
    throw new Error('File API not available');
  }

  async mkdir(filePath: string): Promise<void> {
    const api = (window as any).api;
    if (api && typeof api.mkdir === 'function') {
      await api.mkdir(filePath);
    } else {
      throw new Error('File API not available');
    }
  }
}

// 单例实例
export const fileSystemService = new ElectronFileSystemService();
