import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
import * as path from 'path';

interface GitStatus {
  modified: string[];
  staged: string[];
  untracked: string[];
}

interface GitCommit {
  hash: string;
  shortHash: string;
  date: string;
  message: string;
  authorName: string;
}

interface GitBranch {
  name: string;
  isCurrent: boolean;
}

let gitInstance: SimpleGit | null = null;
let currentRepoPath: string | null = null;

export function initGit(repoPath: string): void {
  const options: Partial<SimpleGitOptions> = {
    baseDir: repoPath,
    binary: 'git',
    maxConcurrentProcesses: 6,
  };
  gitInstance = simpleGit(options);
  currentRepoPath = repoPath;
}

export function isGitInitialized(): boolean {
  return gitInstance !== null;
}

export async function getGitStatus(): Promise<GitStatus> {
  if (!gitInstance) {
    return { modified: [], staged: [], untracked: [] };
  }

  try {
    const status = await gitInstance.status();
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

export async function getGitLog(filePath?: string): Promise<GitCommit[]> {
  if (!gitInstance) {
    return [];
  }

  try {
    const options = filePath ? { file: filePath } : undefined;
    const log = await gitInstance.log(options);
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

export async function getGitBranches(): Promise<GitBranch[]> {
  if (!gitInstance) {
    return [];
  }

  try {
    const branches = await gitInstance.branchLocal();
    return branches.all.map((name) => ({
      name,
      isCurrent: name === branches.current,
    }));
  } catch (error) {
    console.error('Failed to get git branches:', error);
    return [];
  }
}

export async function getCurrentBranch(): Promise<string> {
  if (!gitInstance) {
    return '';
  }

  try {
    const branches = await gitInstance.branchLocal();
    return branches.current;
  } catch (error) {
    console.error('Failed to get current branch:', error);
    return '';
  }
}

export async function stageFile(filePath: string): Promise<void> {
  if (!gitInstance) {
    return;
  }

  try {
    await gitInstance.add(filePath);
  } catch (error) {
    console.error('Failed to stage file:', error);
    throw error;
  }
}

export async function unstageFile(filePath: string): Promise<void> {
  if (!gitInstance) {
    return;
  }

  try {
    await gitInstance.reset(['HEAD', '--', filePath]);
  } catch (error) {
    console.error('Failed to unstage file:', error);
    throw error;
  }
}

export async function stageAllModified(): Promise<void> {
  if (!gitInstance) {
    return;
  }

  try {
    // 暂存所有已修改和未跟踪的文件
    await gitInstance.add('.');
  } catch (error) {
    console.error('Failed to stage all modified files:', error);
    throw error;
  }
}

export async function commit(message: string): Promise<void> {
  if (!gitInstance) {
    return;
  }

  try {
    await gitInstance.commit(message);
  } catch (error) {
    console.error('Failed to commit:', error);
    throw error;
  }
}

export async function checkoutBranch(branchName: string): Promise<void> {
  if (!gitInstance) {
    return;
  }

  try {
    await gitInstance.checkout(branchName);
  } catch (error) {
    console.error('Failed to checkout branch:', error);
    throw error;
  }
}

export async function push(): Promise<void> {
  if (!gitInstance) {
    return;
  }

  try {
    await gitInstance.push();
  } catch (error) {
    console.error('Failed to push:', error);
    throw error;
  }
}

export async function pull(): Promise<void> {
  if (!gitInstance) {
    return;
  }

  try {
    await gitInstance.pull();
  } catch (error) {
    console.error('Failed to pull:', error);
    throw error;
  }
}

export async function fetch(): Promise<void> {
  if (!gitInstance) {
    return;
  }

  try {
    await gitInstance.fetch();
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}

export async function checkoutCommit(hash: string): Promise<void> {
  if (!gitInstance) {
    return;
  }

  try {
    await gitInstance.checkout(hash);
  } catch (error) {
    console.error('Failed to checkout commit:', error);
    throw error;
  }
}

export async function getFileDiff(filePath: string): Promise<string> {
  if (!gitInstance) {
    return '';
  }

  try {
    const diff = await gitInstance.diff(['HEAD', '--', filePath]);
    return diff;
  } catch (error) {
    console.error('Failed to get file diff:', error);
    return '';
  }
}

export async function getFileContentAtCommit(filePath: string, commitHash: string): Promise<string> {
  if (!gitInstance) {
    return '';
  }

  try {
    const content = await gitInstance.show([`${commitHash}:${filePath}`]);
    return content;
  } catch (error) {
    console.error('Failed to get file content at commit:', error);
    return '';
  }
}

export async function getFileDiffBetweenCommits(filePath: string, commitHash1: string, commitHash2: string): Promise<string> {
  if (!gitInstance) {
    return '';
  }

  try {
    const diff = await gitInstance.diff([`${commitHash1}..${commitHash2}`, '--', filePath]);
    return diff;
  } catch (error) {
    console.error('Failed to get file diff between commits:', error);
    return '';
  }
}
