import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as gitManager from '../git-manager';
import simpleGit from 'simple-git';

// Mock simple-git
vi.mock('simple-git');

describe('Git Manager', () => {
  let mockGit: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockGit = {
      init: vi.fn().mockReturnThis(),
      add: vi.fn().mockReturnThis(),
      commit: vi.fn().mockReturnThis(),
      status: vi.fn().mockResolvedValue({ modified: [], staged: [], not_added: [] }),
      branchLocal: vi.fn().mockResolvedValue({ all: ['main'], current: 'main' }),
      checkout: vi.fn().mockReturnThis(),
      log: vi.fn().mockResolvedValue({ all: [] }),
      push: vi.fn().mockReturnThis(),
      pull: vi.fn().mockReturnThis(),
      fetch: vi.fn().mockReturnThis(),
      reset: vi.fn().mockReturnThis(),
      diff: vi.fn().mockResolvedValue(''),
      show: vi.fn().mockResolvedValue('')
    };
    (simpleGit as vi.Mock).mockReturnValue(mockGit);
  });

  it('should initialize git repo', () => {
    gitManager.initGit('/test/repo');
    // 检查 simpleGit 是否被调用，不严格检查路径格式（Windows 会使用反斜杠）
    expect(simpleGit).toHaveBeenCalled();
  });

  it('should check if git is initialized', () => {
    // 由于模块级变量的原因，我们先初始化再重置
    gitManager.initGit('/test/repo');
    // 这里我们无法直接重置模块级变量，所以测试初始化后的状态
    expect(gitManager.isGitInitialized()).toBe(true);
  });

  it('should get git status', async () => {
    gitManager.initGit('/test/repo');
    const status = await gitManager.getGitStatus();
    expect(status).toEqual({ modified: [], staged: [], untracked: [] });
    expect(mockGit.status).toHaveBeenCalled();
  });

  it('should commit changes', async () => {
    gitManager.initGit('/test/repo');
    await gitManager.commit('Test commit');
    expect(mockGit.commit).toHaveBeenCalledWith('Test commit');
  });

  it('should get branches', async () => {
    gitManager.initGit('/test/repo');
    const branches = await gitManager.getGitBranches();
    expect(branches).toEqual([{ name: 'main', isCurrent: true }]);
    expect(mockGit.branchLocal).toHaveBeenCalled();
  });

  it('should checkout branch', async () => {
    gitManager.initGit('/test/repo');
    await gitManager.checkoutBranch('feature');
    expect(mockGit.checkout).toHaveBeenCalledWith('feature');
  });

  it('should get commit history', async () => {
    gitManager.initGit('/test/repo');
    const history = await gitManager.getGitLog();
    expect(history).toEqual([]);
    expect(mockGit.log).toHaveBeenCalled();
  });

  it('should push changes', async () => {
    gitManager.initGit('/test/repo');
    await gitManager.push();
    expect(mockGit.push).toHaveBeenCalled();
  });

  it('should pull changes', async () => {
    gitManager.initGit('/test/repo');
    await gitManager.pull();
    expect(mockGit.pull).toHaveBeenCalled();
  });

  it('should handle git errors', async () => {
    gitManager.initGit('/test/repo');
    mockGit.status.mockRejectedValue(new Error('Git error'));
    const status = await gitManager.getGitStatus();
    expect(status).toEqual({ modified: [], staged: [], untracked: [] });
  });

  it('should stage file', async () => {
    gitManager.initGit('/test/repo');
    await gitManager.stageFile('test.solarwire');
    expect(mockGit.add).toHaveBeenCalledWith('test.solarwire');
  });

  it('should unstage file', async () => {
    gitManager.initGit('/test/repo');
    await gitManager.unstageFile('test.solarwire');
    expect(mockGit.reset).toHaveBeenCalledWith(['HEAD', '--', 'test.solarwire']);
  });

  it('should stage all modified', async () => {
    gitManager.initGit('/test/repo');
    await gitManager.stageAllModified();
    expect(mockGit.add).toHaveBeenCalledWith('.');
  });

  it('should get current branch', async () => {
    gitManager.initGit('/test/repo');
    const branch = await gitManager.getCurrentBranch();
    expect(branch).toBe('main');
    expect(mockGit.branchLocal).toHaveBeenCalled();
  });

  it('should fetch changes', async () => {
    gitManager.initGit('/test/repo');
    await gitManager.fetch();
    expect(mockGit.fetch).toHaveBeenCalled();
  });

  it('should checkout commit', async () => {
    gitManager.initGit('/test/repo');
    await gitManager.checkoutCommit('abc1234'); // 7 characters
    expect(mockGit.checkout).toHaveBeenCalledWith('abc1234');
  });

  it('should get file diff', async () => {
    gitManager.initGit('/test/repo');
    mockGit.diff.mockResolvedValue('diff content');
    const diff = await gitManager.getFileDiff('test.solarwire');
    expect(diff).toBe('diff content');
    expect(mockGit.diff).toHaveBeenCalled();
  });

  it('should get file content at commit', async () => {
    gitManager.initGit('/test/repo');
    mockGit.show.mockResolvedValue('file content');
    const content = await gitManager.getFileContentAtCommit('test.solarwire', 'abc1234'); // 7 characters
    expect(content).toBe('file content');
    expect(mockGit.show).toHaveBeenCalled();
  });

  it('should get file diff between commits', async () => {
    gitManager.initGit('/test/repo');
    mockGit.diff.mockResolvedValue('diff content');
    const diff = await gitManager.getFileDiffBetweenCommits('test.solarwire', 'abc1234', 'def5678'); // 7 characters each
    expect(diff).toBe('diff content');
    expect(mockGit.diff).toHaveBeenCalled();
  });

  it('should throw error when git not initialized', async () => {
    // 确保没有初始化 git
    // 我们需要重新导入模块来重置模块级变量
    vi.resetModules();
    const { stageFile, unstageFile, stageAllModified, commit, checkoutBranch, push, pull, fetch, checkoutCommit } = await import('../git-manager');
    
    await expect(stageFile('test.solarwire')).rejects.toThrow('Git not initialized');
    await expect(unstageFile('test.solarwire')).rejects.toThrow('Git not initialized');
    await expect(stageAllModified()).rejects.toThrow('Git not initialized');
    await expect(commit('Test commit')).rejects.toThrow('Git not initialized');
    await expect(checkoutBranch('feature')).rejects.toThrow('Git not initialized');
    await expect(push()).rejects.toThrow('Git not initialized');
    await expect(pull()).rejects.toThrow('Git not initialized');
    await expect(fetch()).rejects.toThrow('Git not initialized');
    await expect(checkoutCommit('abc1234')).rejects.toThrow('Git not initialized');
  });

  it('should return empty results when git not initialized', async () => {
    // 确保没有初始化 git
    vi.resetModules();
    const { getGitStatus, getGitLog, getGitBranches, getCurrentBranch, getFileDiff, getFileContentAtCommit, getFileDiffBetweenCommits } = await import('../git-manager');
    
    const status = await getGitStatus();
    const log = await getGitLog();
    const branches = await getGitBranches();
    const currentBranch = await getCurrentBranch();
    const fileDiff = await getFileDiff('test.solarwire');
    const fileContent = await getFileContentAtCommit('test.solarwire', 'abc1234');
    const diffBetweenCommits = await getFileDiffBetweenCommits('test.solarwire', 'abc1234', 'def5678');
    
    expect(status).toEqual({ modified: [], staged: [], untracked: [] });
    expect(log).toEqual([]);
    expect(branches).toEqual([]);
    expect(currentBranch).toBe('');
    expect(fileDiff).toBe('');
    expect(fileContent).toBe('');
    expect(diffBetweenCommits).toBe('');
  });

  it('should handle validation errors', async () => {
    gitManager.initGit('/test/repo');
    
    // Test invalid file path
    await expect(gitManager.stageFile('../test.solarwire')).rejects.toThrow('Invalid file path: ../test.solarwire');
    
    // Test invalid branch name
    await expect(gitManager.checkoutBranch('branch;rm -rf /')).rejects.toThrow('Invalid branch name: branch;rm -rf /');
    
    // Test invalid commit hash
    await expect(gitManager.checkoutCommit('invalid')).rejects.toThrow('Invalid commit hash format: invalid');
    
    // Test empty commit message
    await expect(gitManager.commit('')).rejects.toThrow('Commit message cannot be empty');
  });
});
