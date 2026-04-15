import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as electron from 'electron';
import * as fileHandlers from '../ipc/file-handlers';
import * as gitHandlers from '../ipc/git-handlers';
import * as dialogHandlers from '../ipc/dialog-handlers';
import * as fileManager from '../file-manager';
import * as gitManager from '../git-manager';

// Mock electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn()
  },
  dialog: {
    showOpenDialog: vi.fn().mockResolvedValue({ canceled: false, filePaths: [] }),
    showSaveDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: '' })
  }
}));

// Mock file-manager
vi.mock('../file-manager', () => ({
  readFile: vi.fn().mockResolvedValue('file content'),
  writeFile: vi.fn().mockResolvedValue(undefined),
  listFiles: vi.fn().mockResolvedValue(['file1.solarwire', 'file2.solarwire']),
  getFileTree: vi.fn().mockResolvedValue([]),
  collectSolarWireSnippets: vi.fn().mockResolvedValue([]),
  setAllowedRoot: vi.fn()
}));

// Mock git-manager
vi.mock('../git-manager', () => ({
  initGit: vi.fn(),
  isGitInitialized: vi.fn().mockReturnValue(true),
  getGitStatus: vi.fn().mockResolvedValue({ modified: [], staged: [], untracked: [] }),
  getGitLog: vi.fn().mockResolvedValue([]),
  getGitBranches: vi.fn().mockResolvedValue([]),
  getCurrentBranch: vi.fn().mockResolvedValue('main'),
  stageFile: vi.fn().mockResolvedValue(undefined),
  unstageFile: vi.fn().mockResolvedValue(undefined),
  stageAllModified: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue(undefined),
  checkoutBranch: vi.fn().mockResolvedValue(undefined),
  push: vi.fn().mockResolvedValue(undefined),
  pull: vi.fn().mockResolvedValue(undefined),
  fetch: vi.fn().mockResolvedValue(undefined),
  checkoutCommit: vi.fn().mockResolvedValue(undefined),
  getFileDiff: vi.fn().mockResolvedValue('diff content'),
  getFileContentAtCommit: vi.fn().mockResolvedValue('file content'),
  getFileDiffBetweenCommits: vi.fn().mockResolvedValue('diff content')
}));

const { ipcMain } = electron;

