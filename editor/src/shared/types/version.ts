/**
 * Git 相关类型定义（扩展）
 */

import type { GitCommit, GitBranch, ChangedFile } from './git';

export type { GitCommit, GitBranch, ChangedFile } from './git';

/**
 * 分析上下文类型
 */
export type VersionAnalysisType = 'solarwire-file' | 'markdown-snippet';

/**
 * 版本分析上下文
 */
export interface VersionAnalysisContext {
  type: VersionAnalysisType;
  filePath: string;
  title: string;
  snippetIndex?: number;
}

/**
 * 分析进度状态
 */
export type AnalysisStatus = 'running' | 'completed' | 'error' | 'cancelled';

/**
 * 分析进度
 */
export interface AnalysisProgress {
  total: number;
  processed: number;
  currentCommit: string;
  matchingCommits: GitCommit[];
  status: AnalysisStatus;
  message?: string;
}

/**
 * !title 验证结果
 */
export interface TitleValidationResult {
  valid: boolean;
  title?: string;
  error?: string;
  suggestion?: string;
}

/**
 * SolarWire 代码块信息
 */
export interface SolarWireSnippetInfo {
  code: string;
  snippetIndex: number;
  title?: string;
}
