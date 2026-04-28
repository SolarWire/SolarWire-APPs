"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('api', {
    readFile: (filePath) => electron_1.ipcRenderer.invoke('file:read', filePath),
    writeFile: (filePath, content, allowOutsideProject) => electron_1.ipcRenderer.invoke('file:write', filePath, content, allowOutsideProject),
    openFileDialog: (options) => electron_1.ipcRenderer.invoke('dialog:openFile', options),
    saveFileDialog: (options) => electron_1.ipcRenderer.invoke('dialog:saveFile', options),
    listDirectory: (dirPath) => electron_1.ipcRenderer.invoke('file:listDirectory', dirPath),
    getFileTree: (dirPath) => electron_1.ipcRenderer.invoke('file:getFileTree', dirPath),
    collectSolarWireSnippets: (dirPath) => electron_1.ipcRenderer.invoke('file:collectSolarWireSnippets', dirPath),
    copyFile: (srcPath, destPath) => electron_1.ipcRenderer.invoke('file:copy', srcPath, destPath),
    ensureDir: (dirPath) => electron_1.ipcRenderer.invoke('file:ensureDir', dirPath),
    readImageAsBase64: (imagePath) => electron_1.ipcRenderer.invoke('file:readImageAsBase64', imagePath),
    setAllowedRoot: (dirPath) => electron_1.ipcRenderer.invoke('file:setAllowedRoot', dirPath),
});
// 在测试环境中暴露额外 API
if (process.env.NODE_ENV === 'test') {
    electron_1.contextBridge.exposeInMainWorld('testAPI', {
        setTestDirectory: async (path) => {
            return electron_1.ipcRenderer.invoke('test:set-directory', path);
        }
    });
}
