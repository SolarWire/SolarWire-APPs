/**
 * Git 相关类型定义（扩展）
 */

import { GitCommit as BaseGitCommit } from './git';

/**
 * Git Commit 扩展接口
 */
export interface GitCommit extends BaseGitCommit {
  /**
   * 修改的文件列表
   */
  changedFiles?: string[];
  
  /**
   * 修改的 SolarWire 代码块信息
   */
  changedSnippets?: {
    /**
     * 代码块在 Markdown 文件中的索引
     */
    snippetIndex: number;
    
    /**
     * 代码块的 !title 标识
     */
    title: string;
  }[];
}

/**
 * 分析上下文类型
 */
export type VersionAnalysisType = 'solarwire-file' | 'markdown-snippet';

/**
 * 版本分析上下文
 */
export interface VersionAnalysisContext {
  /**
   * 分析类型
   */
  type: VersionAnalysisType;
  
  /**
   * 文件路径
   */
  filePath: string;
  
  /**
   * !title 标识
   */
  title: string;
  
  /**
   * 代码块索引（仅 markdown-snippet 类型）
   */
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
  /**
   * 总提交数
   */
  total: number;
  
  /**
   * 已处理数
   */
  processed: number;
  
  /**
   * 当前处理的提交 hash
   */
  currentCommit: string;
  
  /**
   * 匹配的提交列表
   */
  matchingCommits: GitCommit[];
  
  /**
   * 分析状态
   */
  status: AnalysisStatus;
  
  /**
   * 状态消息
   */
  message?: string;
}

/**
 * !title 验证结果
 */
export interface TitleValidationResult {
  /**
   * 是否验证通过
   */
  valid: boolean;
  
  /**
   * 提取的 title（验证通过时）
   */
  title?: string;
  
  /**
   * 错误信息（验证失败时）
   */
  error?: string;
  
  /**
   * 操作建议（验证失败时）
   */
  suggestion?: string;
}

/**
 * SolarWire 代码块信息
 */
export interface SolarWireSnippetInfo {
  /**
   * 代码块内容
   */
  code: string;
  
  /**
   * 代码块在 Markdown 文件中的索引
   */
  snippetIndex: number;
  
  /**
   * 提取的 !title
   */
  title?: string;
}
