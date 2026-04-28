"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTestHandlers = registerTestHandlers;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const file_manager_1 = require("../file-manager");
/**
 * 注册测试相关的 IPC 处理程序
 */
function registerTestHandlers() {
    /**
     * 在测试模式下设置测试目录
     * 用于绕过 Electron 对话框，直接设置项目根目录
     */
    electron_1.ipcMain.handle('test:set-directory', async (_, testPath) => {
        try {
            // 确保路径是绝对路径
            const absolutePath = path_1.default.isAbsolute(testPath) ? testPath : path_1.default.resolve(testPath);
            // 设置项目根目录
            (0, file_manager_1.setAllowedRoot)(absolutePath);
            return {
                success: true,
                path: absolutePath
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to set test directory'
            };
        }
    });
}