describe('IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Handlers', () => {
    it('should register file handlers', () => {
      fileHandlers.registerFileHandlers();
      expect(ipcMain.handle).toHaveBeenCalledWith('file:read', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('file:write', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('file:listDirectory', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('file:getFileTree', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('file:collectSolarWireSnippets', expect.any(Function));
    });

    it('should handle file:read', async () => {
      fileHandlers.registerFileHandlers();
      const readHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'file:read')?.[1];
      expect(readHandler).toBeDefined();
      const result = await readHandler(null, '/project/test.solarwire');
      expect(result).toBe('file content');
      expect(fileManager.readFile).toHaveBeenCalledWith('/project/test.solarwire');
    });

    it('should handle file:write', async () => {
      fileHandlers.registerFileHandlers();
      const writeHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'file:write')?.[1];
      expect(writeHandler).toBeDefined();
      const result = await writeHandler(null, '/project/test.solarwire', 'content');
      expect(result).toEqual({ success: true });
      expect(fileManager.writeFile).toHaveBeenCalledWith('/project/test.solarwire', 'content');
    });

    it('should handle file:listDirectory', async () => {
      fileHandlers.registerFileHandlers();
      const listHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'file:listDirectory')?.[1];
      expect(listHandler).toBeDefined();
      const result = await listHandler(null, '/project');
      expect(result).toEqual(['file1.solarwire', 'file2.solarwire']);
      expect(fileManager.listFiles).toHaveBeenCalledWith('/project');
    });

    it('should handle file:getFileTree', async () => {
      fileHandlers.registerFileHandlers();
      const treeHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'file:getFileTree')?.[1];
      expect(treeHandler).toBeDefined();
      const result = await treeHandler(null, '/project', 2);
      expect(result).toEqual([]);
      expect(fileManager.getFileTree).toHaveBeenCalledWith('/project', 2);
    });

    it('should handle file:collectSolarWireSnippets', async () => {
      fileHandlers.registerFileHandlers();
      const snippetsHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'file:collectSolarWireSnippets')?.[1];
      expect(snippetsHandler).toBeDefined();
      const result = await snippetsHandler(null, '/project');
      expect(result).toEqual([]);
      expect(fileManager.collectSolarWireSnippets).toHaveBeenCalledWith('/project');
    });
  });

  describe('Git Handlers', () => {
    it('should register git handlers', () => {
      gitHandlers.registerGitHandlers();
      expect(ipcMain.handle).toHaveBeenCalledWith('git:init', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:isInitialized', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:getStatus', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:getLog', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:getBranches', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:getCurrentBranch', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:stageFile', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:unstageFile', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:stageAllModified', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:commit', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:checkoutBranch', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:push', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:pull', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:fetch', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:checkoutCommit', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:getFileDiff', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:getFileContentAtCommit', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('git:getFileDiffBetweenCommits', expect.any(Function));
    });

    it('should handle git:init', async () => {
      gitHandlers.registerGitHandlers();
      const initHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:init')?.[1];
      expect(initHandler).toBeDefined();
      const result = await initHandler(null, '/project');
      expect(result).toEqual({ success: true });
      expect(gitManager.initGit).toHaveBeenCalledWith('/project');
    });

    it('should handle git:isInitialized', async () => {
      gitHandlers.registerGitHandlers();
      const isInitializedHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:isInitialized')?.[1];
      expect(isInitializedHandler).toBeDefined();
      const result = await isInitializedHandler(null);
      expect(result).toBe(true);
      expect(gitManager.isGitInitialized).toHaveBeenCalled();
    });

    it('should handle git:stageFile', async () => {
      gitHandlers.registerGitHandlers();
      const stageHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:stageFile')?.[1];
      expect(stageHandler).toBeDefined();
      const result = await stageHandler(null, 'test.solarwire');
      expect(result).toEqual({ success: true });
      expect(gitManager.stageFile).toHaveBeenCalledWith('test.solarwire');
    });

    it('should handle git:commit', async () => {
      gitHandlers.registerGitHandlers();
      const commitHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:commit')?.[1];
      expect(commitHandler).toBeDefined();
      const result = await commitHandler(null, 'Test commit');
      expect(result).toEqual({ success: true });
      expect(gitManager.commit).toHaveBeenCalledWith('Test commit');
    });

    it('should handle git:checkoutBranch', async () => {
      gitHandlers.registerGitHandlers();
      const checkoutHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:checkoutBranch')?.[1];
      expect(checkoutHandler).toBeDefined();
      const result = await checkoutHandler(null, 'feature');
      expect(result).toEqual({ success: true });
      expect(gitManager.checkoutBranch).toHaveBeenCalledWith('feature');
    });

    it('should handle git:checkoutCommit', async () => {
      gitHandlers.registerGitHandlers();
      const checkoutHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:checkoutCommit')?.[1];
      expect(checkoutHandler).toBeDefined();
      const result = await checkoutHandler(null, 'abc1234');
      expect(result).toEqual({ success: true });
      expect(gitManager.checkoutCommit).toHaveBeenCalledWith('abc1234');
    });

    it('should handle git:getFileDiff', async () => {
      gitHandlers.registerGitHandlers();
      const diffHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:getFileDiff')?.[1];
      expect(diffHandler).toBeDefined();
      const result = await diffHandler(null, 'test.solarwire');
      expect(result).toBe('diff content');
      expect(gitManager.getFileDiff).toHaveBeenCalledWith('test.solarwire');
    });

    it('should handle git validation errors', async () => {
      gitHandlers.registerGitHandlers();
      
      // Test git:init with invalid path
      const initHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:init')?.[1];
      expect(initHandler).toBeDefined();
      await expect(initHandler(null, '')).rejects.toThrow('Invalid repository path');
      
      // Test git:stageFile with invalid path
      const stageHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:stageFile')?.[1];
      expect(stageHandler).toBeDefined();
      await expect(stageHandler(null, '../test.solarwire')).rejects.toThrow('Invalid file path: contains ".."');
      
      // Test git:commit with empty message
      const commitHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:commit')?.[1];
      expect(commitHandler).toBeDefined();
      await expect(commitHandler(null, '')).rejects.toThrow('Commit message cannot be empty');
      
      // Test git:checkoutBranch with empty name
      const checkoutHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:checkoutBranch')?.[1];
      expect(checkoutHandler).toBeDefined();
      await expect(checkoutHandler(null, '')).rejects.toThrow('Invalid branch name');
      
      // Test git:checkoutCommit with invalid hash
      const checkoutCommitHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'git:checkoutCommit')?.[1];
      expect(checkoutCommitHandler).toBeDefined();
      await expect(checkoutCommitHandler(null, 'invalid')).rejects.toThrow('Invalid commit hash format: invalid');
    });
  });

  describe('Dialog Handlers', () => {
    it('should register dialog handlers', () => {
      dialogHandlers.registerDialogHandlers();
      expect(ipcMain.handle).toHaveBeenCalledWith('dialog:openFile', expect.any(Function));
    });

    it('should handle dialog:openFile', async () => {
      dialogHandlers.registerDialogHandlers();
      const openHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'dialog:openFile')?.[1];
      expect(openHandler).toBeDefined();
      const result = await openHandler(null);
      expect(result).toEqual([]);
      expect(fileManager.setAllowedRoot).not.toHaveBeenCalled();
    });

    it('should handle dialog:openFile with directory selection', async () => {
      const { dialog } = electron;
      (dialog.showOpenDialog as vi.Mock).mockResolvedValue({ canceled: false, filePaths: ['/selected/dir'] });
      
      dialogHandlers.registerDialogHandlers();
      const openHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'dialog:openFile')?.[1];
      expect(openHandler).toBeDefined();
      const result = await openHandler(null);
      expect(result).toEqual(['/selected/dir']);
      expect(fileManager.setAllowedRoot).toHaveBeenCalledWith('/selected/dir');
    });

    it('should handle dialog:openFile with canceled selection', async () => {
      const { dialog } = electron;
      (dialog.showOpenDialog as vi.Mock).mockResolvedValue({ canceled: true, filePaths: [] });
      
      dialogHandlers.registerDialogHandlers();
      const openHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'dialog:openFile')?.[1];
      expect(openHandler).toBeDefined();
      const result = await openHandler(null);
      expect(result).toEqual([]);
      expect(fileManager.setAllowedRoot).not.toHaveBeenCalled();
    });
  });
});
