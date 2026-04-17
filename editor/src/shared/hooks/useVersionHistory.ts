/**
 * useVersionHistory Hook
 * 管理版本历史分析的状态和逻辑
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { versionCache } from '../cache/versionCache';
import { GitCommit, VersionAnalysisContext, AnalysisProgress, TitleValidationResult } from '../types/version';
import { performanceMonitor } from '../utils/performanceMonitor';

interface GitApi {
  getLog: (filePath?: string) => Promise<GitCommit[]>;
  getFileContentAtCommit: (path: string, hash: string) => Promise<string>;
  isInitialized: boolean;
}

interface UseVersionHistoryResult {
  analysisProgress: AnalysisProgress | null;
  matchingCommits: GitCommit[];
  error: string | null;
  suggestion: string | null;
  cancelAnalysis: () => void;
  isLoading: boolean;
}

interface SolarWireSnippet {
  code: string;
  snippetIndex: number;
}

function validateTitle(filePath: string, snippet?: SolarWireSnippet): TitleValidationResult {
  try {
    if (snippet) {
      const titleMatch = snippet.code.match(/^!title=(.+)/m);
      if (!titleMatch) {
        return {
          valid: false,
          error: '该代码块缺少 !title 标识',
          suggestion: `请在代码块第一行添加 !title=xxx\n例如：\n\`\`\`solarwire\n!title=登录页面流程图\n...\`\`\``
        };
      }
      return {
        valid: true,
        title: titleMatch[1].trim()
      };
    } else {
      return {
        valid: true,
        title: 'unknown'
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: '无法读取文件内容',
      suggestion: '请确保文件存在且可访问'
    };
  }
}

function buildCacheKey(filePath: string, snippet: SolarWireSnippet | undefined, title: string): string {
  if (snippet) {
    return `${filePath}:${snippet.snippetIndex}:${title}`;
  }
  return `${filePath}:${title}`;
}

async function handleWorkerFileContentRequest(
  worker: Worker,
  requestId: number,
  filePath: string,
  commitHash: string,
  getFileContentAtCommit: (path: string, hash: string) => Promise<string>
) {
  try {
    const content = await getFileContentAtCommit(filePath, commitHash);
    worker.postMessage({
      type: 'getFileContentResponse',
      id: requestId,
      success: true,
      content
    });
  } catch (error: any) {
    console.error('Failed to get file content for worker:', error);
    worker.postMessage({
      type: 'getFileContentResponse',
      id: requestId,
      success: false,
      error: error.message || 'Failed to get file content'
    });
  }
}

export function useVersionHistory(
  filePath: string, 
  snippet: SolarWireSnippet | undefined,
  gitApi: GitApi
): UseVersionHistoryResult {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);
  const analysisStartTime = useRef<number>(0);

  const cancelAnalysis = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'cancel' });
      workerRef.current.terminate();
      workerRef.current = null;
      setWorker(null);
      setProgress(prev => prev ? { ...prev, status: 'cancelled' } : null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    analysisStartTime.current = Date.now();
  }, [filePath, snippet]);

  useEffect(() => {
    async function startAnalysis() {
      let titleResult: TitleValidationResult;
      
      if (snippet) {
        titleResult = validateTitle(filePath, snippet);
      } else {
        titleResult = {
          valid: true,
          title: 'pending'
        };
      }

      if (!titleResult.valid) {
        setError(titleResult.error || null);
        setSuggestion(titleResult.suggestion || null);
        return;
      }

      if (!gitApi.isInitialized) {
        setError('Git 仓库未初始化');
        setSuggestion('请先打开一个包含 Git 仓库的文件夹');
        return;
      }

      if (titleResult.title && titleResult.title !== 'pending') {
        const cacheKey = buildCacheKey(filePath, snippet, titleResult.title);
        const cached = versionCache.get(cacheKey);
        
        if (cached) {
          setCommits(cached.commits);
          setIsLoading(false);
          return;
        }
      }

      try {
        const relativePath = filePath;
        const gitCommits = await gitApi.getLog(relativePath);
        console.log(`[useVersionHistory] Retrieved ${gitCommits.length} commits from gitStore`);
        const limitedCommits = gitCommits.slice(0, 50);

        if (limitedCommits.length === 0) {
          setError('没有找到提交历史');
          setSuggestion('请确保 Git 仓库有提交记录');
          return;
        }

        const analyzerWorker = new Worker(
          new URL('../workers/git-diff-analyzer.worker.ts', import.meta.url)
        );
        
        workerRef.current = analyzerWorker;
        setWorker(analyzerWorker);
        setIsLoading(true);

        analyzerWorker.onerror = (error) => {
          console.error('Worker error:', error);
          setError('无法创建后台分析任务');
          setSuggestion('请刷新页面或检查浏览器兼容性');
          setIsLoading(false);
        };

        const context: VersionAnalysisContext = {
          type: snippet ? 'markdown-snippet' : 'solarwire-file',
          filePath,
          title: titleResult.title || 'unknown',
          snippetIndex: snippet?.snippetIndex
        };

        analyzerWorker.onmessage = (event) => {
          const { type, data, id } = event.data;

          if (type === 'getFileContent') {
            handleWorkerFileContentRequest(analyzerWorker, id, data.filePath, data.commitHash, gitApi.getFileContentAtCommit);
          } else if (type === 'progress') {
            setProgress(data);
          } else if (type === 'complete') {
            setProgress({ ...data, status: 'completed' });
            setCommits(data.matchingCommits);
            setIsLoading(false);

            const analysisTime = Date.now() - analysisStartTime.current;
            performanceMonitor.recordAnalysisTime(analysisTime);
            console.log(`[Performance] Analysis completed in ${analysisTime}ms`);

            if (titleResult.title && titleResult.title !== 'pending') {
              const cacheKey = buildCacheKey(filePath, snippet, titleResult.title);
              versionCache.set(cacheKey, {
                commits: data.matchingCommits,
                timestamp: Date.now(),
                analyzedCount: data.analyzedCount,
                context: {
                  type: snippet ? 'markdown-snippet' : 'solarwire-file',
                  filePath,
                  title: titleResult.title
                }
              });
            }
          } else if (type === 'error') {
            setError(data.message);
            setSuggestion(data.suggestion);
            setIsLoading(false);
          }
        };

        analyzerWorker.postMessage({
          type: 'analyze',
          commits: limitedCommits,
          filePath,
          context
        });

      } catch (err) {
        console.error('Failed to start analysis:', err);
        setError('分析过程中发生错误');
        setSuggestion('请稍后重试');
        setIsLoading(false);
      }
    }

    if (filePath) {
      startAnalysis();
    }
  }, [filePath, snippet, gitApi]);

  return {
    analysisProgress: progress,
    matchingCommits: commits,
    error,
    suggestion,
    cancelAnalysis,
    isLoading
  };
}

export async function warmupVersionCache(
  filePath: string,
  snippet?: SolarWireSnippet,
  title?: string
): Promise<void> {
  try {
    if (title) {
      const cacheKey = `${filePath}:${snippet?.snippetIndex || ''}:${title}`;
      if (versionCache.has(cacheKey)) {
        console.log(`[Cache Warmup] Cache hit for ${filePath}`);
        return;
      }
    }
    console.log(`[Cache Warmup] Will warmup cache for ${filePath}`);
  } catch (error) {
    console.error('[Cache Warmup] Failed:', error);
  }
}
