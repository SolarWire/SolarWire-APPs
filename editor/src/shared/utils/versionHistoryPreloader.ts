import { versionCache } from '../cache/versionCache';
import type { VersionAnalysisContext } from '../types/version';
import type { GitCommit as BaseGitCommit } from '../types/git';
import { useGitAnalysisStore } from '../../app/stores/gitAnalysisStore';

const SUPPORTED_EXTENSIONS = ['.md', '.markdown', '.sw', '.solarwire'];

function isSupportedFile(path: string): boolean {
  const lower = path.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function extractTitles(content: string): string[] {
  const titles = new Set<string>();
  const titleRegex = /^!title=(.+)/gm;
  let match;
  while ((match = titleRegex.exec(content)) !== null) {
    titles.add(match[1].trim());
  }
  return titles.size > 0 ? Array.from(titles) : ['unknown'];
}

async function readFileContent(filePath: string): Promise<string> {
  const api = (window as any).api;
  if (api && typeof api.readFile === 'function') {
    return await api.readFile(filePath);
  }
  throw new Error('readFile API not available');
}

async function collectAllFiles(dirPath: string): Promise<string[]> {
  const api = (window as any).api;
  if (!api || typeof api.getFileTree !== 'function') return [];

  async function walkTree(path: string): Promise<string[]> {
    const tree = await api.getFileTree(path);
    const files: string[] = [];
    for (const node of tree) {
      const fullPath = `${path}/${node.name}`;
      if (node.type === 'directory') {
        files.push(...await walkTree(fullPath));
      } else if (node.type === 'file' && isSupportedFile(fullPath)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  return walkTree(dirPath);
}

function buildCacheKey(filePath: string, title: string, snippetIndex?: number): string {
  return snippetIndex !== undefined
    ? `${filePath}:${snippetIndex}:${title}`
    : `${filePath}:${title}`;
}

export async function preloadVersionHistory(
  dirPath: string,
  gitLogApi: (filePath?: string) => Promise<BaseGitCommit[]>,
  getFileContentAtCommit: (path: string, hash: string) => Promise<string>,
  options?: { onProgress?: (current: number, total: number, file: string) => void }
): Promise<void> {
  console.log('[VersionPreloader] Starting preload for:', dirPath);

  const allFiles = await collectAllFiles(dirPath);
  console.log(`[VersionPreloader] Found ${allFiles.length} supported files`);

  if (allFiles.length === 0) return;

  const gitCommits = await gitLogApi();
  const limitedCommits = gitCommits.slice(0, 50);

  if (limitedCommits.length === 0) {
    console.log('[VersionPreloader] No git commits found, skipping preload');
    return;
  }

  let processed = 0;
  let totalAnalysis = 0;

  for (const filePath of allFiles) {
    try {
      const content = await readFileContent(filePath);
      const titles = extractTitles(content);
      totalAnalysis += titles.length;
    } catch (e) {
      console.warn('[VersionPreloader] Failed to read file:', filePath, e);
    }
  }

  useGitAnalysisStore.getState().setGitAnalysis({
    total: totalAnalysis,
    processed: 0,
    status: 'running',
    onCancel: () => {
      console.log('[VersionPreloader] Cancelled by user');
    }
  });

  for (const filePath of allFiles) {
    try {
      let content = '';
      try {
        content = await readFileContent(filePath);
      } catch (e) {
        console.warn('[VersionPreloader] Failed to read file:', filePath, e);
        processed++;
        options?.onProgress?.(processed, allFiles.length, filePath);
        continue;
      }

      const titles = extractTitles(content);
      const relativePath = filePath.replace(dirPath + '/', '');

      for (const title of titles) {
        const cacheKey = buildCacheKey(relativePath, title);
        if (versionCache.has(cacheKey)) {
          console.log('[VersionPreloader] Cache hit, skipping:', cacheKey);
          processed++;
          useGitAnalysisStore.getState().setGitAnalysis({
            total: totalAnalysis,
            processed,
            status: 'running'
          });
          options?.onProgress?.(processed, allFiles.length, filePath);
          continue;
        }

        const context: VersionAnalysisContext = {
          type: relativePath.toLowerCase().endsWith('.md') || relativePath.toLowerCase().endsWith('.markdown')
            ? 'solarwire-file'
            : 'solarwire-file',
          filePath: relativePath,
          title
        };

        await analyzeAndCache(
          limitedCommits,
          relativePath,
          content,
          context,
          getFileContentAtCommit
        );

        processed++;
        useGitAnalysisStore.getState().setGitAnalysis({
          total: totalAnalysis,
          processed,
          status: 'running'
        });
        options?.onProgress?.(processed, allFiles.length, filePath);
      }
    } catch (e) {
      console.error('[VersionPreloader] Failed to preload file:', filePath, e);
      processed++;
      options?.onProgress?.(processed, allFiles.length, filePath);
    }
  }

  useGitAnalysisStore.getState().setGitAnalysis({
    total: totalAnalysis,
    processed,
    status: 'completed',
    matchingCommits: 0
  });

  setTimeout(() => {
    useGitAnalysisStore.getState().setGitAnalysis(null);
  }, 2000);

  console.log('[VersionPreloader] Preload completed');
}

async function analyzeAndCache(
  commits: BaseGitCommit[],
  filePath: string,
  fileContent: string,
  context: VersionAnalysisContext,
  getFileContentAtCommit: (path: string, hash: string) => Promise<string>
): Promise<void> {
  const WorkerClass = (window as any).Worker;
  if (!WorkerClass) return;

  return new Promise((resolve) => {
    const worker = new Worker(
      new URL('../../workers/git-diff-analyzer.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const timeout = setTimeout(() => {
      worker.terminate();
      resolve();
    }, 30000);

    let pendingRequestId = 0;
    const pendingRequests = new Map<number, { path: string; hash: string }>();

    worker.onmessage = async (event) => {
      const { type, data, id, filePath: reqPath, commitHash } = event.data;

      if (type === 'getFileContent') {
        const requestId = id;
        pendingRequests.set(requestId, { path: reqPath, hash: commitHash });
        try {
          const content = await getFileContentAtCommit(reqPath, commitHash);
          worker.postMessage({
            type: 'getFileContentResponse',
            id: requestId,
            success: true,
            content
          });
        } catch (error: any) {
          worker.postMessage({
            type: 'getFileContentResponse',
            id: requestId,
            success: false,
            error: error.message || 'Failed to get file content'
          });
        }
      } else if (type === 'complete') {
        clearTimeout(timeout);
        const cacheKey = buildCacheKey(context.filePath, context.title);
        versionCache.set(cacheKey, {
          commits: data.matchingCommits,
          timestamp: Date.now(),
          analyzedCount: data.analyzedCount,
          context
        });
        worker.terminate();
        resolve();
      } else if (type === 'error') {
        clearTimeout(timeout);
        worker.terminate();
        resolve();
      }
    };

    worker.onerror = () => {
      clearTimeout(timeout);
      worker.terminate();
      resolve();
    };

    worker.postMessage({
      type: 'analyze',
      commits,
      filePath,
      context
    });
  });
}
