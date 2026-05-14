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
const fs = __importStar(require("fs"));
const ipc_1 = require("./ipc");
electron_1.app.setName('SolarWire Editor');
let mainWindow = null;
const SUPPORTED_FILE_EXTENSIONS = new Set(['md', 'markdown', 'solarwire', 'sw']);
function isSupportedFilePath(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    return SUPPORTED_FILE_EXTENSIONS.has(ext);
}
function extractPathFromArgv(argv) {
    for (const arg of argv) {
        if (arg.startsWith('-') || arg.startsWith('--') || arg.startsWith('/'))
            continue;
        if (!path.isAbsolute(arg))
            continue;
        try {
            const stat = fs.statSync(arg);
            if (stat.isFile() && isSupportedFilePath(arg)) {
                return { filePath: arg, dirPath: null };
            }
            if (stat.isDirectory()) {
                return { filePath: null, dirPath: arg };
            }
        }
        catch {
            // ignore invalid paths
        }
    }
    return { filePath: null, dirPath: null };
}
async function checkPort(port) {
    return new Promise((resolve) => {
        let resolved = false;
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
async function findVitePort() {
    const portsToTry = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
    for (const port of portsToTry) {
        const isOpen = await checkPort(port);
        if (isOpen) {
            return port;
        }
    }
    return 3000;
}
function sendOpenPathToRenderer(filePath, dirPath) {
    if (!mainWindow || (!filePath && !dirPath))
        return;
    mainWindow.webContents.send('open-path', { filePath, dirPath });
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    mainWindow.focus();
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        title: 'SolarWire Editor',
        icon: path.join(__dirname, '../../public/logo.png'),
        backgroundColor: '#1e1e1e',
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload/index.js'),
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false
        }
    });
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    const builtAppPath = path.join(__dirname, '../app/index.html');
    const isDev = process.env.NODE_ENV === 'development' || !fs.existsSync(builtAppPath);
    if (isDev) {
        findVitePort().then((port) => {
            console.log(`Loading Vite server at http://localhost:${port}`);
            mainWindow?.loadURL(`http://localhost:${port}`);
        }).catch(() => {
            mainWindow?.loadURL('http://localhost:3000');
        });
    }
    else {
        mainWindow.loadFile(builtAppPath);
    }
}
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', (_event, argv) => {
        if (mainWindow) {
            const { filePath, dirPath } = extractPathFromArgv(argv);
            sendOpenPathToRenderer(filePath, dirPath);
        }
    });
    electron_1.app.whenReady().then(() => {
        (0, ipc_1.setupIPC)();
        createWindow();
        const { filePath, dirPath } = extractPathFromArgv(process.argv);
        if (filePath || dirPath) {
            mainWindow?.webContents.on('did-finish-load', () => {
                sendOpenPathToRenderer(filePath, dirPath);
            });
        }
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });
}
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
