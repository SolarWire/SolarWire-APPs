import { app, BrowserWindow, net } from 'electron';
import * as path from 'path';
import { setupIPC } from './ipc';

// 设置应用名称
app.setName('SolarWire Editor');

let mainWindow: BrowserWindow | null = null;

/**
 * 尝试连接到指定端口，检查是否有 Vite 开发服务器在运行
 */
async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;
    
    // 设置超时定时器
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

/**
 * 找到正在运行的 Vite 开发服务器端口
 * 从 3000 开始尝试，最多尝试到 3010
 */
async function findVitePort(): Promise<number> {
  const portsToTry = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
  
  for (const port of portsToTry) {
    const isOpen = await checkPort(port);
    if (isOpen) {
      return port;
    }
  }
  
  return 3000; // 默认返回 3000
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
