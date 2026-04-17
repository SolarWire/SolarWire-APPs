import React from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useAppStore } from '../../stores/appStore';
import FileTree from '../editor/FileTree';
import { useSelectionStore } from '../../stores/selectionStore';
import { Scrollbar } from '../ui/Scrollbar';
import './FileView.css';

const FileView: React.FC = () => {
  const {
    fileTree,
    selectedFile,
    currentPath,
    expandedDirectories,
    toggleDirectory,
    openFileAtPath,
    openDirectoryAtPath
  } = useFileStore();
  
  const { currentView } = useAppStore();

  const handleOpen = async (): Promise<void> => {
    try {
      const api = (window as any).api;
      if (!api || !api.openFileDialog) {
        console.warn('File dialog not available in current environment');
        alert('File dialog is only available in the Electron app');
        return;
      }

      const paths: string[] = await api.openFileDialog({
        properties: ['openFile', 'openDirectory', 'multiSelections'],
      });

      if (paths && paths.length > 0) {
        const path = paths[0];

        try {
          if (openDirectoryAtPath) {
            await openDirectoryAtPath(path);
          }
        } catch (err) {
          if (openFileAtPath) {
            try {
              await openFileAtPath(path);
            } catch (fileErr) {
              console.error('Failed to open as file or directory', fileErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Open dialog failed', err);
    }
  };

  const { setSelection, getSelectionForView } = useSelectionStore();

  const handleSelectFile = async (file: any) => {
    if (openFileAtPath) {
      // 更新选中记录
      setSelection('file', file.path);
      await openFileAtPath(file.path);
    }
  };

  const renderFileTree = () => {
    if (fileTree.length === 0 && !selectedFile) {
      return (
        <div className="file-view-empty">
          <div className="empty-icon">📁</div>
          <div className="empty-text">Open a file or folder to get started</div>
        </div>
      );
    }

    return (
      <FileTree
        nodes={fileTree}
        expandedDirectories={expandedDirectories}
        selectedFile={currentView === 'file' ? (selectedFile || (() => {
          const selectedItem = getSelectionForView('file');
          if (selectedItem) {
            return { name: selectedItem.path.split(/[\/\\]/).pop() || selectedItem.path, path: selectedItem.path, type: 'file' };
          }
          return null;
        })()) : null}
        onToggleDirectory={toggleDirectory!}
        onSelectFile={handleSelectFile}
      />
    );
  };

  return (
    <Scrollbar className="file-view-scrollbar">
      <div className="file-view">
        {renderFileTree()}
      </div>
    </Scrollbar>
  );
};

export default FileView;
