import type { ElectronAPI, OpenDialogOptions, SaveDialogOptions } from '../../types/electron-api';
import type { FileNode, SolarWireSnippet } from '../../shared/types/file';
import { apiClient } from '../../shared/utils/api-client';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

function showFileOpenDialog(options?: OpenDialogOptions): Promise<string[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = options?.properties?.includes('multiSelections') ?? false;

    if (options?.properties?.includes('openDirectory')) {
      input.setAttribute('webkitdirectory', '');
    }

    if (options?.filters && options.filters.length > 0) {
      const acceptExtensions = options.filters
        .flatMap(f => f.extensions)
        .map(ext => ext.startsWith('.') ? ext : `.${ext}`)
        .join(',');
      if (acceptExtensions) {
        input.accept = acceptExtensions;
      }
    }

    input.addEventListener('change', () => {
      if (input.files && input.files.length > 0) {
        const paths = Array.from(input.files).map(f => (f as any).path || f.name);
        resolve(paths);
      } else {
        resolve([]);
      }
    });

    input.click();
  });
}

export function createWebElectronAPI(): ElectronAPI {
  const api: ElectronAPI = {
    async readFile(filePath: string): Promise<string> {
      const result = await apiClient.readFile(filePath);
      return result.content;
    },

    async readFileAsBuffer(filePath: string): Promise<ArrayBuffer> {
      const raw = await fetch(`/api/files/read-raw?path=${encodeURIComponent(filePath)}`);
      const json = await raw.json();
      return base64ToArrayBuffer(json.content);
    },

    async writeFile(filePath: string, content: string | ArrayBuffer | Uint8Array): Promise<void> {
      const strContent = typeof content === 'string'
        ? content
        : new TextDecoder().decode(content);
      await apiClient.writeFile(filePath, strContent);
    },

    async openFileDialog(options?: OpenDialogOptions): Promise<string[]> {
      return showFileOpenDialog(options);
    },

    async saveFileDialog(_options?: SaveDialogOptions): Promise<string | null> {
      return null;
    },

    async listDirectory(dirPath: string): Promise<FileNode[]> {
      return apiClient.getFileTree(dirPath);
    },

    async getFileTree(dirPath: string): Promise<FileNode[]> {
      return apiClient.getFileTree(dirPath);
    },

    async collectSolarWireSnippets(dirPath: string): Promise<SolarWireSnippet[]> {
      return apiClient.getSnippets(dirPath);
    },

    async copyFile(srcPath: string, destPath: string): Promise<void> {
      const content = await apiClient.readFile(srcPath);
      await apiClient.writeFile(destPath, content.content);
    },

    async ensureDir(dirPath: string): Promise<void> {
      await apiClient.mkdir(dirPath);
    },

    async readImageAsBase64(imagePath: string): Promise<string> {
      const raw = await fetch(`/api/files/read-raw?path=${encodeURIComponent(imagePath)}`);
      const json = await raw.json();
      return json.content;
    },

    async setAllowedRoot(_dirPath: string): Promise<void> {
    },

    async rename(oldPath: string, newPath: string): Promise<void> {
      await apiClient.rename(oldPath, newPath);
    },

    async deleteFile(filePath: string): Promise<void> {
      await apiClient.delete(filePath);
    },

    async deleteDirectory(dirPath: string): Promise<void> {
      await apiClient.delete(dirPath);
    },

    async mkdir(dirPath: string): Promise<void> {
      await apiClient.mkdir(dirPath);
    },

    async exists(filePath: string): Promise<boolean> {
      const result = await apiClient.exists(filePath);
      return result.exists;
    },

    async showItemInFolder(_filePath: string): Promise<void> {
      console.warn('showItemInFolder is not available in browser');
    },

    onOpenPath(_callback: (data: { filePath: string | null; dirPath: string | null }) => void): () => void {
      return () => {};
    },

    async getDefaultDirectory(): Promise<string> {
      const info = await apiClient.getWorkspaceInfo();
      return info.root;
    },
  };

  return api;
}