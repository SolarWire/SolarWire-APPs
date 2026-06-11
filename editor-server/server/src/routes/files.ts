import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import { Dirent } from 'fs';
import path from 'path';
import multer from 'multer';
import { resolveSafePath, getWorkspaceRoot } from '../middleware/security';

const router = Router();
const WORKSPACE_ROOT = getWorkspaceRoot();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function toRelative(absPath: string): string {
  return path.relative(WORKSPACE_ROOT, absPath).replace(/\\/g, '/');
}

function toAbsolute(relPath: string): string {
  return path.resolve(WORKSPACE_ROOT, relPath);
}

router.get('/tree', async (req: Request, res: Response) => {
  try {
    const dirPath = (req.query.path as string) || '';
    const targetDir = dirPath ? resolveSafePath(dirPath) : WORKSPACE_ROOT;

    await fs.mkdir(targetDir, { recursive: true });

    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const tree = await buildFileTree(targetDir, entries);

    res.json(tree);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

async function buildFileTree(dirPath: string, entries: Dirent[]): Promise<any[]> {
  const nodes: any[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const relPath = toRelative(fullPath);

    if (entry.isDirectory()) {
      const children = await fs.readdir(fullPath, { withFileTypes: true });
      nodes.push({
        name: entry.name,
        path: relPath,
        type: 'directory',
        children: await buildFileTree(fullPath, children),
        modifiedTime: (await fs.stat(fullPath)).mtimeMs,
      });
    } else {
      nodes.push({
        name: entry.name,
        path: relPath,
        type: 'file',
        modifiedTime: (await fs.stat(fullPath)).mtimeMs,
      });
    }
  }

  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

router.get('/read', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'path is required' });
      return;
    }
    const safePath = resolveSafePath(filePath);
    const content = await fs.readFile(safePath, 'utf-8');
    res.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.post('/write', async (req: Request, res: Response) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      res.status(400).json({ error: 'path and content are required' });
      return;
    }
    const safePath = resolveSafePath(filePath);
    await fs.mkdir(path.dirname(safePath), { recursive: true });
    await fs.writeFile(safePath, content, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.post('/mkdir', async (req: Request, res: Response) => {
  try {
    const { path: dirPath } = req.body;
    if (!dirPath) {
      res.status(400).json({ error: 'path is required' });
      return;
    }
    const safePath = resolveSafePath(dirPath);
    await fs.mkdir(safePath, { recursive: true });
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.delete('/', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'path is required' });
      return;
    }
    const safePath = resolveSafePath(filePath);
    const stat = await fs.stat(safePath);
    if (stat.isDirectory()) {
      await fs.rm(safePath, { recursive: true, force: true });
    } else {
      await fs.unlink(safePath);
    }
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.post('/rename', async (req: Request, res: Response) => {
  try {
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
      res.status(400).json({ error: 'oldPath and newPath are required' });
      return;
    }
    const safeOldPath = resolveSafePath(oldPath);
    const safeNewPath = resolveSafePath(newPath);
    await fs.rename(safeOldPath, safeNewPath);
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const dir = (req.body.dir as string) || '';
    const targetDir = dir ? resolveSafePath(dir) : WORKSPACE_ROOT;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileName = req.file.originalname;
    const safePath = path.join(targetDir, fileName);

    if (!safePath.startsWith(WORKSPACE_ROOT)) {
      res.status(403).json({ error: 'Path traversal detected' });
      return;
    }

    await fs.writeFile(safePath, req.file.buffer);
    res.json({ success: true, path: toRelative(safePath) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.get('/exists', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'path is required' });
      return;
    }
    const safePath = resolveSafePath(filePath);
    try {
      await fs.access(safePath);
      res.json({ exists: true });
    } catch {
      res.json({ exists: false });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.get('/info', async (req: Request, res: Response) => {
  try {
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
    res.json({ root: '.', name: path.basename(WORKSPACE_ROOT) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.get('/read-raw', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'path is required' });
      return;
    }
    const safePath = resolveSafePath(filePath);
    const buffer = await fs.readFile(safePath);
    const base64 = buffer.toString('base64');
    res.json({ content: base64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.get('/download', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'path is required' });
      return;
    }
    const safePath = resolveSafePath(filePath);
    const fileName = path.basename(safePath);
    res.download(safePath, fileName);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

const SOLARWIRE_EXTS = new Set(['.solarwire', '.sw']);
const MARKDOWN_EXTS = new Set(['.md', '.markdown']);

async function extractSolarWireFromFile(filePath: string): Promise<any[]> {
  const results: any[] = [];
  const ext = path.extname(filePath).toLowerCase();

  if (SOLARWIRE_EXTS.has(ext)) {
    try {
      const absPath = toAbsolute(filePath);
      const content = await fs.readFile(absPath, 'utf-8');
      results.push({
        id: `file-${filePath}`,
        name: path.basename(filePath),
        sourceFile: filePath,
        code: content,
        type: 'file',
      });
    } catch (err) {
      console.error(`Failed to read solarwire file ${filePath}:`, err);
    }
  } else if (MARKDOWN_EXTS.has(ext)) {
    try {
      const absPath = toAbsolute(filePath);
      const content = await fs.readFile(absPath, 'utf-8');
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
            snippetIndex,
          });
        }
      }
    } catch (err) {
      console.error(`Failed to read markdown file ${filePath}:`, err);
    }
  }

  return results;
}

async function collectSolarWireFromTree(nodes: any[]): Promise<any[]> {
  const results: any[] = [];

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

router.get('/snippets', async (req: Request, res: Response) => {
  try {
    const dirPath = (req.query.path as string) || '';
    const targetDir = dirPath ? resolveSafePath(dirPath) : WORKSPACE_ROOT;

    await fs.mkdir(targetDir, { recursive: true });
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const tree = await buildFileTree(targetDir, entries);
    const snippets = await collectSolarWireFromTree(tree);

    res.json(snippets);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;