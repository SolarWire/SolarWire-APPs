import { apiClient } from '../../shared/utils/api-client';

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

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export class HttpFileSystemService implements IFileSystemService {
  async readFile(filePath: string): Promise<string> {
    const result = await apiClient.readFile(filePath);
    return result.content;
  }

  async readFileAsBuffer(filePath: string): Promise<ArrayBuffer> {
    const raw = await fetch(`/api/files/read-raw?path=${encodeURIComponent(filePath)}`);
    const json = await raw.json();
    const binaryStr = atob(json.content);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async writeFile(filePath: string, content: string | Uint8Array): Promise<void> {
    const strContent = typeof content === 'string' ? content : new TextDecoder().decode(content);
    await apiClient.writeFile(filePath, strContent);
  }

  async parseTableFile(_filePath: string): Promise<any[]> {
    return [];
  }

  async saveTableFile(_filePath: string, _sheets: any[]): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Table editing is not supported in web mode' };
  }

  async getFileTree(dirPath: string): Promise<FileNode[]> {
    return apiClient.getFileTree(dirPath);
  }

  async ensureDir(dirPath: string): Promise<void> {
    await apiClient.mkdir(dirPath);
  }

  async exists(filePath: string): Promise<boolean> {
    const result = await apiClient.exists(filePath);
    return result.exists;
  }

  async mkdir(filePath: string): Promise<void> {
    await apiClient.mkdir(filePath);
  }
}

export const fileSystemService = new HttpFileSystemService();