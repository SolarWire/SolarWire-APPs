/**
 * Git Diff 分析器 Web Worker
 * 负责后台分析 Git 提交，识别哪些提交修改了目标 SolarWire 代码块
 */

import { marked } from 'marked';
import type { GitCommit, VersionAnalysisContext } from '../../shared/types/version';

/**
 * Worker 消息类型
 */
type WorkerMessageType = 'analyze' | 'cancel' | 'getFileContent';

/**
 * Worker 请求消息
 */
interface WorkerRequestMessage {
  type: 'analyze' | 'cancel';
  commits?: GitCommit[];
  filePath?: string;
  context?: VersionAnalysisContext;
}

/**
 * Worker 响应消息
 */
interface WorkerResponseMessage {
  type: 'progress' | 'complete' | 'error' | 'getFileContent' | 'getFileContentResponse';
  data?: any;
  id?: number;
  success?: boolean;
  content?: string;
  error?: string;
}

/**
 * 分析结果
 */
interface AnalysisResult {
  matchingCommits: GitCommit[];
  analyzedCount: number;
  total: number;
}

/**
 * 主线程消息处理器
 */
self.onmessage = async (event: MessageEvent<WorkerRequestMessage>) => {
  const { type, commits, filePath, context } = event.data;

  if (type === 'cancel') {
    // 取消分析
    console.log('[Worker] Analysis cancelled');
    return;
  }

  if (type === 'analyze') {
    if (!commits || !filePath || !context) {
      postMessage({
        type: 'error',
        data: {
          message: '缺少必要参数',
          suggestion: '请提供 commits、filePath 和 context'
        }
      } as WorkerResponseMessage);
      return;
    }

    try {
      await analyzeCommits(commits, filePath, context);
    } catch (error) {
      postMessage({
        type: 'error',
        data: {
          message: '分析过程中发生错误',
          suggestion: '请检查 Git 仓库是否正常，或稍后重试'
        }
      } as WorkerResponseMessage);
    }
  }
};

/**
 * 分析所有提交
 */
async function analyzeCommits(
  commits: GitCommit[],
  filePath: string,
  context: VersionAnalysisContext
): Promise<void> {
  const matchingCommits: GitCommit[] = [];
  let analyzedCount = 0;

  console.log(`[Worker] Starting analysis for ${commits.length} commits`);
  console.log(`[Worker] Context:`, context);

  // 分析每个 commit
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    analyzedCount++;

    try {
      // 获取该 commit 时的文件内容
      const contentAtCommit = await getFileContentAtCommit(filePath, commit.hash);

      if (!contentAtCommit) {
        console.warn(`[Worker] No content found for commit ${commit.hash}`);
        continue;
      }

      // 根据文件类型进行分析
      let isMatch = false;

      if (context.type === 'solarwire-file') {
        // .solarwire 文件：直接解析并对比
        isMatch = analyzeSolarWireFile(contentAtCommit, context.title);
      } else {
        // .md 文件：解析 Markdown，提取代码块并对比
        isMatch = analyzeMarkdownSnippet(
          contentAtCommit,
          context.snippetIndex!,
          context.title
        );
      }

      if (isMatch) {
        matchingCommits.push(commit);
        console.log(`[Worker] Match found for commit ${commit.shortHash}`);
      }

      // 每 5 个提交更新一次进度
      if (analyzedCount % 5 === 0 || analyzedCount === commits.length) {
        postMessage({
          type: 'progress',
          data: {
            total: commits.length,
            processed: analyzedCount,
            currentCommit: commit.hash,
            matchingCommits: [...matchingCommits],
            status: 'running'
          }
        } as WorkerResponseMessage);
      }
    } catch (error) {
      console.error(`[Worker] Failed to analyze commit ${commit.hash}`, error);
      // 继续分析下一个
    }
  }

  console.log(`[Worker] Analysis complete. Found ${matchingCommits.length} matching commits`);

  // 分析完成
  postMessage({
    type: 'complete',
    data: {
      matchingCommits,
      analyzedCount,
      total: commits.length
    }
  } as WorkerResponseMessage);
}

/**
 * 分析 .solarwire 文件
 */
function analyzeSolarWireFile(content: string, title: string): boolean {
  console.log('[Worker] Analyzing solarwire file');

  // 检查文件是否包含该 title
  if (!content.includes(title)) {
    console.log('[Worker] Title not found in file');
    return false;
  }

  // 解析 AST（使用简化的正则解析）
  const elements = parseSolarWireElements(content);

  // 检查是否有元素的 !title 匹配
  const hasMatch = elements.some(el => el.title === title);
  console.log(`[Worker] Found ${elements.length} elements, match: ${hasMatch}`);

  return hasMatch;
}

/**
 * 分析 Markdown 文件中的 SolarWire 代码块
 */
function analyzeMarkdownSnippet(
  content: string,
  snippetIndex: number,
  title: string
): boolean {
  console.log(`[Worker] Analyzing markdown snippet #${snippetIndex}`);

  // 使用 marked 解析 Markdown
  const tokens = marked.lexer(content);

  // 提取所有 solarwire 代码块
  const solarwireBlocks: { code: string; index: number }[] = [];
  let currentIndex = 0;

  for (const token of tokens) {
    if (token.type === 'code' && token.lang === 'solarwire') {
      solarwireBlocks.push({
        code: token.text,
        index: currentIndex++
      });
    }
  }

  console.log(`[Worker] Found ${solarwireBlocks.length} solarwire blocks`);

  // 找到目标代码块
  const targetBlock = solarwireBlocks.find(
    block => block.index === snippetIndex
  );

  if (!targetBlock) {
    console.log(`[Worker] Snippet #${snippetIndex} not found`);
    return false;
  }

  // 检查代码块是否包含该 title
  if (!targetBlock.code.includes(title)) {
    console.log('[Worker] Title not found in snippet');
    return false;
  }

  // 解析代码块 AST 并对比
  const elements = parseSolarWireElements(targetBlock.code);
  const hasMatch = elements.some(el => el.title === title);
  console.log(`[Worker] Snippet analysis: ${elements.length} elements, match: ${hasMatch}`);

  return hasMatch;
}

/**
 * 简化版 SolarWire 元素解析
 * 实际应该使用 @solarwire/parser，但为了减少依赖使用正则解析
 */
function parseSolarWireElements(content: string): Array<{ title?: string }> {
  const elements: Array<{ title?: string }> = [];

  // 简单的正则解析 !title
  const titleMatch = content.match(/^!title=(.+)/m);
  if (titleMatch) {
    elements.push({ title: titleMatch[1].trim() });
  }

  return elements;
}

/**
 * 从主线程获取文件内容
 */
async function getFileContentAtCommit(filePath: string, commitHash: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const messageId = Date.now();
    const timeout = 5000; // 5 秒超时

    // 发送请求到主线程
    postMessage({
      type: 'getFileContent',
      id: messageId,
      filePath,
      commitHash
    } as WorkerResponseMessage);

    // 监听响应
    const handler = (event: MessageEvent<WorkerResponseMessage>) => {
      if (
        event.data.type === 'getFileContentResponse' &&
        (event.data as any).id === messageId
      ) {
        // @ts-ignore
        self.removeEventListener('message', handler);
        if (event.data.success && event.data.content !== undefined) {
          resolve(event.data.content);
        } else {
          reject(new Error(event.data.error || 'Unknown error'));
        }
      }
    };

    self.addEventListener('message', handler);

    // 超时处理
    setTimeout(() => {
      self.removeEventListener('message', handler);
      reject(new Error(`Timeout getting file content for ${commitHash}`));
    }, timeout);
  });
}
