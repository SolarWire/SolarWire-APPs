import React, { useEffect } from 'react';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { copyElements, pasteElements, copyToSystemClipboard } from '../../services/clipboard';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  content: string;
  onClose: () => void;
  onDelete: () => void;
  onContentChange: ((content: string) => void) | undefined;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ position, content, onClose, onDelete, onContentChange }) => {
  useEffect(() => {
    if (!position) return;
    const handleClickOutside = () => onClose();
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [position, onClose]);

  if (!position) return null;

  const { selectedElements, setSelectedElements } = useSolarWireStore.getState();

  const handleCopy = async () => {
    if (selectedElements.length > 0) {
      const result = await copyElements({ elementIds: selectedElements, content });
      if (result.success) await copyToSystemClipboard();
    }
    onClose();
  };

  const handlePaste = async () => {
    if (!onContentChange) return;
    const targetPos = { x: position.x, y: position.y };
    const result = await pasteElements({ content, targetPosition: targetPos, setContent: onContentChange, setSelectedElements });
    if (result.success) onContentChange?.(result.newContent);
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <div className="context-menu" style={{ left: position.x, top: position.y }} onClick={(e) => e.stopPropagation()}>
      <button className="context-menu-item" onClick={handleCopy}>
        复制 (Copy)
      </button>
      <button className="context-menu-item" onClick={handlePaste}>
        粘贴 (Paste)
      </button>
      <button className="context-menu-item" onClick={handleDelete}>
        删除 (Delete)
      </button>
    </div>
  );
};

export default ContextMenu;
