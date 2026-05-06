import { app, BrowserWindow, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { setupIPC } from './ipc';

app.setName('SolarWire Editor');

let mainWindow: BrowserWindow | null = null;

const SUPPORTED_FILE_EXTENSIONS = new Set(['md', 'markdown', 'solarwire', 'sw']);

function isSupportedFilePath(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return SUPPORTED_FILE_EXTENSIONS.has(ext);
}

function extractPathFromArgv(argv: string[]): { filePath: string | null; dirPath: string | null } {
  for (const arg of argv) {
    if (arg.startsWith('-') || arg.startsWith('--') || arg.startsWith('/')) continue;
    if (!path.isAbsolute(arg)) continue;

    try {
      const stat = fs.statSync(arg);
      if (stat.isFile() && isSupportedFilePath(arg)) {
        return { filePath: arg, dirPath: null };
      }
      if (stat.isDirectory()) {
        return { filePath: null, dirPath: arg };
      }
    } catch {
      // ignore invalid paths
    }
  }
  return { filePath: null, dirPath: null };
}

async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, 500);

    const request = net.request({
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

async function findVitePort(): Promise<number> {
  const portsToTry = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];

  for (const port of portsToTry) {
    const isOpen = await checkPort(port);
    if (isOpen) {
      return port;
    }
  }

  return 3000;
}

function sendOpenPathToRenderer(filePath: string | null, dirPath: string | null): void {
  if (!mainWindow || (!filePath && !dirPath)) return;

  mainWindow.webContents.send('open-path', { filePath, dirPath });

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
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

  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

  if (isDev) {
    findVitePort().then((port) => {
      console.log(`Loading Vite server at http://localhost:${port}`);
      mainWindow?.loadURL(`http://localhost:${port}`);
    }).catch(() => {
      mainWindow?.loadURL('http://localhost:3000');
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../app/index.html'));
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    if (mainWindow) {
      const { filePath, dirPath } = extractPathFromArgv(argv);
      sendOpenPathToRenderer(filePath, dirPath);
    }
  });

  app.whenReady().then(() => {
    setupIPC();
    createWindow();

    const { filePath, dirPath } = extractPathFromArgv(process.argv);
    if (filePath || dirPath) {
      mainWindow?.webContents.on('did-finish-load', () => {
        sendOpenPathToRenderer(filePath, dirPath);
      });
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
