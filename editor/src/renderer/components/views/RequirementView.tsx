import React, { useMemo } from 'react';
import { useFileStore } from '../../stores/fileStore';
import './RequirementView.css';

interface Requirement {
  name: string;
  path: string;
  createdAt: string;
  pageCount: number;
}

function RequirementView(): JSX.Element {
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
            results.push({
              name: node.name,
              path: node.path,
              createdAt: new Date().toISOString().split('T')[0],
              pageCount: 1,
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

  const getFolderName = (filePath: string): string => {
    if (!currentPath) return '';
    const relativePath = filePath.replace(currentPath, '');
    const lastSlash = relativePath.lastIndexOf('/');
    const lastBackslash = relativePath.lastIndexOf('\\');
    const lastSeparator = Math.max(lastSlash, lastBackslash);
    if (lastSeparator <= 0) return '';
    return relativePath.substring(1, lastSeparator);
  };

  const handleClick = async (req: Requirement) => {
    if (openFileAtPath) {
      await openFileAtPath(req.path);
    }
  };

  if (!currentPath) {
    return (
      <div className="requirement-view">
        <div className="requirement-empty">Open a folder first to see requirements</div>
      </div>
    );
  }

  return (
    <div className="requirement-view">
      <div className="requirement-cards">
        {requirements.length === 0 ? (
          <div className="requirement-empty">No markdown files found in the current folder</div>
        ) : (
          requirements.map((req) => {
            const folderName = getFolderName(req.path);
            return (
              <div
                key={req.path}
                className="requirement-card"
                onClick={() => handleClick(req)}
              >
                <h3 className="requirement-name">{req.name}</h3>
                {folderName && (
                  <div className="requirement-info">
                    <span>Folder: {folderName}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RequirementView;
