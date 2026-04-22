import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  openFileDialog: (options?: Electron.OpenDialogOptions) => ipcRenderer.invoke('dialog:openFile', options),
  listDirectory: (dirPath: string) => ipcRenderer.invoke('file:listDirectory', dirPath),
  getFileTree: (dirPath: string) => ipcRenderer.invoke('file:getFileTree', dirPath),
  collectSolarWireSnippets: (dirPath: string) => ipcRenderer.invoke('file:collectSolarWireSnippets', dirPath),
  copyFile: (srcPath: string, destPath: string) => ipcRenderer.invoke('file:copy', srcPath, destPath),
  ensureDir: (dirPath: string) => ipcRenderer.invoke('file:ensureDir', dirPath),
  readImageAsBase64: (imagePath: string) => ipcRenderer.invoke('file:readImageAsBase64', imagePath),
  
  // Git APIs
  git: {
    init: (repoPath: string) => ipcRenderer.invoke('git:init', repoPath),
    isInitialized: () => ipcRenderer.invoke('git:isInitialized'),
    getStatus: () => ipcRenderer.invoke('git:getStatus'),
    getLog: (filePath?: string) => ipcRenderer.invoke('git:getLog', filePath),
    getBranches: () => ipcRenderer.invoke('git:getBranches'),
    getCurrentBranch: () => ipcRenderer.invoke('git:getCurrentBranch'),
    stageFile: (filePath: string) => ipcRenderer.invoke('git:stageFile', filePath),
    stageAllModified: () => ipcRenderer.invoke('git:stageAllModified'),
    unstageFile: (filePath: string) => ipcRenderer.invoke('git:unstageFile', filePath),
    commit: (message: string, name?: string, email?: string) => ipcRenderer.invoke('git:commit', message, name, email),
    checkoutBranch: (branchName: string) => ipcRenderer.invoke('git:checkoutBranch', branchName),
    push: () => ipcRenderer.invoke('git:push'),
    pull: () => ipcRenderer.invoke('git:pull'),
    fetch: () => ipcRenderer.invoke('git:fetch'),
    checkoutCommit: (hash: string) => ipcRenderer.invoke('git:checkoutCommit', hash),
    getFileDiff: (filePath: string) => ipcRenderer.invoke('git:getFileDiff', filePath),
    getFileContentAtCommit: (filePath: string, commitHash: string) => ipcRenderer.invoke('git:getFileContentAtCommit', filePath, commitHash),
    getFileDiffBetweenCommits: (filePath: string, commitHash1: string, commitHash2: string) => ipcRenderer.invoke('git:getFileDiffBetweenCommits', filePath, commitHash1, commitHash2),
    getCommitDetails: (commitHash: string) => ipcRenderer.invoke('git:getCommitDetails', commitHash),
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

