import * as fs from 'fs/promises';
import * as path from 'path';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface SolarWireSnippet {
  id: string;
  name: string;
  sourceFile: string;
  code: string;
  type: 'file' | 'snippet';
  snippetIndex?: number;
}

export async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file: ${filePath}`);
  }
}

export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    return files;
  } catch (error) {
    throw new Error(`Failed to list files: ${dirPath}`);
  }
}

export async function getFileTree(dirPath: string, depth = 3): Promise<FileNode[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const tree: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const node: FileNode = {
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        children: [],
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
