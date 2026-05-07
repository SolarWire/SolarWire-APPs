import type { FileNode, SolarWireSnippet } from '../shared/types/file';

export interface OpenDialogOptions {
  properties?: ('openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent')[];
  filters?: Array<{ name: string; extensions: string[] }>;
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  buttonLabel?: string;
}

export interface ElectronAPI {
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string | ArrayBuffer | Uint8Array, allowOutsideProject?: boolean): Promise<void>;
  openFileDialog(options?: OpenDialogOptions): Promise<string[]>;
  saveFileDialog(options?: SaveDialogOptions): Promise<string | null>;
  listDirectory(dirPath: string): Promise<FileNode[]>;
  getFileTree(dirPath: string): Promise<FileNode[]>;
  collectSolarWireSnippets(dirPath: string): Promise<SolarWireSnippet[]>;
  copyFile(srcPath: string, destPath: string): Promise<void>;
  ensureDir(dirPath: string): Promise<void>;
  readImageAsBase64(imagePath: string): Promise<string>;
  setAllowedRoot(dirPath: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  deleteDirectory(dirPath: string): Promise<void>;
  mkdir(dirPath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  showItemInFolder(filePath: string): Promise<void>;
  onOpenPath(callback: (data: { filePath: string | null; dirPath: string | null }) => void): () => void;
  getDefaultDirectory?(): Promise<string>;
}

declare global {
  interface Window {
    api?: ElectronAPI;
  }
}
