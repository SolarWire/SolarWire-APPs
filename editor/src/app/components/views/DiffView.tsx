/**
 * DiffView 组件 - 使用 @git-diff-view/react 显示两个版本之间的差异
 */
import React, { useState, useEffect } from 'react';
import { DiffView as GitDiffView, DiffModeEnum } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view.css';
import { Scrollbar } from '../ui/Scrollbar';
import './DiffView.css';

interface DiffViewProps {
  /**
   * 文件路径
   */
  filePath: string;
  
  /**
   * 旧版本 commit hash
   */
  oldCommit: string;
  
  /**
   * 新版本 commit hash
   */
  newCommit: string;
  
  /**
   * 关闭回调
   */
  onClose?: () => void;
}

interface DiffData {
  oldFile: {
    fileName: string;
    content: string;
  };
  newFile: {
    fileName: string;
    content: string;
  };
  hunks: string[];
}

/**
 * DiffView 组件
 */
export function DiffView({ filePath, oldCommit, newCommit, onClose }: DiffViewProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const loadDiff = async () => {
      setLoading(true);
      try {
        // 获取旧版本文件内容
        const oldContent = await window.api.git.getFileContentAtCommit(filePath, oldCommit);
        
        // 获取新版本文件内容
        const newContent = await window.api.git.getFileContentAtCommit(filePath, newCommit);
        
        // 获取 diff hunks
        const diff = await window.api.git.getFileDiffBetweenCommits(filePath, oldCommit, newCommit);
        const hunks = parseDiffHunks(diff);
        
        setDiffData({
          oldFile: {
            fileName: filePath,
            content: oldContent || ''
          },
          newFile: {
            fileName: filePath,
            content: newContent || ''
          },
          hunks
        });
      } catch (error) {
        console.error('Failed to load diff:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDiff();
  }, [filePath, oldCommit, newCommit]);

  // 检测主题
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  function parseDiffHunks(diff: string): string[] {
    // 解析 git diff 输出，提取 hunks
    const hunkRegex = /@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/g;
    const matches = diff.match(hunkRegex);
    
    if (!matches) {
      return [];
    }

    const hunks: string[] = [];
    let currentIndex = 0;
    
    for (const match of matches) {
      const hunkStart = diff.indexOf(match, currentIndex);
      const nextHunkStart = diff.indexOf('@@', hunkStart + 2);
      
      if (nextHunkStart !== -1) {
        hunks.push(diff.substring(hunkStart, nextHunkStart));
        currentIndex = nextHunkStart;
      } else {
        hunks.push(diff.substring(hunkStart));
        break;
      }
    }
    
    return hunks;
  }

  if (loading) {
    return (
      <Scrollbar className="diff-view-scrollbar">
        <div className="diff-view">
          <div className="diff-loading">
            <div className="loading-spinner"></div>
            <div>加载版本对比...</div>
          </div>
        </div>
      </Scrollbar>
    );
  }

  if (!diffData) {
    return (
      <Scrollbar className="diff-view-scrollbar">
        <div className="diff-view">
          <div className="no-changes">
            无法加载差异信息
          </div>
        </div>
      </Scrollbar>
    );
  }

  return (
    <Scrollbar className="diff-view-scrollbar">
      <div className="diff-view">
        <div className="diff-header">
          <div className="diff-title">
            <span className="file-path">{filePath}</span>
            <span className="commit-range">
              {oldCommit.substring(0, 7)} → {newCommit.substring(0, 7)}
            </span>
          </div>
          {onClose && (
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <div className="diff-content-wrapper">
          <GitDiffView
            data={diffData}
            diffViewMode={DiffModeEnum.Split}
            diffViewTheme={theme}
            diffViewHighlight={true}
            diffViewWrap={true}
          />
        </div>
      </div>
    </Scrollbar>
  );
}

export default DiffView;
