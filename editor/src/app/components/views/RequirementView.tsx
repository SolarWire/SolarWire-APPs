import React, { useMemo, useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useGitStore } from '../../stores/gitStore';
import { useAppStore } from '../../stores/appStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { Scrollbar } from '../ui/Scrollbar';
import './RequirementView.css';

interface Requirement {
  name: string;
  path: string;
  folderName: string;
}

function RequirementView(): React.ReactElement {
  const { currentPath, fileTree, openFileAtPath } = useFileStore();
  const { status, history, refreshStatus, refreshHistory } = useGitStore();
  const [gitInfo, setGitInfo] = useState<Map<string, { hash: string; date: string; status: string }>>(new Map());

  useEffect(() => {
    const fetchGitInfo = async () => {
      if (currentPath) {
        await refreshStatus();
        await refreshHistory();
      }
    };

    fetchGitInfo();
  }, [currentPath, refreshStatus, refreshHistory]);

  useEffect(() => {
    if (history.length > 0) {
      const newGitInfo = new Map<string, { hash: string; date: string; status: string }>();
      
      // 为每个文件获取最新的git信息
      fileTree.forEach(node => {
        const processNode = (n: any) => {
          if (n.type === 'file') {
            const ext = n.name.split('.').pop()?.toLowerCase();
            if (ext === 'md' || ext === 'markdown') {
              // 查找文件的最新提交
              const fileHistory = history.filter(commit => commit.message.includes(n.name));
              let hash = 'N/A';
              let date = 'N/A';
              
              if (fileHistory.length > 0) {
                const latestCommit = fileHistory[0];
                hash = latestCommit.shortHash;
                date = latestCommit.date.split('T')[0];
              }
              
              // 确定文件状态
              let fileStatus = 'C'; // 已提交
              if (status.modified.includes(n.path)) {
                fileStatus = 'M'; // 已修改
              } else if (status.untracked.includes(n.path)) {
                fileStatus = 'U'; // 未跟踪
              } else if (status.staged.includes(n.path)) {
                fileStatus = 'S'; // 已暂存
              }
              
              newGitInfo.set(n.path, { hash, date, status: fileStatus });
            }
          } else if (n.type === 'directory' && n.children) {
            n.children.forEach(processNode);
          }
        };
        
        processNode(node);
      });
      
      setGitInfo(newGitInfo);
    }
  }, [history, status, fileTree]);

  const requirements = useMemo(() => {
    if (!currentPath || fileTree.length === 0) {
      return [];
    }

    const collectMdFiles = (nodes: any[], basePath: string): Requirement[] => {
      const results: Requirement[] = [];

      for (const node of nodes) {
        if (node.type === 'file') {
          const ext = node.name.split('.').pop()?.toLowerCase();
          if (ext === 'md' || ext === 'markdown') {
            const relativePath = node.path.replace(currentPath, '');
            const lastSlash = relativePath.lastIndexOf('/');
            const lastBackslash = relativePath.lastIndexOf('\\');
            const lastSeparator = Math.max(lastSlash, lastBackslash);
            let folderName = '';
            if (lastSeparator > 0) {
              folderName = relativePath.substring(1, lastSeparator);
            }
            
            results.push({
              name: node.name,
              path: node.path,
              folderName,
            });
          }
        } else if (node.type === 'directory' && node.children) {
          results.push(...collectMdFiles(node.children, node.path));
        }
      }

      return results;
    };

    return collectMdFiles(fileTree, currentPath);
  }, [currentPath, fileTree]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'M': return 'status-modified'; // 已修改 - 橙色
      case 'U': return 'status-untracked'; // 未跟踪 - 绿色
      case 'S': return 'status-staged'; // 已暂存 - 蓝色
      default: return 'status-committed'; // 已提交 - 灰色
    }
  };

  const { currentView } = useAppStore();
  const { setSelection, getSelectionForView } = useSelectionStore();

  const handleClick = async (req: Requirement) => {
    if (openFileAtPath) {
      // 更新选中记录
      setSelection('requirement', req.path);
      await openFileAtPath(req.path);
    }
  };

  const { selectedFile } = useFileStore();

  if (!currentPath) {
    return (
      <div className="requirement-view">
        <div className="requirement-empty">Open a folder first to see requirements</div>
      </div>
    );
  }

  return (
    <Scrollbar className="requirement-view-scrollbar">
      <div className="requirement-view">
        <div className="requirement-cards">
          {requirements.length === 0 ? (
            <div className="requirement-empty">No markdown files found in the current folder</div>
          ) : (
            requirements.map((req) => {
              const info = gitInfo.get(req.path) || { hash: 'N/A', date: 'N/A', status: 'C' };
              return (
                <div
                  key={req.path}
                  className={`requirement-card ${currentView === 'requirement' && (selectedFile?.path === req.path || getSelectionForView('requirement')?.path === req.path) ? 'requirement-card-selected' : ''}`}
                  onClick={() => handleClick(req)}
                >
                  <h3 className="requirement-folder-name">{req.folderName || 'Root'}</h3>
                  <div className="requirement-subtitle">
                    <span>Version: {info.hash}</span>
                    <span>Date: {info.date}</span>
                    <span className={`status-badge ${getStatusColor(info.status)}`}>{info.status}</span>
                  </div>
                  <div className="requirement-filename">{req.name}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Scrollbar>
  );
}

export default RequirementView;
