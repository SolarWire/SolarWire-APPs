/**
 * VersionView 组件测试
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { VersionView } from './VersionView';

// Mock useVersionHistory Hook
jest.mock('../../shared/hooks/useVersionHistory', () => ({
  useVersionHistory: jest.fn()
}));

const mockUseVersionHistory = jest.mocked(require('../../shared/hooks/useVersionHistory').useVersionHistory);

describe('VersionView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should show error state', () => {
    mockUseVersionHistory.mockReturnValue({
      analysisProgress: null,
      matchingCommits: [],
      error: '该代码块缺少 !title 标识',
      suggestion: '请在代码块第一行添加 !title=xxx',
      cancelAnalysis: jest.fn(),
      isLoading: false
    });

    render(<VersionView filePath="test.md" snippet={{ code: 'test', snippetIndex: 0 }} />);
    
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('该代码块缺少 !title 标识')).toBeInTheDocument();
    expect(screen.getByText(/请在代码块第一行添加 !title=xxx/)).toBeInTheDocument();
  });

  test('should show loading state', () => {
    mockUseVersionHistory.mockReturnValue({
      analysisProgress: {
        total: 50,
        processed: 15,
        currentCommit: 'abc123',
        matchingCommits: [],
        status: 'running'
      },
      matchingCommits: [],
      error: null,
      suggestion: null,
      cancelAnalysis: jest.fn(),
      isLoading: true
    });

    render(<VersionView filePath="test.md" />);
    
    expect(screen.getByText(/正在分析 15\/50 个提交/)).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  test('should show empty state', () => {
    mockUseVersionHistory.mockReturnValue({
      analysisProgress: null,
      matchingCommits: [],
      error: null,
      suggestion: null,
      cancelAnalysis: jest.fn(),
      isLoading: false
    });

    render(<VersionView filePath="test.md" />);
    
    expect(screen.getByText('未找到相关版本历史记录')).toBeInTheDocument();
    expect(screen.getByText('💡 提示：')).toBeInTheDocument();
  });

  test('should show commit list', () => {
    mockUseVersionHistory.mockReturnValue({
      analysisProgress: null,
      matchingCommits: [
        { hash: 'abc123', shortHash: 'abc', date: '2024-01-01', message: 'Initial commit', authorName: 'Test User' }
      ],
      error: null,
      suggestion: null,
      cancelAnalysis: jest.fn(),
      isLoading: false
    });

    render(<VersionView filePath="test.md" />);
    
    expect(screen.getByText('✓ 找到 1 个相关版本')).toBeInTheDocument();
    expect(screen.getByText('abc')).toBeInTheDocument();
    expect(screen.getByText('Initial commit')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  test('should show snippet info when provided', () => {
    mockUseVersionHistory.mockReturnValue({
      analysisProgress: null,
      matchingCommits: [],
      error: null,
      suggestion: null,
      cancelAnalysis: jest.fn(),
      isLoading: false
    });

    render(<VersionView filePath="test.md" snippet={{ code: 'test', snippetIndex: 2 }} />);
    
    expect(screen.getByText('代码块 #2')).toBeInTheDocument();
  });

  test('should call cancelAnalysis when cancel button clicked', () => {
    const mockCancel = jest.fn();
    mockUseVersionHistory.mockReturnValue({
      analysisProgress: {
        total: 50,
        processed: 15,
        currentCommit: 'abc123',
        matchingCommits: [],
        status: 'running'
      },
      matchingCommits: [],
      error: null,
      suggestion: null,
      cancelAnalysis: mockCancel,
      isLoading: true
    });

    render(<VersionView filePath="test.md" />);
    
    const cancelButton = screen.getByText('取消');
    cancelButton.click();
    
    expect(mockCancel).toHaveBeenCalled();
  });
});
