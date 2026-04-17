import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { GitCommit, GitBranch } from '../../../shared/types/git';
import './GitGraph.css';

interface GitGraphProps {
  commits: GitCommit[];
  currentBranch?: string;
  branches?: GitBranch[];
  onSelectCommit?: (commit: GitCommit) => void;
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 1) return '刚刚';
      return `${diffMinutes} 分钟前`;
    }
    return `${diffHours} 小时前`;
  }
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  return formatFullDate(dateStr);
}

const BRANCH_COLORS = ['#58a6ff', '#3fb950', '#f778ba', '#d2a8ff', '#79c0ff', '#ffa657'];

interface HoverInfo {
  commit: GitCommit;
  rect: DOMRect;
}

export function GitGraph({ commits, currentBranch = 'main', branches = [], onSelectCommit }: GitGraphProps): React.ReactElement {
  if (commits.length === 0) {
    return <div className="git-graph-empty">暂无提交历史</div>;
  }

  const branchColorMap = useMemo(() => {
    const map = new Map<string, string>();
    map.set(currentBranch, BRANCH_COLORS[0]);
    branches.forEach((b, i) => {
      if (!map.has(b.name)) {
        map.set(b.name, BRANCH_COLORS[(i + 1) % BRANCH_COLORS.length]);
      }
    });
    return map;
  }, [currentBranch, branches]);

  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelLeave = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const triggerLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setHoverInfo(null);
      setTooltipPos(null);
    }, 350);
  }, []);

  const handleMouseEnter = useCallback((commit: GitCommit) => {
    cancelLeave();
    const rowEl = rowRefs.current.get(commit.hash);
    if (rowEl) {
      const rect = rowEl.getBoundingClientRect();
      setHoverInfo({ commit, rect });
    }
  }, [cancelLeave]);

  const handleMouseLeave = useCallback(() => {
    triggerLeave();
  }, [triggerLeave]);

  const handleTooltipEnter = useCallback(() => {
    cancelLeave();
  }, [cancelLeave]);

  const handleTooltipLeave = useCallback(() => {
    triggerLeave();
  }, [triggerLeave]);

  // 计算 tooltip 位置
  useEffect(() => {
    if (!hoverInfo) {
      setTooltipPos(null);
      return;
    }
    const { rect } = hoverInfo;
    const padding = 12;
    let left = rect.right + padding;
    let top = rect.top;

    // 如果右侧放不下，就放在下方
    const tooltipMinWidth = 340;
    if (left + tooltipMinWidth > window.innerWidth) {
      left = rect.left;
      top = rect.bottom + padding;
    }

    // 确保不超出底部
    const tooltipHeight = 220;
    if (top + tooltipHeight > window.innerHeight) {
      top = Math.max(0, window.innerHeight - tooltipHeight - padding);
    }

    setTooltipPos({ left, top });
  }, [hoverInfo]);

  return (
    <div className="git-graph" ref={containerRef}>
      {/* 背景垂直线 */}
      <svg className="git-graph-svg" width="100%" height="100%">
        <defs>
          <linearGradient id="git-line-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(88, 166, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(88, 166, 255, 0.1)" />
          </linearGradient>
        </defs>
        <line
          x1="28"
          y1="0"
          x2="28"
          y2="100%"
          stroke="url(#git-line-gradient)"
          strokeWidth="2"
        />
      </svg>

      {/* 提交行 */}
      {commits.map((commit, index) => {
        const dotColor = BRANCH_COLORS[0];
        const isCurrentBranch = index === 0;

        return (
          <div
            key={commit.hash}
            ref={(el) => {
              if (el) rowRefs.current.set(commit.hash, el);
              else rowRefs.current.delete(commit.hash);
            }}
            className={`git-graph-row ${onSelectCommit ? 'git-graph-row-clickable' : ''}`}
            onClick={() => onSelectCommit?.(commit)}
            onMouseEnter={() => handleMouseEnter(commit)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="git-graph-dot-container">
              <div
                className="git-graph-dot"
                style={{
                  backgroundColor: dotColor,
                  boxShadow: isCurrentBranch ? `0 0 0 3px ${dotColor}33` : 'none',
                }}
              />
            </div>

            <div className="git-graph-content">
              <span className="git-graph-message" title={commit.message}>{commit.message}</span>
              <span className="git-graph-meta">
                <span className="git-graph-author">{commit.authorName}</span>
                <span className="git-graph-date">{formatRelativeDate(commit.date)}</span>
              </span>
            </div>

            {/* 分支标签 - 最右侧 */}
            {isCurrentBranch && (
              <span className="git-graph-branch-tag" style={{ backgroundColor: `${dotColor}20`, color: dotColor, borderColor: `${dotColor}40` }}>
                {currentBranch}
              </span>
            )}
          </div>
        );
      })}

      {/* Hover 浮动卡片 - fixed 定位 */}
      {hoverInfo && tooltipPos && (
        <div
          className="git-graph-tooltip"
          style={{ left: tooltipPos.left, top: tooltipPos.top }}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
        >
          <GitGraphTooltip commit={hoverInfo.commit} />
        </div>
      )}
    </div>
  );
}

interface GitGraphTooltipProps {
  commit: GitCommit;
}

function GitGraphTooltip({ commit }: GitGraphTooltipProps): React.ReactElement {
  const stats = commit.stats;
  const fileCount = stats?.files ?? commit.changedFiles?.length ?? 0;

  // 从 message 中提取 tag，如 "feat: v0.2.1 - ..." -> "v0.2.1"
  const tagMatch = commit.message.match(/v\d+\.\d+\.\d+/);
  const tag = tagMatch ? tagMatch[0] : null;

  return (
    <div>
      <div className="git-graph-tooltip-header">
        <span className="git-graph-tooltip-avatar" />
        <span className="git-graph-tooltip-author">{commit.authorName}</span>
        <span className="git-graph-tooltip-date">{formatFullDate(commit.date)}</span>
      </div>

      <div className="git-graph-tooltip-message">{commit.message}</div>

      {fileCount > 0 && (
        <div className="git-graph-tooltip-stats">
          已更改 {fileCount} 个文件
          {stats?.additions !== undefined && (
            <span className="git-graph-tooltip-stat-add">，{stats.additions} 行插入(+)</span>
          )}
          {stats?.deletions !== undefined && (
            <span className="git-graph-tooltip-stat-del">，{stats.deletions} 行删除(-)</span>
          )}
        </div>
      )}

      {tag && (
        <div className="git-graph-tooltip-tag">
          <span className="git-graph-tooltip-tag-icon">⧖</span>
          {tag}
        </div>
      )}

      <div className="git-graph-tooltip-hash">
        <span className="git-graph-tooltip-hash-icon">⧖</span>
        {commit.shortHash}
        <button
          className="git-graph-tooltip-copy-btn"
          title="复制 hash"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard?.writeText(commit.hash).catch(() => {});
          }}
        >
          ⧉
        </button>
      </div>
    </div>
  );
}

export default GitGraph;
