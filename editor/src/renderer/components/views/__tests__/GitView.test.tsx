import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GitView from '../GitView';
import { useGitStore } from '../../../stores/gitStore';

vi.mock('../../../stores/gitStore');

describe('GitView', () => {
  const mockStageAllModified = vi.fn();
  const mockCommit = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useGitStore as any).mockReturnValue({
      isInitialized: true,
      status: { modified: ['file1.txt'], staged: [], untracked: [] },
      log: [{ hash: 'abc123', shortHash: 'abc1234', message: 'Test commit', date: '2024-01-01', authorName: 'Test' }],
      currentBranch: 'main',
      loading: false,
      error: null,
      stageAllModified: mockStageAllModified,
      commit: mockCommit,
      clearError: mockClearError
    });
  });

  it('should display modified files', () => {
    render(<GitView />);
    
    expect(screen.getByText('file1.txt')).toBeInTheDocument();
  });

  it('should display commit form', () => {
    render(<GitView />);
    
    expect(screen.getByPlaceholderText(/Enter commit message.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Commit/i })).toBeInTheDocument();
  });

  it('should call commit when form submitted', async () => {
    mockStageAllModified.mockResolvedValue(undefined);
    mockCommit.mockResolvedValue(undefined);
    
    render(<GitView />);
    
    const input = screen.getByPlaceholderText(/Enter commit message.../i);
    const button = screen.getByRole('button', { name: /Commit/i });
    
    fireEvent.change(input, { target: { value: 'New commit' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockStageAllModified).toHaveBeenCalled();
      expect(mockCommit).toHaveBeenCalledWith('New commit');
    });
  });

  it('should show error banner when git operation fails', () => {
    (useGitStore as any).mockReturnValue({
      isInitialized: true,
      status: { modified: [], staged: [], untracked: [] },
      log: [],
      currentBranch: 'main',
      loading: false,
      error: 'Merge conflict detected',
      stageAllModified: mockStageAllModified,
      commit: mockCommit,
      clearError: mockClearError
    });
    
    render(<GitView />);
    
    expect(screen.getByText(/Merge conflict detected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument();
  });

  it('should clear error on dismiss click', () => {
    (useGitStore as any).mockReturnValue({
      isInitialized: true,
      status: { modified: [], staged: [], untracked: [] },
      log: [],
      currentBranch: 'main',
      loading: false,
      error: 'Some error',
      stageAllModified: mockStageAllModified,
      commit: mockCommit,
      clearError: mockClearError
    });
    
    render(<GitView />);
    
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    expect(mockClearError).toHaveBeenCalled();
  });

  it('should show empty state when no changes', () => {
    (useGitStore as any).mockReturnValue({
      isInitialized: true,
      status: { modified: [], staged: [], untracked: [] },
      log: [],
      currentBranch: 'main',
      loading: false,
      error: null,
      stageAllModified: mockStageAllModified,
      commit: mockCommit,
      clearError: mockClearError
    });
    
    render(<GitView />);
    
    expect(screen.getByText(/No modified files/i)).toBeInTheDocument();
  });

  it('should show uninitialized state when not initialized', () => {
    (useGitStore as any).mockReturnValue({
      isInitialized: false,
      status: { modified: [], staged: [], untracked: [] },
      log: [],
      currentBranch: 'main',
      loading: false,
      error: null,
      stageAllModified: mockStageAllModified,
      commit: mockCommit,
      clearError: mockClearError
    });
    
    render(<GitView />);
    
    expect(screen.getByText(/Open a folder first to use Git/i)).toBeInTheDocument();
  });
});
