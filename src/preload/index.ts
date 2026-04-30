import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string | ArrayBuffer | Uint8Array, allowOutsideProject?: boolean) => ipcRenderer.invoke('file:write', filePath, content, allowOutsideProject),
  openFileDialog: (options?: Electron.OpenDialogOptions) => ipcRenderer.invoke('dialog:openFile', options),
  saveFileDialog: (options?: Electron.SaveDialogOptions) => ipcRenderer.invoke('dialog:saveFile', options),
  listDirectory: (dirPath: string) => ipcRenderer.invoke('file:listDirectory', dirPath),
  getFileTree: (dirPath: string) => ipcRenderer.invoke('file:getFileTree', dirPath),
  collectSolarWireSnippets: (dirPath: string) => ipcRenderer.invoke('file:collectSolarWireSnippets', dirPath),
  copyFile: (srcPath: string, destPath: string) => ipcRenderer.invoke('file:copy', srcPath, destPath),
  ensureDir: (dirPath: string) => ipcRenderer.invoke('file:ensureDir', dirPath),
  readImageAsBase64: (imagePath: string) => ipcRenderer.invoke('file:readImageAsBase64', imagePath),
  setAllowedRoot: (dirPath: string) => ipcRenderer.invoke('file:setAllowedRoot', dirPath),
  rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('file:rename', oldPath, newPath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('file:deleteFile', filePath),
  deleteDirectory: (dirPath: string) => ipcRenderer.invoke('file:deleteDirectory', dirPath),
  mkdir: (dirPath: string) => ipcRenderer.invoke('file:mkdir', dirPath),
  exists: (filePath: string) => ipcRenderer.invoke('file:exists', filePath),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('file:showItemInFolder', filePath),
});

// 在测试环境中暴露额外 API
if (process.env.NODE_ENV === 'test') {
  contextBridge.exposeInMainWorld('testAPI', {
    setTestDirectory: async (path: string) => {
      return ipcRenderer.invoke('test:set-directory', path);
    }
  });
}

