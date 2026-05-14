"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('api', {
    readFile: (filePath) => electron_1.ipcRenderer.invoke('file:read', filePath),
    readFileAsBuffer: (filePath) => electron_1.ipcRenderer.invoke('file:readAsBuffer', filePath),
    writeFile: (filePath, content, allowOutsideProject) => electron_1.ipcRenderer.invoke('file:write', filePath, content, allowOutsideProject),
    openFileDialog: (options) => electron_1.ipcRenderer.invoke('dialog:openFile', options),
    saveFileDialog: (options) => electron_1.ipcRenderer.invoke('dialog:saveFile', options),
    openDirectory: () => electron_1.ipcRenderer.invoke('dialog:openDirectory'),
    listDirectory: (dirPath) => electron_1.ipcRenderer.invoke('file:listDirectory', dirPath),
    getFileTree: (dirPath) => electron_1.ipcRenderer.invoke('file:getFileTree', dirPath),
    collectSolarWireSnippets: (dirPath) => electron_1.ipcRenderer.invoke('file:collectSolarWireSnippets', dirPath),
    copyFile: (srcPath, destPath) => electron_1.ipcRenderer.invoke('file:copy', srcPath, destPath),
    copyDirectory: (srcDir, destDir) => electron_1.ipcRenderer.invoke('file:copyDirectory', srcDir, destDir),
    getAppRoot: () => electron_1.ipcRenderer.invoke('file:getAppRoot'),
    ensureDir: (dirPath) => electron_1.ipcRenderer.invoke('file:ensureDir', dirPath),
    readImageAsBase64: (imagePath) => electron_1.ipcRenderer.invoke('file:readImageAsBase64', imagePath),
    setAllowedRoot: (dirPath) => electron_1.ipcRenderer.invoke('file:setAllowedRoot', dirPath),
    rename: (oldPath, newPath) => electron_1.ipcRenderer.invoke('file:rename', oldPath, newPath),
    deleteFile: (filePath) => electron_1.ipcRenderer.invoke('file:deleteFile', filePath),
    deleteDirectory: (dirPath) => electron_1.ipcRenderer.invoke('file:deleteDirectory', dirPath),
    mkdir: (dirPath) => electron_1.ipcRenderer.invoke('file:mkdir', dirPath),
    exists: (filePath) => electron_1.ipcRenderer.invoke('file:exists', filePath),
    parseTableFile: (filePath) => electron_1.ipcRenderer.invoke('file:parseTableFile', filePath),
    saveTableFile: (filePath, sheets) => electron_1.ipcRenderer.invoke('file:saveTableFile', filePath, sheets),
    showItemInFolder: (filePath) => electron_1.ipcRenderer.invoke('file:showItemInFolder', filePath),
    onOpenPath: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('open-path', handler);
        return () => electron_1.ipcRenderer.removeListener('open-path', handler);
    },
    onTableParseProgress: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('table-parse-progress', handler);
        return () => electron_1.ipcRenderer.removeListener('table-parse-progress', handler);
    },
    onTableBatchData: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('table-batch-data', handler);
        return () => electron_1.ipcRenderer.removeListener('table-batch-data', handler);
    },
});
// 在测试环境中暴露额外 API
if (process.env.NODE_ENV === 'test') {
    electron_1.contextBridge.exposeInMainWorld('testAPI', {
        setTestDirectory: async (path) => {
            return electron_1.ipcRenderer.invoke('test:set-directory', path);
        }
    });
}
