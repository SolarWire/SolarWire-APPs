/**
 * useVersionHistory Hook 测试 - 验证依赖注入模式
 * 
 * 注意：此 Hook 现在接受 GitApi 参数而不是直接依赖 Store
 * 测试重点验证依赖注入是否正常工作
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useVersionHistory } from '../../src/shared/hooks/useVersionHistory';
import { vi, describe, test, expect, beforeEach } from 'vitest';

const createMockGitApi = () => ({
  getLog: vi.fn(() => Promise.resolve([
    { hash: 'abc123', shortHash: 'abc', date: '2024-01-01', message: 'test', authorName: 'test' }
  ])),
  getFileContentAtCommit: vi.fn(() => Promise.resolve('')),
  isInitialized: true
});

type MockGitApi = ReturnType<typeof createMockGitApi>;

describe('useVersionHistory - 依赖注入模式', () => {
  let mockGitApi: MockGitApi;

  beforeEach(() => {
    mockGitApi = createMockGitApi();
    vi.clearAllMocks();
  });

  test('should accept gitApi parameter with getLog method', () => {
    const { result } = renderHook(() => useVersionHistory('test.solarwire', undefined, mockGitApi));
    
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.error).toBeNull();
    expect(result.current.matchingCommits).toEqual([]);
  });

  test('should show error when git is not initialized', async () => {
    const uninitGitApi = { ...mockGitApi, isInitialized: false };
    
    const { result } = renderHook(() => 
      useVersionHistory('test.solarwire', undefined, uninitGitApi)
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Git 仓库未初始化');
      expect(result.current.suggestion).toBe('请先打开一个包含 Git 仓库的文件夹');
    });
  });

  test('should show error when !title is missing in markdown snippet', async () => {
    const snippet = { code: 'rectangle @(100,100)', snippetIndex: 0 };
    
    const { result } = renderHook(() => 
      useVersionHistory('test.md', snippet, mockGitApi)
    );

    await waitFor(() => {
      expect(result.current.error).toContain('缺少 !title 标识');
      expect(result.current.suggestion).toContain('!title=xxx');
    });
  });

  test('should call getGitLog from injected gitApi', async () => {
    mockGitApi.getLog.mockResolvedValue([
      { hash: 'abc123', shortHash: 'abc', date: '2024-01-01', message: 'test', authorName: 'test' }
    ]);

    const { result } = renderHook(() => 
      useVersionHistory('test.solarwire', undefined, mockGitApi)
    );

    await waitFor(() => {
      expect(mockGitApi.getLog).toHaveBeenCalled();
    });
  });

  test('should provide cancelAnalysis function', () => {
    const { result } = renderHook(() => 
      useVersionHistory('test.solarwire', undefined, mockGitApi)
    );

    expect(typeof result.current.cancelAnalysis).toBe('function');
  });

  test('should handle empty commit history', async () => {
    mockGitApi.getLog.mockResolvedValue([]);

    const { result } = renderHook(() => 
      useVersionHistory('test.solarwire', undefined, mockGitApi)
    );

    await waitFor(() => {
      expect(result.current.error).toBe('没有找到提交历史');
    });
  });
});
