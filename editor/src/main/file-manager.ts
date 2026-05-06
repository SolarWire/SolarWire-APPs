import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  modifiedTime?: number;
}

interface SolarWireSnippet {
  id: string;
  name: string;
  sourceFile: string;
  code: string;
  type: 'file' | 'snippet';
  snippetIndex?: number;
}

// 项目根目录（用户通过文件对话框选择的目录）
let allowedRootPath: string | null = null;

/**
 * 设置允许访问的根目录
 */
export function setAllowedRoot(rootPath: string): void {
  allowedRootPath = path.resolve(rootPath);
}

/**
 * 获取当前允许的根目录
 */
export function getAllowedRoot(): string | null {
  return allowedRootPath;
}

/**
 * 验证请求的路径是否在允许的根目录下
 * 防止 Path Traversal 攻击
 */
export function validatePath(requestedPath: string): boolean {
  if (!allowedRootPath) {
    // 如果未设置根目录，拒绝所有访问
    throw new Error('Access denied: No project root set. Please open a folder first.');
  }

  const normalized = path.normalize(requestedPath);
  const resolved = path.resolve(normalized);

  // 确保解析后的路径在允许的根目录下
  const normalizedRoot = path.resolve(allowedRootPath);
  const isSubpath = resolved === normalizedRoot || resolved.startsWith(normalizedRoot + path.sep);

  if (!isSubpath) {
    console.error(`[Security] Blocked access to path outside project root:`, {
      requested: requestedPath,
      resolved,
      allowedRoot: normalizedRoot,
    });
    throw new Error('Access denied: Path outside project directory');
  }

  return true;
}

export async function readFile(filePath: string): Promise<string> {
  try {
    validatePath(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

export async function writeFile(filePath: string, content: string | ArrayBuffer | Uint8Array, allowOutsideProject: boolean = false): Promise<void> {
  try {
    if (!allowOutsideProject) {
      validatePath(filePath);
    }
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
      const buffer = Buffer.from(content as ArrayBuffer);
      await fs.writeFile(filePath, buffer);
    } else {
      await fs.writeFile(filePath, content, 'utf-8');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to write file: ${filePath}`);
  }
}

export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    validatePath(dirPath);
    const files = await fs.readdir(dirPath);
    return files;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to list files: ${dirPath}`);
  }
}

export async function getFileTree(dirPath: string, depth = 3): Promise<FileNode[]> {
  try {
    validatePath(dirPath);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const tree: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const stats = await fs.stat(fullPath);
      const node: FileNode = {
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        children: [],
        modifiedTime: stats.mtimeMs,
      };

      if (entry.isDirectory() && depth > 0) {
        try {
          node.children = await getFileTree(fullPath, depth - 1);
        } catch (err) {
          // Skip directories we can't access
        }
      }

      tree.push(node);
    }

    return tree.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
  } catch (error) {
    throw new Error(`Failed to get file tree: ${dirPath}`);
  }
}

async function extractSolarWireFromFile(filePath: string): Promise<SolarWireSnippet[]> {
  const results: SolarWireSnippet[] = [];
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.solarwire' || ext === '.sw') {
    try {
      const content = await readFile(filePath);
      const name = path.basename(filePath);
      results.push({
        id: `file-${filePath}`,
        name,
        sourceFile: filePath,
        code: content,
        type: 'file',
      });
    } catch (err) {
      console.error(`Failed to read solarwire file ${filePath}:`, err);
    }
  } else if (ext === '.md' || ext === '.markdown') {
    try {
      const content = await readFile(filePath);
      const solarwireBlockRegex = /```solarwire\s*([\s\S]*?)```/g;
      let match;
      let snippetIndex = 0;

      while ((match = solarwireBlockRegex.exec(content)) !== null) {
        const code = match[1].trim();
        if (code) {
          snippetIndex++;
          results.push({
            id: `snippet-${filePath}-${snippetIndex}`,
            name: `${path.basename(filePath)} #${snippetIndex}`,
            sourceFile: filePath,
            code,
            type: 'snippet',
            snippetIndex
          });
        }
      }
    } catch (err) {
      console.error(`Failed to read markdown file ${filePath}:`, err);
    }
  }

  return results;
}

async function collectSolarWireFromTree(nodes: FileNode[]): Promise<SolarWireSnippet[]> {
  const results: SolarWireSnippet[] = [];

  for (const node of nodes) {
    if (node.type === 'file') {
      const snippets = await extractSolarWireFromFile(node.path);
      results.push(...snippets);
    } else if (node.children && node.children.length > 0) {
      const childSnippets = await collectSolarWireFromTree(node.children);
      results.push(...childSnippets);
    }
  }

  return results;
}

export async function collectSolarWireSnippets(dirPath: string): Promise<SolarWireSnippet[]> {
  try {
    const tree = await getFileTree(dirPath, 10);
    return await collectSolarWireFromTree(tree);
  } catch (error) {
    console.error('Failed to collect solarwire snippets:', error);
    return [];
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    validatePath(dirPath);
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
}

export async function copyFile(srcPath: string, destPath: string): Promise<void> {
  try {
    validatePath(destPath);
    
    const destDir = path.dirname(destPath);
    await fs.mkdir(destDir, { recursive: true });
    
    const readStream = fsSync.createReadStream(srcPath);
    const writeStream = fsSync.createWriteStream(destPath);
    
    await new Promise<void>((resolve, reject) => {
      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
      readStream.pipe(writeStream);
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to copy file: ${srcPath} -> ${destPath}`);
  }
}

export async function readImageAsBase64(imagePath: string): Promise<string> {
  try {
    validatePath(imagePath);
    const buffer = await fs.readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase().slice(1);
    const mimeType = ext === 'png' ? 'image/png' : 
                     ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                     ext === 'gif' ? 'image/gif' :
                     ext === 'webp' ? 'image/webp' :
                     ext === 'svg' ? 'image/svg+xml' :
                     'application/octet-stream';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to read image: ${imagePath}`);
  }
}

export async function rename(oldPath: string, newPath: string): Promise<void> {
  try {
    validatePath(oldPath);
    validatePath(newPath);
    await fs.rename(oldPath, newPath);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to rename: ${oldPath} -> ${newPath}`);
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    validatePath(filePath);
    await fs.unlink(filePath);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to delete file: ${filePath}`);
  }
}

export async function deleteDirectory(dirPath: string): Promise<void> {
  try {
    validatePath(dirPath);
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to delete directory: ${dirPath}`);
  }
}

export async function mkdir(dirPath: string): Promise<void> {
  try {
    validatePath(dirPath);
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    validatePath(filePath);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function showItemInFolder(filePath: string): Promise<void> {
  try {
    validatePath(filePath);
    const { shell } = require('electron');
    shell.showItemInFolder(filePath);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw error;
    }
    throw new Error(`Failed to show item in folder: ${filePath}`);
  }
}
