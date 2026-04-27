import React, { useMemo } from 'react';
import { useFileStore } from '../../stores/fileStore';
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
              return (
                <div
                  key={req.path}
                  className={`requirement-card ${currentView === 'requirement' && (selectedFile?.path === req.path || getSelectionForView('requirement')?.path === req.path) ? 'requirement-card-selected' : ''}`}
                  onClick={() => handleClick(req)}
                >
                  <h3 className="requirement-folder-name">{req.folderName || 'Root'}</h3>
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
