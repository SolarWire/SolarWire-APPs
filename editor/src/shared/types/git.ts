/**
 * Git 基础类型定义
 */

/**
 * Git Commit 基础接口
 */
export interface GitCommit {
  /**
   * 完整 commit hash
   */
  hash: string;
  
  /**
   * 简短 commit hash（前 7 位）
   */
  shortHash: string;
  
  /**
   * 提交日期
   */
  date: string;
  
  /**
   * 提交消息
   */
  message: string;
  
  /**
   * 作者姓名
   */
  authorName: string;
  
  /**
   * 作者邮箱（可选）
   */
  authorEmail?: string;
  
  /**
   * 修改的文件列表（可选）
   */
  changedFiles?: ChangedFile[];
  
  /**
   * 统计信息（可选）
   */
  stats?: {
    additions: number;
    deletions: number;
    files: number;
  };
}

/**
 * 修改的文件信息
 */
export interface ChangedFile {
  /**
   * 文件路径
   */
  path: string;
  
  /**
   * 变更类型：'added' | 'deleted' | 'modified' | 'renamed'
   */
  type: 'added' | 'deleted' | 'modified' | 'renamed';
  
  /**
   * 新增行数
   */
  additions?: number;
  
  /**
   * 删除行数
   */
  deletions?: number;
}

/**
 * Git 状态
 */
export interface GitStatus {
  /**
   * 已修改的文件
   */
  modified: string[];
  
  /**
   * 已暂存的文件
   */
  staged: string[];
  
  /**
   * 未跟踪的文件
   */
  untracked: string[];
}

/**
 * Git 分支
 */
export interface GitBranch {
  /**
   * 分支名称
   */
  name: string;
  
  /**
   * 是否为当前分支
   */
  isCurrent: boolean;
}
