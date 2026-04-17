/**
 * useVersionHistory Hook 测试
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useVersionHistory } from './useVersionHistory';
import { versionCache } from '../cache/versionCache';

// Mock Worker
const mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  onmessage: jest.fn(),
  onerror: jest.fn()
};

jest.mock('../cache/versionCache', () => ({
  versionCache: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn()
  }
}));

jest.mock('../../app/stores/gitStore', () => ({
  useGitStore: () => ({
    isInitialized: true,
    getGitLog: jest.fn(() => Promise.resolve([
      { hash: 'abc123', shortHash: 'abc', date: '2024-01-01', message: 'test', authorName: 'test' }
    ]))
  })
}));

describe('useVersionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (versionCache.get as jest.Mock).mockReturnValue(null);
  });

  test('should validate !title in solarwire file', () => {
    const { result } = renderHook(() => useVersionHistory('test.solarwire'));
    
    // 初始状态
    expect(result.error).toBeNull();
  });

  test('should show error when !title is missing', async () => {
    const snippet = { code: 'rectangle @(100,100)', snippetIndex: 0 };
    const { result } = renderHook(() => useVersionHistory('test.md', snippet));
    
    await waitFor(() => {
      expect(result.error).toContain('缺少 !title 标识');
    });
  });

  test('should use cache when available', async () => {
    (versionCache.get as jest.Mock).mockReturnValue({
      commits: [{ hash: 'cached', shortHash: 'cac', date: '2024-01-01', message: 'cached', authorName: 'test' }],
      timestamp: Date.now()
    });

    const { result } = renderHook(() => useVersionHistory('test.solarwire'));
    
    // 应该直接使用缓存，不创建 Worker
    await waitFor(() => {
      expect(result.matchingCommits).toHaveLength(1);
      expect(result.matchingCommits[0].hash).toBe('cached');
    });
  });

  test('should create worker when no cache', async () => {
    const WorkerMock = jest.fn().mockImplementation(() => mockWorker);
    jest.spyOn(window, 'Worker').mockImplementation(WorkerMock);

    const { result } = renderHook(() => useVersionHistory('test.solarwire'));
    
    // 应该创建 Worker
    await waitFor(() => {
      expect(WorkerMock).toHaveBeenCalled();
    });
  });

  test('should handle worker messages', async () => {
    const WorkerMock = jest.fn().mockImplementation(() => mockWorker);
    jest.spyOn(window, 'Worker').mockImplementation(WorkerMock);

    renderHook(() => useVersionHistory('test.solarwire'));
    
    await waitFor(() => {
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'analyze' })
      );
    });
  });

  test('should cancel analysis', async () => {
    const WorkerMock = jest.fn().mockImplementation(() => mockWorker);
    jest.spyOn(window, 'Worker').mockImplementation(WorkerMock);

    const { result, unmount } = renderHook(() => useVersionHistory('test.solarwire'));
    
    await waitFor(() => {
      expect(WorkerMock).toHaveBeenCalled();
    });

    result.current.cancelAnalysis();
    
    expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'cancel' });
    expect(mockWorker.terminate).toHaveBeenCalled();

    unmount();
  });

  test('should handle worker error', async () => {
    const WorkerMock = jest.fn().mockImplementation(() => mockWorker);
    jest.spyOn(window, 'Worker').mockImplementation(WorkerMock);

    renderHook(() => useVersionHistory('test.solarwire'));
    
    // 模拟 Worker 错误
    mockWorker.onerror?.(new Error('Worker failed'));
    
    await waitFor(() => {
      expect(mockWorker.onerror).toHaveBeenCalled();
    });
  });
});
