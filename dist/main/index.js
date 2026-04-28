"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const ipc_1 = require("./ipc");
// 设置应用名称
electron_1.app.setName('SolarWire Editor');
let mainWindow = null;
/**
 * 尝试连接到指定端口，检查是否有 Vite 开发服务器在运行
 */
async function checkPort(port) {
    return new Promise((resolve) => {
        let resolved = false;
        // 设置超时定时器
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
        }, 500);
        const request = electron_1.net.request({
            method: 'GET',
            protocol: 'http:',
            hostname: 'localhost',
            port: port,
            path: '/'
        });
        request.on('response', () => {
            if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                resolve(true);
            }
        });
        request.on('error', () => {
            if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                resolve(false);
            }
        });
        request.end();
    });
}
/**
 * 找到正在运行的 Vite 开发服务器端口
 * 从 3000 开始尝试，最多尝试到 3010
 */
async function findVitePort() {
    const portsToTry = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
    for (const port of portsToTry) {
        const isOpen = await checkPort(port);
        if (isOpen) {
            return port;
        }
    }
    return 3000; // 默认返回 3000
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        title: 'SolarWire Editor',
        icon: path.join(__dirname, '../../public/logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload/index.js'),
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false
        }
    });
    // 开发模式下使用 Vite 服务器
    // 生产模式下使用打包后的文件
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDev) {
        // 先找到 Vite 实际运行的端口
        findVitePort().then((port) => {
            console.log(`Loading Vite server at http://localhost:${port}`);
            mainWindow?.loadURL(`http://localhost:${port}`);
        }).catch(() => {
            // 如果找不到，默认尝试 3000
            mainWindow?.loadURL('http://localhost:3000');
        });
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../app/index.html'));
    }
}
electron_1.app.whenReady().then(() => {
    (0, ipc_1.setupIPC)();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
