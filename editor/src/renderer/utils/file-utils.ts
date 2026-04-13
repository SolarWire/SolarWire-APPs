import path from 'path';

/**
 * 支持的文件扩展名
 */
export const SUPPORTED_EXTENSIONS = ['.solarwire', '.md'];

/**
 * 验证文件扩展名是否支持
 */
export function isValidFileExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).slice(1).toLowerCase();
}

/**
 * 获取不含扩展名的文件名
 */
export function getFileNameWithoutExtension(filename: string): string {
  return path.basename(filename, path.extname(filename));
}

/**
 * 安全地拼接路径
 */
export function safeJoin(...parts: string[]): string {
  return path.join(...parts);
}

/**
 * 验证路径是否在安全范围内
 */
export function isPathSafe(testPath: string, basePath: string): boolean {
  const relative = path.relative(basePath, testPath);
  return !relative.startsWith('..');
}

/**
 * 检测是否为绝对路径
 */
export function isAbsolutePath(p: string): boolean {
  return path.isAbsolute(p);
}

/**
 * 规范化路径
 */
export function normalizePath(p: string): string {
  return path.normalize(p);
}

/**
 * 获取路径的目录部分
 */
export function getDirectory(p: string): string {
  return path.dirname(p);
}

export async function readFile(filePath: string): Promise<string> {
  const api = (window as any).api;
  if (api && typeof api.readFile === 'function') {
    return await api.readFile(filePath);
  }

  // Fallback: try ipcRenderer if available (older setups)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ipcRenderer } = require('electron');
    return await ipcRenderer.invoke('file:read', filePath);
  } catch (err) {
    // In test environment, return mock content
    if (process.env.NODE_ENV === 'test') {
      return 'test content';
    }
    throw new Error('IPC not available in renderer');
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const api = (window as any).api;
  if (api && typeof api.writeFile === 'function') {
    await api.writeFile(filePath, content);
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ipcRenderer } = require('electron');
    await ipcRenderer.invoke('file:write', filePath, content);
    return;
  } catch (err) {
    throw new Error('IPC not available in renderer');
  }
}
