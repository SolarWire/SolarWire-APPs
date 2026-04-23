import { useCallback, useEffect, useState, useRef } from 'react';

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
      resolve({ width: 200, height: 200 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export async function saveImageToAssetsDir(file: File, fileDir: string): Promise<string> {
  const api = (window as any).api;
  if (!api || !api.ensureDir || !api.writeFile) {
    throw new Error('File API not available');
  }

  const assetsDir = `${fileDir}/assets/images`;
  await api.ensureDir(assetsDir);

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const destPath = `${assetsDir}/${timestamp}_${sanitizedName}`;

  const electronFile = file as File & { path?: string };
  if (electronFile.path) {
    await api.copyFile(electronFile.path, destPath);
  } else {
    const buffer = await file.arrayBuffer();
    await api.writeFile(destPath, new Uint8Array(buffer));
  }

  return `assets/images/${timestamp}_${sanitizedName}`;
}

export async function saveBlobToAssetsDir(blob: Blob, fileName: string, fileDir: string): Promise<string> {
  const api = (window as any).api;
  if (!api || !api.ensureDir || !api.writeFile) {
    throw new Error('File API not available');
  }

  const assetsDir = `${fileDir}/assets/images`;
  await api.ensureDir(assetsDir);

  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const destPath = `${assetsDir}/${timestamp}_${sanitizedName}`;

  const arrayBuffer = await blob.arrayBuffer();
  await api.writeFile(destPath, new Uint8Array(arrayBuffer));

  return `assets/images/${timestamp}_${sanitizedName}`;
}

export function getFileDir(selectedFilePath: string | null | undefined, fallbackDir: string): string {
  if (selectedFilePath) {
    return selectedFilePath.replace(/[\\/][^\\/]*$/, '');
  }
  return fallbackDir;
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

      if (!fileDir) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));

      if (imageFiles.length === 0) return;

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const relativePath = await saveImageToAssetsDir(file, fileDir);
        const size = await getImageSizeFromBlob(file);
        onImageAdded(relativePath, e.clientX + i * 20, e.clientY + i * 20, size);
      }
    },
    [onImageAdded, fileDir]
  );

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (!fileDir) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const rect = containerRef.current?.getBoundingClientRect();
      let pasteClientX = rect ? Math.round(rect.left + lastMousePosRef.current.x) : 50;
      let pasteClientY = rect ? Math.round(rect.top + lastMousePosRef.current.y) : 50;

      let imageIndex = 0;
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
