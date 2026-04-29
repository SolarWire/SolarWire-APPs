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
exports.setAllowedRoot = setAllowedRoot;
exports.getAllowedRoot = getAllowedRoot;
exports.validatePath = validatePath;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.listFiles = listFiles;
exports.getFileTree = getFileTree;
exports.collectSolarWireSnippets = collectSolarWireSnippets;
exports.ensureDir = ensureDir;
exports.copyFile = copyFile;
exports.readImageAsBase64 = readImageAsBase64;
exports.rename = rename;
exports.deleteFile = deleteFile;
exports.deleteDirectory = deleteDirectory;
exports.mkdir = mkdir;
exports.exists = exists;
const fs = __importStar(require("fs/promises"));
const fsSync = __importStar(require("fs"));
const path = __importStar(require("path"));
// 项目根目录（用户通过文件对话框选择的目录）
let allowedRootPath = null;
/**
 * 设置允许访问的根目录
 */
function setAllowedRoot(rootPath) {
    allowedRootPath = path.resolve(rootPath);
}
/**
 * 获取当前允许的根目录
 */
function getAllowedRoot() {
    return allowedRootPath;
}
/**
 * 验证请求的路径是否在允许的根目录下
 * 防止 Path Traversal 攻击
 */
function validatePath(requestedPath) {
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
async function readFile(filePath) {
    try {
        validatePath(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
            throw error;
        }
        throw new Error(`Failed to read file: ${filePath}`);
    }
}
async function writeFile(filePath, content, allowOutsideProject = false) {
    try {
        if (!allowOutsideProject) {
            validatePath(filePath);
        }
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
            const buffer = Buffer.from(content);
            await fs.writeFile(filePath, buffer);
        }
        else {
            await fs.writeFile(filePath, content, 'utf-8');
        }
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
            throw error;
        }
        throw new Error(`Failed to write file: ${filePath}`);
    }
}
async function listFiles(dirPath) {
    try {
        validatePath(dirPath);
        const files = await fs.readdir(dirPath);
        return files;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
            throw error;
        }
        throw new Error(`Failed to list files: ${dirPath}`);
    }
}
async function getFileTree(dirPath, depth = 3) {
    try {
        validatePath(dirPath);
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const tree = [];
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const node = {
                name: entry.name,
                path: fullPath,
                type: entry.isDirectory() ? 'directory' : 'file',
                children: [],
            };
            if (entry.isDirectory() && depth > 0) {
                try {
                    node.children = await getFileTree(fullPath, depth - 1);
                }
                catch (err) {
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
    }
    catch (error) {
        throw new Error(`Failed to get file tree: ${dirPath}`);
    }
}
async function extractSolarWireFromFile(filePath) {
    const results = [];
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
        }
        catch (err) {
            console.error(`Failed to read solarwire file ${filePath}:`, err);
        }
    }
    else if (ext === '.md' || ext === '.markdown') {
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
        }
        catch (err) {
            console.error(`Failed to read markdown file ${filePath}:`, err);
        }
    }
    return results;
}
async function collectSolarWireFromTree(nodes) {
    const results = [];
    for (const node of nodes) {
        if (node.type === 'file') {
            const snippets = await extractSolarWireFromFile(node.path);
            results.push(...snippets);
        }
        else if (node.children && node.children.length > 0) {
            const childSnippets = await collectSolarWireFromTree(node.children);
            results.push(...childSnippets);
        }
    }
    return results;
}
async function collectSolarWireSnippets(dirPath) {
    try {
        const tree = await getFileTree(dirPath, 10);
        return await collectSolarWireFromTree(tree);
    }
    catch (error) {
        console.error('Failed to collect solarwire snippets:', error);
        return [];
    }
}
async function ensureDir(dirPath) {
    try {
        validatePath(dirPath);
        await fs.mkdir(dirPath, { recursive: true });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
            throw error;
        }
        throw new Error(`Failed to create directory: ${dirPath}`);
    }
}
async function copyFile(srcPath, destPath) {
    try {
        validatePath(destPath);
        const destDir = path.dirname(destPath);
        await fs.mkdir(destDir, { recursive: true });
        const readStream = fsSync.createReadStream(srcPath);
        const writeStream = fsSync.createWriteStream(destPath);
        await new Promise((resolve, reject) => {
            readStream.on('error', reject);
            writeStream.on('error', reject);
            writeStream.on('finish', resolve);
            readStream.pipe(writeStream);
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
            throw error;
        }
        throw new Error(`Failed to copy file: ${srcPath} -> ${destPath}`);
    }
}
async function readImageAsBase64(imagePath) {
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
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
            throw error;
        }
        throw new Error(`Failed to read image: ${imagePath}`);
    }
}
async function rename(oldPath, newPath) {
    try {
        validatePath(oldPath);
        validatePath(newPath);
        await fs.rename(oldPath, newPath);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
            throw error;
        }
        throw new Error(`Failed to rename: ${oldPath} -> ${newPath}`);
    }
}
async function deleteFile(filePath) {
    try {
        validatePath(filePath);
        await fs.unlink(filePath);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
            throw error;
        }
        throw new Error(`Failed to delete file: ${filePath}`);
    }
}
async function deleteDirectory(dirPath) {
    try {
        validatePath(dirPath);
        await fs.rm(dirPath, { recursive: true, force: true });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
            throw error;
        }
        throw new Error(`Failed to delete directory: ${dirPath}`);
    }
}
async function mkdir(dirPath) {
    try {
        validatePath(dirPath);
        await fs.mkdir(dirPath, { recursive: true });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
            throw error;
        }
        throw new Error(`Failed to create directory: ${dirPath}`);
    }
}
async function exists(filePath) {
    try {
        validatePath(filePath);
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
