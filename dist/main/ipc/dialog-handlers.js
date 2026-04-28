"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDialogHandlers = registerDialogHandlers;
const electron_1 = require("electron");
function registerDialogHandlers() {
    electron_1.ipcMain.handle('dialog:openFile', async (_event, options) => {
        const res = await electron_1.dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory', 'multiSelections'],
            ...options,
        });
        return res.filePaths;
    });
    electron_1.ipcMain.handle('dialog:saveFile', async (_event, options) => {
        const res = await electron_1.dialog.showSaveDialog(options || {
            filters: [{ name: 'All Files', extensions: ['*'] }],
        });
        return res;
    });
}
