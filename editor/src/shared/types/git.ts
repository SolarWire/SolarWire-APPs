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
