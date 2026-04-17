/**
 * CommitDetail 组件 - 显示提交详情
 * 包括修改的文件列表、统计信息、提交详情等
 */
import React, { useState, useEffect } from 'react';
import { GitCommit, ChangedFile } from '../../../shared/types/git';
import { Scrollbar } from '../ui/Scrollbar';
import './CommitDetail.css';

interface CommitDetailProps {
  commit: GitCommit;
  onClose?: () => void;
  currentFilePath?: string;
  showCheckout?: boolean;
}

export function CommitDetail({ commit, onClose, currentFilePath, showCheckout = false }: CommitDetailProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [fileStats, setFileStats] = useState<ChangedFile[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (commit.changedFiles) {
      setFileStats(commit.changedFiles);
      return;
    }

    const loadCommitDetails = async () => {
      setLoading(true);
      try {
        const stats = await (window as any).api?.git?.getCommitDetails(commit.hash);
        setFileStats(stats || []);
      } catch (error) {
        console.error('Failed to load commit details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCommitDetails();
  }, [commit.hash, commit.changedFiles]);

  return (
    <Scrollbar className="commit-detail-scrollbar">
      <div className="commit-detail">
        <div className="commit-detail-header">
          <div className="commit-detail-title">
            <span className="commit-hash-large">{commit.shortHash}</span>
            <span className="commit-message-large">{commit.message}</span>
          </div>
          {onClose && (
            <button className="close-button" onClick={onClose}>✕</button>
          )}
        </div>

        <div className="commit-meta">
          <div className="meta-item">
            <span className="meta-label">Author:</span>
            <span className="meta-value">{commit.authorName}</span>
            {commit.authorEmail && <span className="meta-email">&lt;{commit.authorEmail}&gt;</span>}
          </div>
          <div className="meta-item">
            <span className="meta-label">Date:</span>
            <span className="meta-value">{new Date(commit.date).toLocaleString()}</span>
          </div>
        </div>

        {commit.stats && (
          <div className="commit-stats">
            <div className="stat-item">
              <span className="stat-label">Files:</span>
              <span className="stat-value">{commit.stats.files}</span>
            </div>
            <div className="stat-item additions">
              <span className="stat-label">+{commit.stats.additions}</span>
            </div>
            <div className="stat-item deletions">
              <span className="stat-label">-{commit.stats.deletions}</span>
            </div>
          </div>
        )}

        <div className="commit-files">
          <div className="files-header">
            <span className="files-title">Changed Files</span>
            {loading && <span className="loading-indicator">Loading...</span>}
          </div>
          
          {fileStats.length > 0 ? (
            <div className="files-list">
              {fileStats.map((file, index) => (
                <FileItem key={index} file={file} isCurrentFile={file.path === currentFilePath} />
              ))}
            </div>
          ) : (
            !loading && <div className="no-files">No files changed or unable to load file list</div>
          )}
        </div>

        {showCheckout && (
          <div className="commit-checkout">
            <button
              className="checkout-button"
              onClick={async () => {
                setCheckoutLoading(true);
                try {
                  await (window as any).api?.git?.checkoutCommit(commit.hash);
                  alert(`已成功切换到版本 ${commit.shortHash}`);
                  onClose?.();
                } catch (error: any) {
                  alert(`切换版本失败：${error.message}`);
                } finally {
                  setCheckoutLoading(false);
                }
              }}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? '切换中...' : '切换到此版本'}
            </button>
          </div>
        )}
      </div>
    </Scrollbar>
  );
}

function FileItem({ file, isCurrentFile }: { file: ChangedFile; isCurrentFile: boolean }): JSX.Element {
  const typeIcon = { added: '+', deleted: '-', modified: 'M', renamed: 'R' }[file.type];
  const typeClass = { added: 'file-added', deleted: 'file-deleted', modified: 'file-modified', renamed: 'file-renamed' }[file.type];

  return (
    <div className={`file-item ${typeClass} ${isCurrentFile ? 'current-file' : ''}`}>
      <span className="file-type-badge">{typeIcon}</span>
      <span className="file-path">{file.path}</span>
      {(file.additions !== undefined || file.deletions !== undefined) && (
        <span className="file-stats">
          {file.additions !== undefined && <span className="additions">+{file.additions}</span>}
          {file.deletions !== undefined && <span className="deletions">-{file.deletions}</span>}
        </span>
      )}
    </div>
  );
}

export default CommitDetail;
