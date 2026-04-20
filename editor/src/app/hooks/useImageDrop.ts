/**
 * Hook for handling image drag-and-drop and paste functionality
 * Allows users to add images to SolarWire content by:
 * 1. Dragging image files onto the canvas
 * 2. Pasting images from clipboard
 */

import { useCallback, useEffect, useState } from 'react';
import { ImageAssetManager } from '../services/ImageAssetManager';

interface UseImageDropOptions {
  onImageAdded: (assetPath: string, x: number, y: number) => void;
  imageManager: ImageAssetManager;
  enablePaste?: boolean;
}

interface UseImageDropReturn {
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
}

export function useImageDrop({
  onImageAdded,
  imageManager,
  enablePaste = true,
}: UseImageDropOptions): UseImageDropReturn {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));

      if (imageFiles.length === 0) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / 1);
      const y = Math.round((e.clientY - rect.top) / 1);

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const relativePath = await imageManager.addImage(file);
        onImageAdded(relativePath, x + i * 20, y + i * 20);
      }
    },
    [onImageAdded, imageManager]
  );

  useEffect(() => {
    if (!enablePaste) return;

    const handlePasteEvent = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      let imageIndex = 0;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (!blob) continue;

          const timestamp = Date.now();
          const extension = item.type.split('/')[1] || 'png';
          const fileName = `pasted_${timestamp}_${imageIndex}.${extension}`;

          const file = new File([blob], fileName, { type: blob.type });
          const relativePath = await imageManager.addImage(file);

          onImageAdded(relativePath, 50 + imageIndex * 30, 50 + imageIndex * 30);
          imageIndex++;
        }
      }
    };

    document.addEventListener('paste', handlePasteEvent);
    return () => document.removeEventListener('paste', handlePasteEvent);
  }, [onImageAdded, imageManager, enablePaste]);

  useEffect(() => {
    return () => {
      setIsDragOver(false);
    };
  }, []);

  return {
    handleDragOver,
    handleDrop,
    isDragOver,
  };
}
