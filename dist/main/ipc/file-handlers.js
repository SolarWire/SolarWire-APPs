"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFileHandlers = registerFileHandlers;
const electron_1 = require("electron");
const file_manager_1 = require("../file-manager");
function registerFileHandlers() {
    electron_1.ipcMain.handle('file:read', async (_event, filePath) => {
        return await (0, file_manager_1.readFile)(filePath);
    });
    electron_1.ipcMain.handle('file:write', async (_event, filePath, content, allowOutsideProject) => {
        await (0, file_manager_1.writeFile)(filePath, content, allowOutsideProject);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:listDirectory', async (_event, dirPath) => {
        return await (0, file_manager_1.listFiles)(dirPath);
    });
    electron_1.ipcMain.handle('file:getFileTree', async (_event, dirPath, depth = 3) => {
        return await (0, file_manager_1.getFileTree)(dirPath, depth);
    });
    electron_1.ipcMain.handle('file:collectSolarWireSnippets', async (_event, dirPath) => {
        return await (0, file_manager_1.collectSolarWireSnippets)(dirPath);
    });
    electron_1.ipcMain.handle('file:copy', async (_event, srcPath, destPath) => {
        await (0, file_manager_1.copyFile)(srcPath, destPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:ensureDir', async (_event, dirPath) => {
        await (0, file_manager_1.ensureDir)(dirPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:readImageAsBase64', async (_event, imagePath) => {
        return await (0, file_manager_1.readImageAsBase64)(imagePath);
    });
    electron_1.ipcMain.handle('file:setAllowedRoot', async (_event, dirPath) => {
        (0, file_manager_1.setAllowedRoot)(dirPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:rename', async (_event, oldPath, newPath) => {
        await (0, file_manager_1.rename)(oldPath, newPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:deleteFile', async (_event, filePath) => {
        await (0, file_manager_1.deleteFile)(filePath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:deleteDirectory', async (_event, dirPath) => {
        await (0, file_manager_1.deleteDirectory)(dirPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:mkdir', async (_event, dirPath) => {
        await (0, file_manager_1.mkdir)(dirPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:exists', async (_event, filePath) => {
        return await (0, file_manager_1.exists)(filePath);
    });
}
