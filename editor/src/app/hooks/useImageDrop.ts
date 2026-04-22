import { useCallback, useEffect, useState, useRef } from 'react';

interface ImageSize {
  width: number;
  height: number;
}

interface UseImageDropOptions {
  onImageAdded: (assetPath: string, x: number, y: number, size?: ImageSize) => void;
  projectRoot: string;
  enablePaste?: boolean;
}

interface UseImageDropReturn {
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handlePaste?: (e: ClipboardEvent) => Promise<void>;
  isDragOver: boolean;
}

const lastMousePosRef = { x: 0, y: 0 };

function getImageSizeFromBlob(blob: Blob): Promise<ImageSize> {
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

async function saveImageToProject(file: File, projectRoot: string): Promise<string> {
  const api = (window as any).api;
  if (!api || !api.ensureDir || !api.writeFile) {
    throw new Error('File API not available');
  }

  const assetsDir = `${projectRoot}/assets/images`;
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

  const relativePath = `assets/images/${timestamp}_${sanitizedName}`;
  return relativePath;
}

async function saveBlobToProject(blob: Blob, fileName: string, projectRoot: string): Promise<string> {
  const api = (window as any).api;
  if (!api || !api.ensureDir || !api.writeFile) {
    throw new Error('File API not available');
  }

  const assetsDir = `${projectRoot}/assets/images`;
  await api.ensureDir(assetsDir);

  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const destPath = `${assetsDir}/${timestamp}_${sanitizedName}`;

  const arrayBuffer = await blob.arrayBuffer();
  await api.writeFile(destPath, new Uint8Array(arrayBuffer));

  const relativePath = `assets/images/${timestamp}_${sanitizedName}`;
  return relativePath;
}

export function useImageDrop({
  onImageAdded,
  projectRoot,
  enablePaste = true,
}: UseImageDropOptions): UseImageDropReturn {
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    lastMousePosRef.x = Math.max(0, Math.round(e.clientX - rect.left));
    lastMousePosRef.y = Math.max(0, Math.round(e.clientY - rect.top));
    containerRef.current = e.currentTarget as HTMLElement;
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!projectRoot) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));

      if (imageFiles.length === 0) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const baseX = Math.max(0, Math.round(e.clientX - rect.left));
      const baseY = Math.max(0, Math.round(e.clientY - rect.top));

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const relativePath = await saveImageToProject(file, projectRoot);
        const size = await getImageSizeFromBlob(file);
        onImageAdded(relativePath, baseX + i * 20, baseY + i * 20, size);
      }
    },
    [onImageAdded, projectRoot]
  );

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (!projectRoot) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const rect = containerRef.current?.getBoundingClientRect();
      let pasteX = rect ? Math.max(0, Math.round(lastMousePosRef.x)) : 50;
      let pasteY = rect ? Math.max(0, Math.round(lastMousePosRef.y)) : 50;

      let imageIndex = 0;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (!blob) continue;

          const extension = item.type.split('/')[1] || 'png';
          const fileName = `pasted_${imageIndex}.${extension}`;

          const relativePath = await saveBlobToProject(blob, fileName, projectRoot);
          const size = await getImageSizeFromBlob(blob);
          onImageAdded(relativePath, pasteX + imageIndex * 30, pasteY + imageIndex * 30, size);
          imageIndex++;
        }
      }
    },
    [onImageAdded, projectRoot]
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
