import { useCallback, useEffect, useState, useRef } from 'react';
import { fileSystemService } from '../services/file-system-service';
import { showToast } from '../services/toast-service';

interface ImageSize {
  width: number;
  height: number;
}

interface UseImageDropOptions {
  onImageAdded: (assetPath: string, clientX: number, clientY: number, size?: ImageSize) => void;
  fileDir: string;
  enablePaste?: boolean;
}

interface UseImageDropReturn {
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handlePaste?: (e: ClipboardEvent) => Promise<void>;
  isDragOver: boolean;
}

export function getImageSizeFromBlob(blob: Blob): Promise<ImageSize> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      // 图片加载失败时返回更合理的默认尺寸
      console.warn('Failed to load image, using default size');
      resolve({ width: 100, height: 100 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export async function saveImageToAssetsDir(file: File, fileDir: string): Promise<string> {
  const assetsDir = `${fileDir}/assets/images`;
  await fileSystemService.ensureDir(assetsDir);

  const timestamp = Date.now();
  // 移除路径遍历字符和特殊字符，只保留字母、数字、点、下划线和连字符
  const sanitizedName = file.name
    .replace(/\.\./g, '') // 移除路径遍历
    .replace(/[\/\\]/g, '') // 移除路径分隔符
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // 确保文件名不为空
  const finalName = sanitizedName || 'image';
  const destPath = `${assetsDir}/${timestamp}_${finalName}`;

  const electronFile = file as File & { path?: string };
  if (electronFile.path) {
    const api = (window as any).api;
    if (api && api.copyFile) {
      try {
        await api.copyFile(electronFile.path, destPath);
      } catch (error) {
        console.error('Failed to copy file:', error);
        throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      throw new Error('copyFile API not available');
    }
  } else {
    try {
      const buffer = await file.arrayBuffer();
      await fileSystemService.writeFile(destPath, new Uint8Array(buffer));
    } catch (error) {
      console.error('Failed to write file:', error);
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return `assets/images/${timestamp}_${finalName}`;
}

export async function saveBlobToAssetsDir(blob: Blob, fileName: string, fileDir: string): Promise<string> {
  const assetsDir = `${fileDir}/assets/images`;
  await fileSystemService.ensureDir(assetsDir);

  const timestamp = Date.now();
  // 移除路径遍历字符和特殊字符，只保留字母、数字、点、下划线和连字符
  const sanitizedName = fileName
    .replace(/\.\./g, '') // 移除路径遍历
    .replace(/[\/\\]/g, '') // 移除路径分隔符
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // 确保文件名不为空
  const finalName = sanitizedName || 'image';
  const destPath = `${assetsDir}/${timestamp}_${finalName}`;

  try {
    const arrayBuffer = await blob.arrayBuffer();
    await fileSystemService.writeFile(destPath, new Uint8Array(arrayBuffer));
  } catch (error) {
    console.error('Failed to write blob to file:', error);
    throw new Error(`Failed to write blob to file: ${error instanceof Error ? error.message : String(error)}`);
  }

  return `assets/images/${timestamp}_${finalName}`;
}

export function getFileDir(selectedFilePath: string | null | undefined, fallbackDir: string): string {
  if (selectedFilePath) {
    return selectedFilePath.replace(/[\\/][^\\/]*$/, '');
  }
  return fallbackDir;
}

/**
 * 验证图片路径是否安全
 * @param path 图片路径
 * @returns 是否安全
 */
export function validateImagePath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  // 检查路径遍历
  if (path.includes('..') || path.includes('~')) {
    return false;
  }
  
  // 检查是否以 assets/images/ 开头
  if (!path.startsWith('assets/images/')) {
    return false;
  }
  
  // 检查是否包含非法字符
  if (/[^a-zA-Z0-9._\-\/]/.test(path)) {
    return false;
  }
  
  return true;
}

export function useImageDrop({
  onImageAdded,
  fileDir,
  enablePaste = true,
}: UseImageDropOptions): UseImageDropReturn {
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    lastMousePosRef.current.x = Math.max(0, Math.round(e.clientX - rect.left));
    lastMousePosRef.current.y = Math.max(0, Math.round(e.clientY - rect.top));
    containerRef.current = e.currentTarget as HTMLElement;
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!fileDir) {
        showToast('File directory not available', 'error');
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));

      if (imageFiles.length === 0) return;

      try {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const relativePath = await saveImageToAssetsDir(file, fileDir);
          const size = await getImageSizeFromBlob(file);
          onImageAdded(relativePath, e.clientX + i * 20, e.clientY + i * 20, size);
        }
      } catch (error) {
        console.error('Failed to save images:', error);
        showToast(`Failed to save images: ${error instanceof Error ? error.message : String(error)}`, 'error');
      }
    },
    [onImageAdded, fileDir]
  );

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (!fileDir) {
        showToast('File directory not available', 'error');
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      const rect = containerRef.current?.getBoundingClientRect();
      let pasteClientX = rect ? Math.round(rect.left + lastMousePosRef.current.x) : 50;
      let pasteClientY = rect ? Math.round(rect.top + lastMousePosRef.current.y) : 50;

      let imageIndex = 0;
      try {
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            if (!blob) continue;

            const extension = item.type.split('/')[1] || 'png';
            const fileName = `pasted_${imageIndex}.${extension}`;

            const relativePath = await saveBlobToAssetsDir(blob, fileName, fileDir);
            const size = await getImageSizeFromBlob(blob);
            onImageAdded(relativePath, pasteClientX + imageIndex * 30, pasteClientY + imageIndex * 30, size);
            imageIndex++;
          }
        }
      } catch (error) {
        console.error('Failed to paste images:', error);
        showToast(`Failed to paste images: ${error instanceof Error ? error.message : String(error)}`, 'error');
      }
    },
    [onImageAdded, fileDir]
  );

  useEffect(() => {
    if (!enablePaste || !handlePaste) return;

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [enablePaste, handlePaste]);

  useEffect(() => {
    return () => {
      setIsDragOver(false);
    };
  }, []);

  return {
    handleDragOver,
    handleDrop,
    handlePaste: enablePaste ? handlePaste : undefined,
    isDragOver,
  };
}
