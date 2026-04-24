import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFileStore } from '../../stores/fileStore';
import './ImagePreview.css';

function ImagePreview(): React.ReactElement {
  const { selectedImage, selectedFile } = useFileStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>('');

  const filePath = selectedImage?.path || '';

  useEffect(() => {
    if (!filePath) return;

    let cancelled = false;
    setIsLoading(true);

    const api = (window as any).api;
    if (api?.readImageAsBase64) {
      api.readImageAsBase64(filePath).then((base64: string) => {
        if (!cancelled) {
          if (base64 && !base64.startsWith('data:')) {
            const mimeType = filePath.toLowerCase().endsWith('.png') ? 'image/png'
              : filePath.toLowerCase().match(/\.(jpe?g)$/i) ? 'image/jpeg'
              : filePath.toLowerCase().endsWith('.gif') ? 'image/gif'
              : filePath.toLowerCase().endsWith('.webp') ? 'image/webp'
              : filePath.toLowerCase().endsWith('.svg') ? 'image/svg+xml'
              : 'image/png';
            setImageUrl(`data:${mimeType};base64,${base64}`);
          } else {
            setImageUrl(base64 || '');
          }
          setIsLoading(false);
        }
      }).catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    } else {
      setImageUrl(filePath);
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    if (imageUrl) {
      img.src = imageUrl;
    }
  }, [imageUrl]);

  useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (imageSize.width > 0 && containerSize.width > 0) {
      const scaleW = containerSize.width / imageSize.width;
      const scaleH = containerSize.height / imageSize.height;
      const initialScale = Math.min(scaleW, scaleH, 1) * 0.9;
      setScale(initialScale);
      setPosition({ x: 0, y: 0 });
    }
  }, [imageSize, containerSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNonPassive = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((prev) => Math.max(0.1, Math.min(10, prev * delta)));
    };

    container.addEventListener('wheel', handleWheelNonPassive, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNonPassive);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResetView = useCallback(() => {
    if (imageSize.width > 0 && containerSize.width > 0) {
      const scaleW = containerSize.width / imageSize.width;
      const scaleH = containerSize.height / imageSize.height;
      const initialScale = Math.min(scaleW, scaleH, 1) * 0.9;
      setScale(initialScale);
      setPosition({ x: 0, y: 0 });
    }
  }, [imageSize, containerSize]);

  const handleFitWidth = useCallback(() => {
    if (containerSize.width > 0 && imageSize.width > 0) {
      const newScale = containerSize.width / imageSize.width;
      setScale(newScale);
      setPosition({ x: 0, y: 0 });
    }
  }, [containerSize, imageSize]);

  const handleFitHeight = useCallback(() => {
    if (containerSize.height > 0 && imageSize.height > 0) {
      const newScale = containerSize.height / imageSize.height;
      setScale(newScale);
      setPosition({ x: 0, y: 0 });
    }
  }, [containerSize, imageSize]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s * 1.2, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(s * 0.8, 0.1));
  }, []);

  const fileName = selectedFile?.name || selectedImage?.path?.split(/[\\/]/).pop() || '';

  return (
    <div className="image-preview">
      <div className="image-preview-header">
        <span className="image-preview-title" title={fileName}>{fileName}</span>
        <div className="image-preview-toolbar">
          <button className="image-preview-btn" onClick={handleResetView} title="适合屏幕">适合</button>
          <button className="image-preview-btn" onClick={handleFitWidth} title="适合宽度">宽</button>
          <button className="image-preview-btn" onClick={handleFitHeight} title="适合高度">高</button>
          <button className="image-preview-btn" onClick={handleZoomOut} title="缩小">−</button>
          <span className="image-preview-zoom-level">{Math.round(scale * 100)}%</span>
          <button className="image-preview-btn" onClick={handleZoomIn} title="放大">+</button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="image-preview-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {isLoading && <div className="image-preview-loading">加载中...</div>}
        {!isLoading && imageUrl && (
          <img
            src={imageUrl}
            alt={fileName}
            className="image-preview-image"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
            }}
            draggable={false}
          />
        )}
      </div>
      <div className="image-preview-info">
        {imageSize.width > 0 && `${imageSize.width} × ${imageSize.height}`}
      </div>
    </div>
  );
}

export default ImagePreview;