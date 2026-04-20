import { simpleGit, SimpleGit } from 'simple-git';
import * as path from 'path';

interface GitStatus {
  modified: string[];
  staged: string[];
  untracked: string[];
}

interface ChangedFile {
  path: string;
  type: 'added' | 'deleted' | 'modified' | 'renamed';
  additions?: number;
  deletions?: number;
}

interface GitCommit {
  hash: string;
  shortHash: string;
  date: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  changedFiles?: ChangedFile[];
  stats?: {
    additions: number;
    deletions: number;
    files: number;
  };
}

interface GitBranch {
  name: string;
  isCurrent: boolean;
}

/**
 * Git 仓库类 - 每个实例管理一个独立的仓库
 */
class GitRepository {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
    this.git = simpleGit({ baseDir: this.repoPath });
  }

  getRepoPath(): string {
    return this.repoPath;
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const status = await this.git.status();
      return {
        modified: status.modified,
        staged: status.staged,
        untracked: status.not_added,
      };
    } catch (error) {
      console.error('Failed to get git status:', error);
      return { modified: [], staged: [], untracked: [] };
    }
  }

  async getLog(filePath?: string): Promise<GitCommit[]> {
    try {
      const options = filePath ? { file: filePath } : undefined;
      const log = await this.git.log(options);
      return log.all.map((commit) => ({
        hash: commit.hash,
        shortHash: commit.hash.substring(0, 7),
        date: commit.date,
        message: commit.message,
        authorName: commit.author_name,
      }));
    } catch (error) {
      console.error('Failed to get git log:', error);
      return [];
    }
  }

  async getBranches(): Promise<GitBranch[]> {
    try {
      const branches = await this.git.branchLocal();
      return branches.all.map((name) => ({
        name,
        isCurrent: name === branches.current,
      }));
    } catch (error) {
      console.error('Failed to get git branches:', error);
      return [];
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const branches = await this.git.branchLocal();
      return branches.current;
    } catch (error) {
      console.error('Failed to get current branch:', error);
      return '';
    }
  }

  /**
   * 验证文件路径 - 防止路径遍历攻击
   */
  private validateFilePath(filePath: string): void {
    // 防止路径遍历
    if (filePath.includes('..') || filePath.startsWith('/') || filePath.includes('\\..')) {
      throw new Error(`Invalid file path: ${filePath}`);
    }
  }

  /**
   * 验证分支名称 - 只允许安全字符
   */
  private validateBranchName(branchName: string): void {
    // Git 分支名白名单：字母、数字、连字符、下划线、斜杠、点
    if (!/^[a-zA-Z0-9/_\-.\u4e00-\u9fa5]+$/.test(branchName)) {
      throw new Error(`Invalid branch name: ${branchName}`);
    }
    // 防止命令注入
    if (/[,;&|`$(){}[\]!#]/.test(branchName)) {
      throw new Error(`Invalid characters in branch name: ${branchName}`);
    }
  }

  /**
   * 验证 Commit Hash - 只允许十六进制字符
   */
  private validateCommitHash(hash: string): void {
    // Commit hash 应该是 7-40 位的十六进制字符串
    if (!/^[0-9a-f]{7,40}$/i.test(hash)) {
      throw new Error(`Invalid commit hash format: ${hash}`);
    }
  }

  /**
   * Sanitize 提交消息 - 移除危险字符并限制长度
   */
  private sanitizeCommitMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      throw new Error('Commit message cannot be empty');
    }
    // 限制长度为 10000 字符
    const truncated = message.substring(0, 10000);
    // 移除换行符和制表符（防止日志注入）
    return truncated.replace(/[\r\n\t]/g, ' ').trim();
  }

  async stageFile(filePath: string): Promise<void> {
    this.validateFilePath(filePath);
    try {
      await this.git.add(filePath);
    } catch (error) {
      console.error('Failed to stage file:', error);
      throw error;
    }
  }

  async unstageFile(filePath: string): Promise<void> {
    this.validateFilePath(filePath);
    try {
      await this.git.reset(['HEAD', '--', filePath]);
    } catch (error) {
      console.error('Failed to unstage file:', error);
      throw error;
    }
  }

  async stageAllModified(): Promise<void> {
    try {
      await this.git.add('.');
    } catch (error) {
      console.error('Failed to stage all modified files:', error);
      throw error;
    }
  }

  async commit(message: string, name?: string, email?: string): Promise<void> {
    const sanitizedMessage = this.sanitizeCommitMessage(message);
    try {
      if (name) await this.git.addConfig('user.name', name);
      if (email) await this.git.addConfig('user.email', email);
      await this.git.commit(sanitizedMessage);
    } catch (error) {
      console.error('Failed to commit:', error);
      throw error;
    }
  }

  async checkoutBranch(branchName: string): Promise<void> {
    this.validateBranchName(branchName);
    try {
      await this.git.checkout(branchName);
    } catch (error) {
      console.error('Failed to checkout branch:', error);
      throw error;
    }
  }

  async push(): Promise<void> {
    try {
      await this.git.push();
    } catch (error) {
      console.error('Failed to push:', error);
      throw error;
    }
  }

  async pull(): Promise<void> {
    try {
      await this.git.pull();
    } catch (error) {
      console.error('Failed to pull:', error);
      throw error;
    }
  }

  /**
   * 获取指定 commit 时的文件内容
   * @param filePath 文件路径
   * @param commitHash commit hash
   * @returns 文件内容
   */
  async getFileContentAtCommit(filePath: string, commitHash: string): Promise<string> {
    this.validateFilePath(filePath);
    this.validateCommitHash(commitHash);
    
    try {
      // 使用 git show 获取指定 commit 时的文件内容
      const content = await this.git.show([`${commitHash}:${filePath}`]);
      return content || '';
    } catch (error: any) {
      console.error(`Failed to get file content at commit ${commitHash}:`, error);
      // 如果文件在该 commit 时不存在，返回空字符串
      const errorMsg = error.message || error.stderr || '';
      if (
        errorMsg.includes('does not exist') ||
        errorMsg.includes('exists on disk, but not in') ||
        errorMsg.includes('not found in') ||
        errorMsg.includes('fatal:') ||
        errorMsg.includes('no such path')
      ) {
        return '';
      }
      throw error;
    }
  }

  async fetch(): Promise<void> {
    try {
      await this.git.fetch();
    } catch (error) {
      console.error('Failed to fetch:', error);
      throw error;
    }
  }

  async checkoutCommit(hash: string): Promise<void> {
    this.validateCommitHash(hash);
    try {
      await this.git.checkout(hash);
    } catch (error) {
      console.error('Failed to checkout commit:', error);
      throw error;
    }
  }

  async getFileDiff(filePath: string): Promise<string> {
    this.validateFilePath(filePath);
    try {
      const diff = await this.git.diff(['HEAD', '--', filePath]);
      return diff;
    } catch (error) {
      console.error('Failed to get file diff:', error);
      return '';
    }
  }

  async getFileDiffBetweenCommits(
    filePath: string,
    commitHash1: string,
    commitHash2: string
  ): Promise<string> {
    this.validateFilePath(filePath);
    this.validateCommitHash(commitHash1);
    this.validateCommitHash(commitHash2);
    try {
      const diff = await this.git.diff([`${commitHash1}..${commitHash2}`, '--', filePath]);
      return diff;
    } catch (error) {
      console.error('Failed to get file diff between commits:', error);
      return '';
    }
  }

  /**
   * 获取提交详情（修改的文件列表和统计信息）
   * @param commitHash commit hash
   * @returns 修改的文件列表和统计信息
   */
  async getCommitDetails(commitHash: string): Promise<ChangedFile[]> {
    this.validateCommitHash(commitHash);
    
    try {
      // 获取提交的文件变更列表
      const diff = await this.git.diff([`${commitHash}^..${commitHash}`, '--name-status']);
      
      if (!diff) {
        return [];
      }

      const lines = diff.trim().split('\n');
      const changedFiles: ChangedFile[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        
        const parts = line.split('\t');
        if (parts.length < 2) continue;

        const status = parts[0].trim();
        const filePath = parts[1].trim();

        let type: ChangedFile['type'] = 'modified';
        if (status.startsWith('A')) {
          type = 'added';
        } else if (status.startsWith('D')) {
          type = 'deleted';
        } else if (status.startsWith('R')) {
          type = 'renamed';
        }

        changedFiles.push({
          path: filePath,
          type
        });
      }

      // 获取统计信息
      const numstat = await this.git.diff([`${commitHash}^..${commitHash}`, '--numstat']);
      let additions = 0;
      let deletions = 0;

      if (numstat) {
        const stats = numstat.trim().split('\n');
        for (const stat of stats) {
          if (!stat.trim()) continue;
          const [adds, dels] = stat.split('\t');
          if (adds && adds !== '-') {
            additions += parseInt(adds, 10);
          }
          if (dels && dels !== '-') {
            deletions += parseInt(dels, 10);
          }
        }
      }

      // 为每个文件添加详细的统计信息
      if (numstat) {
        const statLines = numstat.trim().split('\n');
        const fileStatsMap = new Map<string, { additions: number; deletions: number }>();
        
        for (const statLine of statLines) {
          if (!statLine.trim()) continue;
          const [adds, dels, filePath] = statLine.split('\t');
          if (filePath) {
            fileStatsMap.set(filePath.trim(), {
              additions: adds && adds !== '-' ? parseInt(adds, 10) : 0,
              deletions: dels && dels !== '-' ? parseInt(dels, 10) : 0
            });
          }
        }

        // 更新 changedFiles 中的统计信息
        for (const file of changedFiles) {
          const stats = fileStatsMap.get(file.path);
          if (stats) {
            file.additions = stats.additions;
            file.deletions = stats.deletions;
          }
        }
      }

      return changedFiles;
    } catch (error: any) {
      console.error(`Failed to get commit details for ${commitHash}:`, error);
      return [];
    }
  }
}

// 使用 Map 管理多个仓库实例
const repositories = new Map<string, GitRepository>();
let currentRepoPath: string | null = null;

/**
 * 获取当前仓库实例
 */
function getCurrentRepo(): GitRepository | null {
  if (!currentRepoPath) {
    return null;
  }
  return repositories.get(currentRepoPath) || null;
}

export function initGit(repoPath: string): void {
  const resolvedPath = path.resolve(repoPath);
  const repo = new GitRepository(resolvedPath);
  repositories.set(resolvedPath, repo);
  currentRepoPath = resolvedPath;
}

export function isGitInitialized(): boolean {
  return currentRepoPath !== null && repositories.has(currentRepoPath);
}

export async function getGitStatus(): Promise<GitStatus> {
  const repo = getCurrentRepo();
  if (!repo) {
    return { modified: [], staged: [], untracked: [] };
  }
  return await repo.getStatus();
}

export async function getGitLog(filePath?: string): Promise<GitCommit[]> {
  const repo = getCurrentRepo();
  if (!repo) {
    return [];
  }
  return await repo.getLog(filePath);
}

export async function getGitBranches(): Promise<GitBranch[]> {
  const repo = getCurrentRepo();
  if (!repo) {
    return [];
  }
  return await repo.getBranches();
}

export async function getCurrentBranch(): Promise<string> {
  const repo = getCurrentRepo();
  if (!repo) {
    return '';
  }
  return await repo.getCurrentBranch();
}

export async function stageFile(filePath: string): Promise<void> {
  const repo = getCurrentRepo();
  if (!repo) {
    throw new Error('Git not initialized');
  }
  await repo.stageFile(filePath);
}

export async function unstageFile(filePath: string): Promise<void> {
  const repo = getCurrentRepo();
  if (!repo) {
    throw new Error('Git not initialized');
  }
  await repo.unstageFile(filePath);
}

export async function stageAllModified(): Promise<void> {
  const repo = getCurrentRepo();
  if (!repo) {
    throw new Error('Git not initialized');
  }
  await repo.stageAllModified();
}

export async function commit(message: string, name?: string, email?: string): Promise<void> {
  const repo = getCurrentRepo();
  if (!repo) {
    throw new Error('Git not initialized');
  }
  await repo.commit(message, name, email);
}

export async function checkoutBranch(branchName: string): Promise<void> {
  const repo = getCurrentRepo();
  if (!repo) {
    throw new Error('Git not initialized');
  }
  await repo.checkoutBranch(branchName);
}

export async function push(): Promise<void> {
  const repo = getCurrentRepo();
  if (!repo) {
    throw new Error('Git not initialized');
  }
  await repo.push();
}

export async function pull(): Promise<void> {
  const repo = getCurrentRepo();
  if (!repo) {
    throw new Error('Git not initialized');
  }
  await repo.pull();
}

export async function fetch(): Promise<void> {
  const repo = getCurrentRepo();
  if (!repo) {
    throw new Error('Git not initialized');
  }
  await repo.fetch();
}

export async function checkoutCommit(hash: string): Promise<void> {
  const repo = getCurrentRepo();
  if (!repo) {
    throw new Error('Git not initialized');
  }
  await repo.checkoutCommit(hash);
}

export async function getFileDiff(filePath: string): Promise<string> {
  const repo = getCurrentRepo();
  if (!repo) {
    return '';
  }
  return await repo.getFileDiff(filePath);
}

export async function getFileContentAtCommit(filePath: string, commitHash: string): Promise<string> {
  const repo = getCurrentRepo();
  if (!repo) {
    return '';
  }
  return await repo.getFileContentAtCommit(filePath, commitHash);
}

export async function getFileDiffBetweenCommits(
  filePath: string,
  commitHash1: string,
  commitHash2: string
): Promise<string> {
  const repo = getCurrentRepo();
  if (!repo) {
    return '';
  }
  return await repo.getFileDiffBetweenCommits(filePath, commitHash1, commitHash2);
}

export async function getCommitDetails(commitHash: string): Promise<ChangedFile[]> {
  const repo = getCurrentRepo();
  if (!repo) {
    return [];
  }
  return await repo.getCommitDetails(commitHash);
}
