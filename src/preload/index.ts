import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  readFileAsBuffer: (filePath: string) => ipcRenderer.invoke('file:readAsBuffer', filePath),
  writeFile: (filePath: string, content: string | ArrayBuffer | Uint8Array, allowOutsideProject?: boolean) => ipcRenderer.invoke('file:write', filePath, content, allowOutsideProject),
  openFileDialog: (options?: Electron.OpenDialogOptions) => ipcRenderer.invoke('dialog:openFile', options),
  saveFileDialog: (options?: Electron.SaveDialogOptions) => ipcRenderer.invoke('dialog:saveFile', options),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  listDirectory: (dirPath: string) => ipcRenderer.invoke('file:listDirectory', dirPath),
  getFileTree: (dirPath: string) => ipcRenderer.invoke('file:getFileTree', dirPath),
  collectSolarWireSnippets: (dirPath: string) => ipcRenderer.invoke('file:collectSolarWireSnippets', dirPath),
  copyFile: (srcPath: string, destPath: string) => ipcRenderer.invoke('file:copy', srcPath, destPath),
  copyDirectory: (srcDir: string, destDir: string) => ipcRenderer.invoke('file:copyDirectory', srcDir, destDir),
  getAppRoot: () => ipcRenderer.invoke('file:getAppRoot'),
  ensureDir: (dirPath: string) => ipcRenderer.invoke('file:ensureDir', dirPath),
  readImageAsBase64: (imagePath: string) => ipcRenderer.invoke('file:readImageAsBase64', imagePath),
  setAllowedRoot: (dirPath: string) => ipcRenderer.invoke('file:setAllowedRoot', dirPath),
  rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('file:rename', oldPath, newPath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('file:deleteFile', filePath),
  deleteDirectory: (dirPath: string) => ipcRenderer.invoke('file:deleteDirectory', dirPath),
  mkdir: (dirPath: string) => ipcRenderer.invoke('file:mkdir', dirPath),
  exists: (filePath: string) => ipcRenderer.invoke('file:exists', filePath),
  parseTableFile: (filePath: string) => ipcRenderer.invoke('file:parseTableFile', filePath),
  saveTableFile: (filePath: string, sheets: any[]) => ipcRenderer.invoke('file:saveTableFile', filePath, sheets),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('file:showItemInFolder', filePath),
  onOpenPath: (callback: (data: { filePath: string | null; dirPath: string | null }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { filePath: string | null; dirPath: string | null }) => callback(data);
    ipcRenderer.on('open-path', handler);
    return () => ipcRenderer.removeListener('open-path', handler);
  },
  onTableParseProgress: (callback: (data: { progress: number; detail?: string; totalRows?: number; processedRows?: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { progress: number; detail?: string; totalRows?: number; processedRows?: number }) => callback(data);
    ipcRenderer.on('table-parse-progress', handler);
    return () => ipcRenderer.removeListener('table-parse-progress', handler);
  },
  onTableBatchData: (callback: (data: {
    chunkIndex: number;
    totalChunks: number;
    batchIndex: number;
    totalBatches: number;
    sheetName: string;
    celldata: any[];
    rowCount: number;
    colCount: number;
    isFirstBatch: boolean;
    isLastBatch: boolean;
    config?: any;
  }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('table-batch-data', handler);
    return () => ipcRenderer.removeListener('table-batch-data', handler);
  },
});

// 在测试环境中暴露额外 API
if (process.env.NODE_ENV === 'test') {
  contextBridge.exposeInMainWorld('testAPI', {
    setTestDirectory: async (path: string) => {
      return ipcRenderer.invoke('test:set-directory', path);
    }
  });
}

