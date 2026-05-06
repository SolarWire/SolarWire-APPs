import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useCoordinateSystem } from '../../../shared/hooks/useCoordinateSystem';
import { ViewportManager } from '../../../shared/utils/ViewportManager';
import { useDragCoordinate } from '../../../shared/hooks/useDragCoordinate';
import {
  getLineCoordinates
} from '../../../shared/utils/line-coordinate-utils';
import {
  createRafContentUpdater,
  isValidFileDir,
  getProjectDir,
  getElementDataFromContent,
  snapToGridValue,
  hexToRgba,
  calculateImageSize
} from '../../../shared/utils/preview-utils';
import {
  MAX_IMAGE_DIMENSION,
  DEFAULT_IMAGE_WIDTH
} from '../../../shared/utils/constants';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useFileStore } from '../../stores/fileStore';
import { usePreviewStore } from '../../stores/previewStore';
import type {
  BoxSelectionState,
  MultiDragState,
  DragElementState,
  ResizeHandleState,
  DragPreviewElement,
} from '../../stores/previewStore';
import {
  collectAllGuides,
  computeSnap,
  getActiveEdgesForMove,
  getActiveEdgesForResize,
  calculateDistances,
  renderAlignmentGuides,
  renderDistanceLines,
} from './snap';
import type {
  AlignmentGuide,
  SnapElement,
  RenderContext,
} from './snap';
import { parse } from '../../../lib/parser';
import { render, RenderResultWithMeta } from '../../../lib/renderer';
import { updateLineAttribute, getElementRelatedLines, detectElementBounds, isInsideMultilineNoteContent } from '../../../shared/utils/solarwire-utils';
import { useImageDrop, getFileDir, saveImageToAssetsDir, getImageSizeFromBlob, validateImagePath } from '../../hooks/useImageDrop';
import type { Document, Element as SolarWireElement } from '../../../lib/parser/types';
import { copyElements, pasteElements, copyToSystemClipboard } from '../../services/clipboard';
import { feedback } from '../../stores/feedbackStore';
import './SolarWirePreview.css';
import CanvasRuler from './CanvasRuler';

import type { SelectionTool } from '../../stores/solarWireStore';

/**
 * 验证拖放的内容是否安全
 * @param content 拖放的内容
 * @returns 是否安全
 */
function validateDropContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  // 检查长度限制（100KB）
  if (content.length > 100000) {
    return false;
  }
  
  // 检查是否包含潜在的恶意代码模式
  const dangerousPatterns = [
    /javascript:/i,
    /data:text\/html/i,
    /<script/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /\.innerHTML/i,
    /\.outerHTML/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 处理线段拖动
 * @param content 当前文档内容
 * @param lineNum 线段编号
 * @param elementX 原始起点 X 坐标
 * @param elementY 原始起点 Y 坐标
 * @param elementX2 原始终点 X 坐标
 * @param elementY2 原始终点 Y 坐标
 * @param dx X 轴偏移量
 * @param dy Y 轴偏移量
 * @param setContentFn 内容更新函数
 * @param isRelative 是否使用相对坐标模式
 * @returns 更新后的文档内容
 */
const handleLineDrag = (
  content: string,
  lineNum: number,
  elementX: number,
  elementY: number,
  elementX2: number | undefined,
  elementY2: number | undefined,
  dx: number,
  dy: number,
  setContentFn: (content: string) => void,
  isRelative: boolean = false
): string => {
  let newContent = content;
  
  // 获取元素边界信息，确定正确的属性行
  const bounds = detectElementBounds(content, lineNum);
  const attributeLine = bounds.attributeLine;
  
  if (isRelative && elementX2 !== undefined && elementY2 !== undefined) {
    const originalDx = elementX2 - elementX;
    const originalDy = elementY2 - elementY;
    
    const newX = Math.round(elementX + dx);
    const newY = Math.round(elementY + dy);
    
    const newX2 = newX + originalDx;
    const newY2 = newY + originalDy;
    
    newContent = updateLineAttribute(newContent, attributeLine, 'x', newX);
    newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);
    newContent = updateLineAttribute(newContent, attributeLine, 'x2', newX2);
    newContent = updateLineAttribute(newContent, attributeLine, 'y2', newY2);
  } else {
    const newX = Math.round(elementX + dx);
    const newY = Math.round(elementY + dy);
    const newX2 = elementX2 !== undefined ? Math.round(elementX2 + dx) : undefined;
    const newY2 = elementY2 !== undefined ? Math.round(elementY2 + dy) : undefined;
    
    newContent = updateLineAttribute(newContent, attributeLine, 'x', newX);
    newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);
    
    // 如果有终点坐标，同时更新终点
    if (newX2 !== undefined && newY2 !== undefined) {
      newContent = updateLineAttribute(newContent, attributeLine, 'x2', newX2);
      newContent = updateLineAttribute(newContent, attributeLine, 'y2', newY2);
    }
  }
  
  setContentFn(newContent);
  return newContent;
};

/**
 * 处理普通元素拖动
 * @param content 当前文档内容
 * @param lineNum 元素编号
 * @param elementX 原始 X 坐标
 * @param elementY 原始 Y 坐标
 * @param dx X 轴偏移量
 * @param dy Y 轴偏移量
 * @param setContentFn 内容更新函数
 * @returns 更新后的文档内容
 */
const handleElementDrag = (
  content: string,
  lineNum: number,
  elementX: number,
  elementY: number,
  dx: number,
  dy: number,
  setContentFn: (content: string) => void,
  snapToGrid: boolean = false,
  gridSize: number = 20
): string => {
  let newX = Math.round(elementX + dx);
  let newY = Math.round(elementY + dy);
  
  if (snapToGrid && gridSize > 0) {
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;
  }
  
  // 获取元素边界信息，确定正确的属性行
  const bounds = detectElementBounds(content, lineNum);
  const attributeLine = bounds.attributeLine;
  
  let newContent = updateLineAttribute(content, attributeLine, 'x', newX);
  newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);
  
  setContentFn(newContent);
  return newContent;
};

/**
 * SolarWire 预览组件的属性接口
 */
interface SolarWirePreviewProps {
  /** 当前选择的工具 */
  selectionTool: SelectionTool;
  /** 是否显示备注 */
  showNotes?: boolean;
  /** 是否处于平移模式 */
  isPanMode?: boolean;
  /** 空格键是否按下 */
  isSpacePressed?: boolean;
  /** 是否启用智能吸附（对齐辅助线） */
  snapToGuides?: boolean;
  /** 是否显示网格（外部属性） */
  showGridProp?: boolean;
  /** 是否启用网格吸附（外部属性） */
  snapToGridProp?: boolean;
  /** 网格大小（外部属性） */
  gridSizeProp?: number;
  /** 外部内容（用于组件编辑模式） */
  externalContent?: string;
  /** 外部内容变化回调 */
  onExternalContentChange?: (code: string) => void;
  /** 右键菜单回调 */
  onContextMenu?: (e: React.MouseEvent) => void;
  /** 是否允许图片元素 */
  allowImageElements?: boolean;
  /** 请求导出 SVG 的回调 */
  onRequestExportSvg?: (getSvgContent: () => string | null) => void;
  /** 是否有语法错误 */
  hasSyntaxErrors?: boolean;
}

/**
 * SolarWire 预览组件
 * 提供可视化编辑功能，包括元素拖拽、缩放、选择等交互
 */
function SolarWirePreview({ selectionTool, showNotes = true, isPanMode = false, isSpacePressed = false, snapToGuides = true, showGridProp = false, snapToGridProp = false, gridSizeProp = 20, externalContent, onExternalContentChange, onContextMenu, allowImageElements = true, onRequestExportSvg, hasSyntaxErrors = false }: SolarWirePreviewProps): React.ReactElement {
  // 实例唯一标识，用于区分多个预览实例
  const instanceId = useRef(Math.random().toString(36).substr(2, 9)).current;
  // 选中的元素 ID 列表
  const selectedElements = useSolarWireStore(s => s.selectedElements);
  // 选择元素的方法
  const selectElements = useSolarWireStore(s => s.selectElements);
  // 编辑器内容和设置内容的方法
  const { content, setContent } = useEditorStore();
  // 当前路径和选中的文件
  const { currentPath, selectedFile } = useFileStore();
  // 文件目录
  const fileDir = getFileDir(selectedFile?.path, currentPath);
  // 设置相关的状态
  const { primaryColor } = useSettingsStore();

  // 预览交互状态
  const {
    scale, setScale,                    // 缩放比例和设置方法
    position, setPosition,              // 画布位置和设置方法
    isDraggingCanvas, startCanvasDrag, endCanvasDrag,  // 画布拖拽状态
    dragStart,                          // 拖拽起始位置
    isInitialized, setIsInitialized,    // 初始化状态
    boxSelection, setBoxSelection,      // 框选状态
    dragElementState, setDragElementState,  // 元素拖拽状态
    multiDragElements, setMultiDragElements,  // 多元素拖拽
    resizeHandleState, setResizeHandleState,  // 调整大小句柄状态
    dragPreviewElement, setDragPreviewElement,  // 拖拽预览元素
    hoveredElement, setHoveredElement,  // 悬停元素
    dropOverlay, setDropOverlay,        // 拖放覆盖层
    error: storeError, setError: setStoreError,  // 错误状态
    alignmentGuides, setAlignmentGuides,
    distanceLines, setDistanceLines,
    altKeyPressed, setAltKeyPressed,
    resetInteractionStates,            // 重置交互状态
  } = usePreviewStore();

  // 解析错误状态
  const [parseError, setParseError] = useState<string | null>(null);
  // 上次鼠标位置
  const [lastMousePosition, setLastMousePosition] = useState({ x: 200, y: 200 });

  // 判断是否为外部模式（组件编辑模式）
  const isExternalMode = externalContent !== undefined;
  // 有效内容（外部模式使用外部内容，否则使用编辑器内容）
  const effectiveContent = isExternalMode ? externalContent : content;
  // 有效内容设置方法
  const effectiveSetContent = isExternalMode ? (onExternalContentChange || (() => {})) : setContent;

  // 有效网格设置（网格功能已禁用）
  const effectiveShowGrid = false;
  const effectiveSnapToGrid = false;
  const effectiveGridSize = 20;

  // 创建 RAF 内容更新器，用于优化性能
  const rafUpdater = useMemo(() => createRafContentUpdater(effectiveSetContent), [effectiveSetContent]);

  // SVG 容器引用
  const svgContainerRef = useRef<HTMLDivElement>(null);
  // 图片缓存，避免重复加载
  const imageCacheRef = useRef<Record<string, string>>({});
  // 正在加载的 URL 集合，避免重复加载
  const loadingUrlsRef = useRef<Set<string>>(new Set());
  // 图片缓存版本号，用于触发重新渲染
  const [imageCacheTick, setImageCacheTick] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  // 上次错误引用，用于避免重复显示相同错误
  const prevErrorRef = useRef<string | null>(null);
  // 元素边界缓存，提高性能
  const elementsBoundsCacheRef = useRef<Map<string, { x: number; y: number; w: number; h: number; r: number }>>(new Map());
  // 元素边界缓存版本号
  const elementsBoundsCacheVersionRef = useRef<string>('');

  /**
   * 解析图片 URL
   * 将相对路径转换为绝对路径或使用缓存
   */
  const resolveImageUrl = useCallback((url: string): string => {
    if (url && !url.startsWith('http') && !url.startsWith('data:') && fileDir) {
      return imageCacheRef.current[url] || '';
    }
    return url;
  }, [fileDir, imageCacheTick]);

  /**
   * 解析和渲染 SolarWire 内容
   * 使用 useMemo 缓存结果，避免不必要的重新渲染
   */
  const { svg, ast, viewBox, renderParseError } = useMemo(() => {
    try {
      const safeContent = effectiveContent || '';
      if (!safeContent.trim()) {
        return { svg: '', ast: null, viewBox: null, renderParseError: null };
      }
      // 解析内容为 AST
      const parsedAST = parse(safeContent);
      // 渲染 AST 为 SVG
      const renderedResult = render(parsedAST, {
        disableNotes: !showNotes,       // 是否禁用备注
        selectedElementIds: selectedElements,  // 选中的元素 ID
        primaryColor,                    // 主色调
        sourceInput: safeContent,         // 源输入
        imageUrlResolver: resolveImageUrl,  // 图片 URL 解析器
      }, true) as RenderResultWithMeta;
      return { svg: renderedResult.svg, ast: parsedAST, viewBox: renderedResult.viewBox, renderParseError: null };
    } catch (e: any) {
      // 不在useMemo中调用console.error，避免渲染期间状态更新
      return { svg: '', ast: null, viewBox: null, renderParseError: e.message || String(e) };
    }
  }, [effectiveContent, selectedElements, primaryColor, showNotes, currentPath, resolveImageUrl]);

  const { viewport, getSvgCoords, getTransform, containerRef } = useCoordinateSystem({
    position,
    scale,
    viewBoxOffset: { x: viewBox?.x || 0, y: viewBox?.y || 0 }
  });

  /**
   * 处理图片添加
   * @param assetPath 图片资源路径
   * @param x X 坐标
   * @param y Y 坐标
   * @param size 图片尺寸（可选）
   */
  const handleImageAdded = useCallback((assetPath: string, x: number, y: number, size?: { width: number; height: number }) => {
    // 验证图片路径是否安全
    if (!validateImagePath(assetPath)) {
      feedback.toast.error('Invalid image path');
      return;
    }

    const svgCoords = getSvgCoords(x, y);
    const imagePath = assetPath;
    const safeX = Math.round(svgCoords.x);
    const safeY = Math.round(svgCoords.y);
    const { w, h } = calculateImageSize(size);
    const attrStr = h ? `w=${w} h=${h}` : `w=${w}`;
    const imageElement = `<${imagePath}> @(${safeX}, ${safeY}) ${attrStr}`;
    const newContent = effectiveContent ? `${effectiveContent}\n${imageElement}` : imageElement;
    effectiveSetContent(newContent);
  }, [effectiveContent, effectiveSetContent, getSvgCoords]);

  // 图片拖放处理
  const { handleDragOver: handleImageDragOver, handleDrop: handleImageDrop } = useImageDrop({
    onImageAdded: handleImageAdded,
    fileDir: fileDir || '',
    enablePaste: true,
  });

  // 在useEffect中处理错误，避免渲染期间状态更新
  useEffect(() => {
    if (renderParseError) {
      // 延迟console.error调用，避免在渲染期间触发语法错误服务
      setTimeout(() => {
        console.error('[SolarWirePreview] Parse/Render error:', renderParseError);
      }, 0);
    }
  }, [renderParseError]);

  useEffect(() => {
    const errorFromAst = (ast as any)?.parseError || null;
    if (prevErrorRef.current !== errorFromAst) {
      prevErrorRef.current = errorFromAst;
      setParseError(errorFromAst);
    }
  }, [ast]);

  /**
   * 加载图片资源
   * 从 AST 中提取图片 URL 并加载为 base64 格式
   */
  useEffect(() => {
    if (!ast || !fileDir) {
      imageCacheRef.current = {};
      setImageCacheTick(t => t + 1);
      return;
    }

    const currentImageUrls = new Set<string>();
    // 提取所有图片 URL
    ast.elements.forEach(el => {
      if (el.type === 'image' && (el as any).url) {
        const url = (el as any).url;
        if (url && !url.startsWith('http') && !url.startsWith('data:')) {
          currentImageUrls.add(url);
        }
      }
    });

    // 清理不再使用的图片缓存
    Object.keys(imageCacheRef.current).forEach(cachedUrl => {
      if (!currentImageUrls.has(cachedUrl)) {
        delete imageCacheRef.current[cachedUrl];
      }
    });

    // 找出需要加载的图片
    const imageUrls: string[] = [];
    currentImageUrls.forEach(url => {
      if (!imageCacheRef.current[url] && !loadingUrlsRef.current.has(url)) {
        imageUrls.push(url);
      }
    });

    if (imageUrls.length === 0) return;

    // 异步加载图片
    const loadImages = async () => {
      const api = (window as any).api;
      if (!api || !api.readImageAsBase64 || !fileDir) return;

      for (const url of imageUrls) {
        if (loadingUrlsRef.current.has(url)) continue;
        loadingUrlsRef.current.add(url);

        try {
          const fullPath = `${fileDir}/${url}`;
          const base64 = await api.readImageAsBase64(fullPath);
          if (base64) {
            imageCacheRef.current[url] = base64;
          }
        } catch (e) {
          console.warn(`Failed to load image: ${url}`, e);
        } finally {
          loadingUrlsRef.current.delete(url);
        }
      }

      // 触发重新渲染
      setImageCacheTick(t => t + 1);
    };

    loadImages();
  }, [ast, fileDir]);

  // 初始化缩放
  useEffect(() => {
    if (!isInitialized) {
      setScale(1);
    }
  }, [isInitialized]);

  // 提供 SVG 导出函数
  useEffect(() => {
    if (onRequestExportSvg) {
      onRequestExportSvg(() => svg);
    }
  }, [onRequestExportSvg, svg]);

  /**
   * 适应屏幕
   * 重置缩放和位置到默认值
   */
  const fitToScreen = useCallback(() => {
    if (containerRef.current) {
      // 对于无限画布，我们只需要设置一个默认的缩放比例
      setScale(0.5);
      setPosition({ x: 100, y: 100 });
      setIsInitialized(true);
    }
  }, []);

  // 初始化时适应屏幕
  useEffect(() => {
    if (svg && containerRef.current && !isInitialized) {
      setTimeout(fitToScreen, 50);
    }
  }, [svg, fitToScreen, isInitialized]);

  // 监听容器大小变化，确保坐标系统保持一致
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width: Math.round(width), height: Math.round(height) });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 添加非 passive 的 wheel 事件监听器，以支持 preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /**
     * 处理滚轮缩放
     * 以鼠标位置为中心进行缩放
     */
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(10, scale * delta));

      const scaleRatio = newScale / scale;
      const newX = mouseX - (mouseX - position.x) * scaleRatio;
      const newY = mouseY - (mouseY - position.y) * scaleRatio;

      setScale(newScale);
      setPosition({ x: newX, y: newY });
      setIsInitialized(true);
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [scale, position]);

  /**
   * 处理 React 滚轮事件
   * 以鼠标位置为中心进行缩放
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, scale * delta));

    const scaleRatio = newScale / scale;
    const newX = mouseX - (mouseX - position.x) * scaleRatio;
    const newY = mouseY - (mouseY - position.y) * scaleRatio;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
    setIsInitialized(true);
  }, [scale, position]);

  /**
   * 从 SVG 元素获取元素 ID
   * 向上遍历 DOM 树查找 data-element-id 或 data-line 属性
   */
  const getElementIdFromSVGElement = (element: SVGElement | HTMLElement): string | null => {
    let el: SVGElement | HTMLElement | null = element;
    while (el) {
      const id = el.getAttribute('data-element-id');
      if (id) return id;
      const noteElementId = el.getAttribute('data-note-element-id');
      if (noteElementId) return noteElementId;
      const line = el.getAttribute('data-line');
      if (line) return line;
      el = el.parentElement;
    }
    return null;
  };

  /**
   * 获取元素数据
   * @param elementId 元素 ID（可以是行号或自定义 ID）
   * @returns 元素数据或 null
   */
  const getElementData = useCallback((elementId: string): SolarWireElement | null => {
    if (!ast) return null;
    const lineNum = parseInt(elementId);
    if (isNaN(lineNum)) {
      return ast.elements.find(e => (e as any).id === elementId) || null;
    }
    return ast.elements.find(e => e.location?.line === lineNum) || null;
  }, [ast]);

  /**
   * 计算点到线段的最短距离
   * @param px 点 X 坐标
   * @param py 点 Y 坐标
   * @param x1 线段起点 X
   * @param y1 线段起点 Y
   * @param x2 线段终点 X
   * @param y2 线段终点 Y
   * @returns 最短距离
   */
  const pointToLineDistance = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * 检测鼠标位置是否在线段附近（2px 范围内）
   * @param mouseX 鼠标 X 坐标（SVG 坐标）
   * @param mouseY 鼠标 Y 坐标（SVG 坐标）
   * @param lineElement 线段元素
   * @param tolerance 容差范围（像素）
   * @returns 是否在线段附近
   */
  const isMouseNearLine = useCallback((
    mouseX: number,
    mouseY: number,
    lineElement: SolarWireElement,
    tolerance: number = 2
  ): boolean => {
    if (lineElement.type !== 'line') return false;
    
    const { x1, y1, x2, y2 } = getLineCoordinates(lineElement);
    
    // 计算点到线段的最短距离
    const distance = pointToLineDistance(mouseX, mouseY, x1, y1, x2, y2);
    return distance <= tolerance;
  }, [pointToLineDistance]);

  /**
   * 获取元素边界
   * @param elementId 元素 ID
   * @returns 元素边界 { x, y, w, h, r }
   */
  const getElementBounds = useCallback((elementId: string) => {
    const elementData = getElementData(elementId);
    if (!elementData) return { x: 0, y: 0, w: 0, h: 0, r: 0 };

    // 线段元素使用特殊的边界框计算
    if (elementData.type === 'line') {
      try {
        const { x1, y1, x2, y2 } = getLineCoordinates(elementData);
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const maxX = Math.max(x1, x2);
        const maxY = Math.max(y1, y2);
        return {
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          r: 0
        };
      } catch (e) {
        console.warn('Failed to get line bounds, using fallback', e);
        // Fall back to attribute-based calculation
      }
    }
    
    const attrs = elementData.attributes || {};
    const coords = elementData.coordinates;
    const type = elementData.type;
    
    let x = 0, y = 0, w = 0, h = 0, r = 0;
    
    if (coords && coords.x.type === 'absolute' && coords.y.type === 'absolute') {
      x = coords.x.value;
      y = coords.y.value;
    } else {
      x = parseInt(attrs.x || '0');
      y = parseInt(attrs.y || '0');
    }
    
    switch (type) {
      case 'circle':
        w = parseInt(attrs.w || '100');
        h = parseInt(attrs.h || '40');
        if (attrs.r) {
          const radius = parseInt(attrs.r);
          w = h = radius * 2;
        }
        break;
      case 'text': {
        const lines = (elementData as any).text ? (elementData as any).text.split('\n') : [''];
        const fontSize = parseInt(attrs['text-size'] || attrs['size'] || '12');
        const lineHeight = parseInt(attrs['line-height'] || '22');
        const declaredWidth = parseInt(attrs.w || '0');
        if (declaredWidth) {
          w = declaredWidth;
        } else if (lines.length > 0) {
          const fontFamily = attrs['font-family'] || 'sans-serif';
          const isBold = attrs.bold !== undefined;
          const isItalic = attrs.italic !== undefined;
          const fontStyle = `${isBold ? 'bold' : ''} ${isItalic ? 'italic' : ''} ${fontSize}px ${fontFamily}`.trim();
          const measureCanvas = document.createElement('canvas');
          const ctx = measureCanvas.getContext('2d');
          if (ctx) {
            ctx.font = fontStyle;
            w = Math.max(...lines.map((l: string) => ctx.measureText(l).width));
          } else {
            w = Math.max(...lines.map((l: string) => l.length * fontSize * 0.6));
          }
        } else {
          w = 100;
        }
        h = lines.length > 0 ? lines.length * lineHeight : fontSize;
        break;
      }
      case 'line':
        const x2 = parseInt(attrs.x2 || String(x + 100));
        const y2 = parseInt(attrs.y2 || String(y));
        w = Math.abs(x2 - x);
        h = Math.abs(y2 - y) || 2;
        if (y2 < y) y = y2;
        if (x2 < x) x = x2;
        break;
      default:
        w = parseInt(attrs.w || '100');
        h = parseInt(attrs.h || '50');
        r = parseInt(attrs.r || '0');
    }
    
    return { x, y, w, h, r };
  }, [getElementData, getLineCoordinates]);

  const getElementBoundsFromData = useCallback((
    elementData: ReturnType<typeof getElementData>
  ): { x: number; y: number; w: number; h: number; r: number } => {
    if (!elementData) return { x: 0, y: 0, w: 0, h: 0, r: 0 };

    if (elementData.type === 'line') {
      try {
        const { x1, y1, x2, y2 } = getLineCoordinates(elementData);
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const maxX = Math.max(x1, x2);
        const maxY = Math.max(y1, y2);
        return {
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          r: 0
        };
      } catch (e) {
        // Fall back to attribute-based calculation
      }
    }

    const attrs = elementData.attributes || {};
    const coords = elementData.coordinates;
    const type = elementData.type;

    let x = 0, y = 0, w = 0, h = 0, r = 0;

    if (coords && coords.x.type === 'absolute' && coords.y.type === 'absolute') {
      x = coords.x.value;
      y = coords.y.value;
    } else {
      x = parseInt(attrs.x || '0');
      y = parseInt(attrs.y || '0');
    }

    switch (type) {
      case 'circle':
        w = parseInt(attrs.w || '100');
        h = parseInt(attrs.h || '40');
        if (attrs.r) {
          const radius = parseInt(attrs.r);
          w = h = radius * 2;
        }
        break;
      case 'text':
        const lines = (elementData as any).text ? (elementData as any).text.split('\n') : [''];
        const fontSize = parseInt(attrs['text-size'] || attrs['size'] || '12');
        const lineHeight = parseInt(attrs['line-height'] || '22');
        const declaredWidth = parseInt(attrs.w || '0');
        w = declaredWidth || (lines.length > 0 ? Math.max(...lines.map((l: string) => l.length * fontSize * 0.6)) : 100);
        h = lines.length > 0 ? lines.length * lineHeight : fontSize;
        break;
      case 'line':
        const x2 = parseInt(attrs.x2 || String(x + 100));
        const y2 = parseInt(attrs.y2 || String(y));
        w = Math.abs(x2 - x);
        h = Math.abs(y2 - y) || 2;
        if (y2 < y) y = y2;
        if (x2 < x) x = x2;
        break;
      default:
        w = parseInt(attrs.w || '100');
        h = parseInt(attrs.h || '50');
        r = parseInt(attrs.r || '0');
    }

    return { x, y, w, h, r };
  }, [getLineCoordinates]);

  const getAllElementsBoundsMap = useCallback((
    elements: SolarWireElement[]
  ): Map<string, { x: number; y: number; w: number; h: number; r: number }> => {
    // 生成内容版本号，用于缓存失效
    const contentVersion = `${effectiveContent.length}-${effectiveContent.slice(0, 100)}`;
    
    // 如果内容没有变化，返回缓存
    if (elementsBoundsCacheVersionRef.current === contentVersion && elementsBoundsCacheRef.current.size > 0) {
      return elementsBoundsCacheRef.current;
    }
    
    // 内容变化，重新计算并缓存
    const boundsMap = new Map<string, { x: number; y: number; w: number; h: number; r: number }>();
    elements.forEach((el, idx) => {
      const id = el.location?.line?.toString() || (idx + 1).toString();
      const bounds = getElementBoundsFromData(el);
      boundsMap.set(id, bounds);
    });
    
    elementsBoundsCacheRef.current = boundsMap;
    elementsBoundsCacheVersionRef.current = contentVersion;
    
    return boundsMap;
  }, [effectiveContent, getElementBoundsFromData]);

  const SNAP_THRESHOLD = 6;

  const getCanvasBounds = useCallback(() => {
    return { width: Infinity, height: Infinity };
  }, []);

  const getGroupBounds = useCallback((
    elementIds: string[]
  ): { x: number; y: number; w: number; h: number } | null => {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    elementIds.forEach(id => {
      const bounds = getElementBounds(id);
      if (!bounds) return;

      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.w);
      maxY = Math.max(maxY, bounds.y + bounds.h);
    });

    if (minX === Infinity) return null;

    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY
    };
  }, [getElementBounds]);

  /**
   * 检测鼠标位置附近的所有元素（包括线段）
   * @param svgX 鼠标 X 坐标（SVG 坐标）
   * @param svgY 鼠标 Y 坐标（SVG 坐标）
   * @param tolerance 容差范围（像素）
   * @returns 最近的元素 ID
   */
  const findElementAtPosition = useCallback((
    svgX: number,
    svgY: number,
    tolerance: number = 10
  ): string | null => {
    if (!ast) return null;
    
    // 逆序遍历元素（从z轴最上方开始），返回第一个匹配的元素
    
    // 第一遍：优先检测线段（使用点到线段距离）
    for (let i = ast.elements.length - 1; i >= 0; i--) {
      const element = ast.elements[i];
      const lineNum = element.location?.line;
      if (!lineNum) continue;
      
      if (element.type === 'line') {
        try {
          const { x1, y1, x2, y2 } = getLineCoordinates(element);
          const actualDistance = pointToLineDistance(svgX, svgY, x1, y1, x2, y2);
          
          if (actualDistance <= tolerance) {
            return lineNum.toString();
          }
        } catch (e) {
          console.error(`线段 ${lineNum} 处理失败:`, e);
        }
      }
    }
    
    // 第二遍：检测其他元素（逆序，从z轴最上方开始）
    for (let i = ast.elements.length - 1; i >= 0; i--) {
      const element = ast.elements[i];
      const lineNum = element.location?.line;
      if (!lineNum) continue;
      if (element.type === 'line') continue;
      
      try {
        const bounds = getElementBounds(lineNum.toString());
        const elementLeft = bounds.x;
        const elementRight = bounds.x + bounds.w;
        const elementTop = bounds.y;
        const elementBottom = bounds.y + bounds.h;
        
        const closestX = Math.max(elementLeft, Math.min(svgX, elementRight));
        const closestY = Math.max(elementTop, Math.min(svgY, elementBottom));
        const distance = Math.sqrt(
          Math.pow(svgX - closestX, 2) + Math.pow(svgY - closestY, 2)
        );
        
        if (distance <= tolerance) {
          return lineNum.toString();
        }
      } catch (e) {
        console.warn('获取元素边界失败', lineNum, e);
      }
    }
    
    return null;
  }, [ast, getElementBounds]);

  const testBoxSelection = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    if (!ast) return;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const selected: string[] = [];

    const isIntersectMode = selectionTool === 'box-intersect';

    ast.elements.forEach((element) => {
      const line = element.location?.line;
      if (!line) return;
      
      if (element.type === 'line') {
        try {
          const { x1: lineX1, y1: lineY1, x2: lineX2, y2: lineY2 } = getLineCoordinates(element);
          
          const startInBox = lineX1 >= minX && lineX1 <= maxX && lineY1 >= minY && lineY1 <= maxY;
          const endInBox = lineX2 >= minX && lineX2 <= maxX && lineY2 >= minY && lineY2 <= maxY;
          
          let lineSelected = false;
          if (isIntersectMode) {
            const intersects = !(lineX1 > maxX || lineX2 < minX || lineY1 > maxY || lineY2 < minY);
            lineSelected = startInBox || endInBox || intersects;
          } else {
            lineSelected = startInBox && endInBox;
          }
          
          if (lineSelected) {
            selected.push(line.toString());
          }
        } catch (e) {
          console.warn('Failed to get line coordinates for box selection', line, e);
        }
        return;
      }
      
      const bounds = getElementBounds(line.toString());
      if (bounds.w === 0 && bounds.h === 0) return;

      const elementLeft = bounds.x;
      const elementRight = bounds.x + bounds.w;
      const elementTop = bounds.y;
      const elementBottom = bounds.y + bounds.h;

      let isSelected: boolean;
      if (isIntersectMode) {
        isSelected = !(elementLeft > maxX || elementRight < minX || elementTop > maxY || elementBottom < minY);
      } else {
        isSelected = elementLeft >= minX && elementRight <= maxX &&
          elementTop >= minY && elementBottom <= maxY;
      }

      if (isSelected) {
        selected.push(line.toString());
      }
    });

    selectElements(selected);
  }, [ast, selectElements, getElementBounds]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    containerRef.current?.focus();
    setIsPreviewFocused(true);

    const target = e.target as SVGElement | HTMLElement;
    
    const handleAttr = target.getAttribute('data-handle');
    if (handleAttr) {
      const elementId = target.getAttribute('data-element-id');
      if (elementId) {
        if (handleAttr === 'start' || handleAttr === 'end') {
          // 线段端点句柄
          const elementData = getElementData(elementId);
          if (elementData && elementData.type === 'line') {
            const lineElement = elementData as any;
            
            let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
            
            // 获取起点坐标
            if (lineElement.start && lineElement.start.x && lineElement.start.x.type === 'absolute') {
              x1 = lineElement.start.x.value;
            }
            if (lineElement.start && lineElement.start.y && lineElement.start.y.type === 'absolute') {
              y1 = lineElement.start.y.value;
            }
            
            // 获取终点坐标
            if (lineElement.end) {
              if ((lineElement.end as any).x && (lineElement.end as any).y) {
                // 绝对坐标格式
                if ((lineElement.end as any).x.type === 'absolute') {
                  x2 = (lineElement.end as any).x.value;
                }
                if ((lineElement.end as any).y.type === 'absolute') {
                  y2 = (lineElement.end as any).y.value;
                }
              } else if ((lineElement.end as any).dx !== undefined && (lineElement.end as any).dy !== undefined) {
                // 相对坐标格式
                x2 = x1 + (lineElement.end as any).dx;
                y2 = y1 + (lineElement.end as any).dy;
              }
            }
            
            // 如果没有找到终点，使用默认值
            if (x2 === 0 && y2 === 0) {
              x2 = x1 + 100;
              y2 = y1;
            }
            
            setResizeHandleState({
              elementId,
              handle: handleAttr as 'start' | 'end',
              startX: e.clientX,
              startY: e.clientY,
              elementX: x1,
              elementY: y1,
              elementX2: x2,
              elementY2: y2
            });
            return;
          }
        } else {
          // 普通调整句柄（角 + 边）
          const bounds = getElementBounds(elementId);
          setResizeHandleState({
            elementId,
            handle: handleAttr as ResizeHandleState['handle'],
            startX: e.clientX,
            startY: e.clientY,
            elementX: bounds.x,
            elementY: bounds.y,
            elementW: bounds.w,
            elementH: bounds.h
          });
          return;
        }
      }
    }

    let elementId = getElementIdFromSVGElement(target);
    const currentTool = (isPanMode || isSpacePressed) ? 'pan' : selectionTool;

    // 如果没有直接获取到元素 ID，尝试检测附近的元素（10px 容差）
    if (!elementId && (currentTool === 'select' || currentTool === 'box-include' || currentTool === 'box-intersect')) {
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      elementId = findElementAtPosition(svgCoords.x, svgCoords.y, 10);
    }

    switch (currentTool) {
      case 'pan':
        startCanvasDrag(e.clientX - position.x, e.clientY - position.y);
        break;

      case 'select':
      case 'box-include':
      case 'box-intersect':
        if (elementId) {
          // 点击到元素时，点选
          const elementData = getElementData(elementId);
          const isLine = elementData?.type === 'line';
          
          let dragState: DragElementState;
          
          // 线段元素使用 getLineCoordinates 获取实际起点 (x1, y1)
          if (isLine && elementData) {
            const lineCoords = getLineCoordinates(elementData);
            dragState = {
              elementId,
              startX: e.clientX,
              startY: e.clientY,
              elementX: lineCoords.x1,
              elementY: lineCoords.y1,
              elementX2: lineCoords.x2,
              elementY2: lineCoords.y2,
              isLine: true
            };
          } else {
            const bounds = getElementBounds(elementId);
            dragState = {
              elementId,
              startX: e.clientX,
              startY: e.clientY,
              elementX: bounds.x,
              elementY: bounds.y,
              elementW: bounds.w,
              elementH: bounds.h
            } as any;
          }
          
          setDragElementState(dragState);
          
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            // Shift+Click / Ctrl+Click / Cmd+Click：切换选中状态
            if (selectedElements.includes(elementId)) {
              selectElements(selectedElements.filter(id => id !== elementId));
            } else {
              selectElements([...selectedElements, elementId]);
            }
          } else {
            // 普通点击：如果点击的元素已在选中且选中多个，保持多选并开始拖拽
            if (!selectedElements.includes(elementId)) {
              selectElements([elementId]);
            } else if (selectedElements.length > 1) {
              // 多选状态下，捕获所有选中元素的初始位置
              const initialPositions: MultiDragState[] = [];
              selectedElements.forEach((id) => {
                const elData = getElementData(id);
                const elIsLine = elData?.type === 'line';
                if (elIsLine && elData) {
                  const lineCoords = getLineCoordinates(elData);
                  initialPositions.push({
                    elementId: id,
                    startX: e.clientX,
                    startY: e.clientY,
                    elementX: lineCoords.x1,
                    elementY: lineCoords.y1,
                    elementX2: lineCoords.x2,
                    elementY2: lineCoords.y2,
                    isLine: true
                  });
                } else {
                  const bounds = getElementBounds(id);
                  initialPositions.push({
                    elementId: id,
                    startX: e.clientX,
                    startY: e.clientY,
                    elementX: bounds.x,
                    elementY: bounds.y,
                    elementW: bounds.w,
                    elementH: bounds.h
                  } as any);
                }
              });
              setMultiDragElements(initialPositions);
              setDragElementState(null);
            }
          }
        } else if (currentTool === 'box-include' || currentTool === 'box-intersect') {
          // 框选模式下，点击空白处开始框选（使用屏幕坐标）
          setBoxSelection({
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY
          });
        } else {
          startCanvasDrag(e.clientX - position.x, e.clientY - position.y);
          selectElements([]);
        }
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const svgCoords = getSvgCoords(e.clientX, e.clientY);
    setLastMousePosition({
      x: svgCoords.x,
      y: svgCoords.y
    });

    if (isDraggingCanvas || ((isPanMode || isSpacePressed) && isDraggingCanvas)) {
      if (isDraggingCanvas) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
      return;
    }

    if (resizeHandleState) {
      // 获取当前鼠标在SVG坐标系中的位置
      const currentCoords = getSvgCoords(e.clientX, e.clientY);
      // 获取起始鼠标在SVG坐标系中的位置
      const startCoords = getSvgCoords(resizeHandleState.startX, resizeHandleState.startY);
      
      const dx = currentCoords.x - startCoords.x;
      const dy = currentCoords.y - startCoords.y;
      
      if (resizeHandleState.handle === 'start' || resizeHandleState.handle === 'end') {
          // 线段端点拖拽
          const lineNum = parseInt(resizeHandleState.elementId);
          if (!isNaN(lineNum)) {
            const lines = effectiveContent.split(/\r?\n/);
            if (lineNum > 0 && lineNum <= lines.length) {
              let line = lines[lineNum - 1];
              
              // 获取当前的起点和终点坐标
              let x1 = resizeHandleState.elementX;
              let y1 = resizeHandleState.elementY;
              let x2 = resizeHandleState.elementX2 || x1 + 100;
              let y2 = resizeHandleState.elementY2 || y1;
              
              const origX1 = x1, origY1 = y1, origX2 = x2, origY2 = y2;
              
              if (resizeHandleState.handle === 'start') {
                x1 = Math.round(origX1 + dx);
                y1 = Math.round(origY1 + dy);
              } else {
                x2 = Math.round(origX2 + dx);
                y2 = Math.round(origY2 + dy);
              }
              
              if (e.shiftKey) {
                let currentDx: number, currentDy: number;
                if (resizeHandleState.handle === 'start') {
                  currentDx = currentCoords.x - origX2;
                  currentDy = currentCoords.y - origY2;
                } else {
                  currentDx = currentCoords.x - origX1;
                  currentDy = currentCoords.y - origY1;
                }
                
                const absDx = Math.abs(currentDx);
                const absDy = Math.abs(currentDy);
                
                if (absDx >= absDy) {
                  if (resizeHandleState.handle === 'start') {
                    y1 = origY2;
                  } else {
                    y2 = origY1;
                  }
                } else {
                  if (resizeHandleState.handle === 'start') {
                    x1 = origX2;
                  } else {
                    x2 = origX1;
                  }
                }
              }
              
              // 检查线段的格式
              if (line.includes('->')) {
                // 已经是 -- @(x,y)->(x2,y2) 格式，直接更新
                // 先移除任何现有的 x2, y2 属性
                line = line.replace(/\s+x2=[\d]+/g, '');
                line = line.replace(/\s+y2=[\d]+/g, '');
                // 然后更新起点和终点
                line = line.replace(/--\s*@\(-?[\d]+,\s*-?[\d]+\)->\(-?[\d]+,\s*-?[\d]+\)/, `-- @(${x1}, ${y1})->(${x2}, ${y2})`);
              } else {
                // 不是标准格式，转换为 -- @(x,y)->(x2,y2) 格式
                // 先移除任何现有的 x, y, x2, y2 属性
                line = line.replace(/\s+x=[\d]+/g, '');
                line = line.replace(/\s+y=[\d]+/g, '');
                line = line.replace(/\s+x2=[\d]+/g, '');
                line = line.replace(/\s+y2=[\d]+/g, '');
                // 然后添加新的格式
                if (line.startsWith('--')) {
                  line = `-- @(${x1}, ${y1})->(${x2}, ${y2})` + line.substring(2);
                } else {
                  line = `-- @(${x1}, ${y1})->(${x2}, ${y2}) ` + line;
                }
              }
              
              lines[lineNum - 1] = line;
              rafUpdater(lines.join('\n'));
            }
          }
          return;
        }
      
      let newX = resizeHandleState.elementX;
      let newY = resizeHandleState.elementY;
      let newW = resizeHandleState.elementW ?? 0;
      let newH = resizeHandleState.elementH ?? 0;

      const startW = resizeHandleState.elementW ?? 0;
      const startH = resizeHandleState.elementH ?? 0;
      const aspectRatio = startH !== 0 ? startW / startH : 1;

      const isShiftPressed = e.shiftKey;

      if (isShiftPressed) {
        // 等比例缩放逻辑
        switch (resizeHandleState.handle) {
          case 'nw':
          case 'ne':
          case 'se':
          case 'sw':
            {
              const isRight = resizeHandleState.handle === 'se' || resizeHandleState.handle === 'ne';
              const scaleFactor = isRight
                ? (startW + dx) / startW
                : (startW - dx) / startW;
              
              newW = Math.max(10, Math.round(startW * scaleFactor));
              newH = Math.max(10, Math.round(newW / aspectRatio));
              
              const adjustX = resizeHandleState.handle.includes('w');
              const adjustY = resizeHandleState.handle.includes('n');
              newX = resizeHandleState.elementX + (adjustX ? startW - newW : 0);
              newY = resizeHandleState.elementY + (adjustY ? startH - newH : 0);
            }
            break;
          case 'n':
          case 's':
            {
              const rawH = resizeHandleState.handle === 's' ? startH + dy : startH - dy;
              newH = Math.max(10, Math.round(rawH));
              newW = Math.max(10, Math.round(newH * aspectRatio));
              if (resizeHandleState.handle === 'n') {
                newY = resizeHandleState.elementY + (startH - newH);
              }
            }
            break;
          case 'e':
          case 'w':
            {
              const rawW = resizeHandleState.handle === 'e' ? startW + dx : startW - dx;
              newW = Math.max(10, Math.round(rawW));
              newH = Math.max(10, Math.round(newW / aspectRatio));
              if (resizeHandleState.handle === 'w') {
                newX = resizeHandleState.elementX + (startW - newW);
              }
            }
            break;
        }
      } else {
        // 原有自由缩放逻辑
        switch (resizeHandleState.handle) {
          case 'nw':
            newX = Math.round(resizeHandleState.elementX + dx);
            newY = Math.round(resizeHandleState.elementY + dy);
            newW = Math.round(startW - dx);
            newH = Math.round(startH - dy);
            break;
          case 'n':
            newY = Math.round(resizeHandleState.elementY + dy);
            newH = Math.round(startH - dy);
            break;
          case 'ne':
            newY = Math.round(resizeHandleState.elementY + dy);
            newW = Math.round(startW + dx);
            newH = Math.round(startH - dy);
            break;
          case 'e':
            newW = Math.round(startW + dx);
            break;
          case 's':
            newH = Math.round(startH + dy);
            break;
          case 'se':
            newW = Math.round(startW + dx);
            newH = Math.round(startH + dy);
            break;
          case 'w':
            newX = Math.round(resizeHandleState.elementX + dx);
            newW = Math.round(startW - dx);
            break;
          case 'sw':
            newX = Math.round(resizeHandleState.elementX + dx);
            newW = Math.round(startW - dx);
            newH = Math.round(startH + dy);
            break;
        }
      }

      if (newW >= 10 && newH >= 10) {
        const lineNum = parseInt(resizeHandleState.elementId);
        if (!isNaN(lineNum)) {
          const elements = ast?.elements || [];

          setAlignmentGuides([]);
          setDistanceLines([]);

          // 获取元素边界信息，确定正确的属性行
          const bounds = detectElementBounds(effectiveContent, lineNum);
          const attributeLine = bounds.attributeLine;

          let newContent = updateLineAttribute(effectiveContent, attributeLine, 'x', newX);
          newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);
          newContent = updateLineAttribute(newContent, attributeLine, 'w', newW);
          newContent = updateLineAttribute(newContent, attributeLine, 'h', newH);
          rafUpdater(newContent);
        }
      }
      return;
    }

    if (dragElementState) {
      // 获取当前鼠标在 SVG 坐标系中的位置
      const currentCoords = getSvgCoords(e.clientX, e.clientY);
      // 获取起始鼠标在 SVG 坐标系中的位置
      const startCoords = getSvgCoords(dragElementState.startX, dragElementState.startY);
      
      let dx = currentCoords.x - startCoords.x;
      let dy = currentCoords.y - startCoords.y;
      
      const elements = ast?.elements || [];
      const elementW = (dragElementState as any).elementW || 100;
      const elementH = (dragElementState as any).elementH || 50;
      
      const useGridSnap = effectiveShowGrid && effectiveSnapToGrid;

      if (dragElementState.isLine) {
        setAlignmentGuides([]);
        setDistanceLines([]);
      } else if (snapToGuides) {
        const newX = dragElementState.elementX + dx;
        const newY = dragElementState.elementY + dy;
        const currentBounds = { x: newX, y: newY, w: elementW, h: elementH };
        const excludeIds = [dragElementState.elementId];

        const allElementsBoundsMap = getAllElementsBoundsMap(elements);
        const snapElements: SnapElement[] = elements.map((el: SolarWireElement, idx: number) => {
          const id = el.location?.line?.toString() || (idx + 1).toString();
          const b = allElementsBoundsMap.get(id);
          return { id, bounds: { x: b?.x ?? 0, y: b?.y ?? 0, w: b?.w ?? 0, h: b?.h ?? 0 } };
        }).filter(e => !(e.bounds.w === 0 && e.bounds.h === 0));

        const allGuides = collectAllGuides({
          currentBounds,
          excludeIds,
          elements: snapElements,
          threshold: SNAP_THRESHOLD,
        });

        const activeEdges = getActiveEdgesForMove();
        const snapped = computeSnap(allGuides, newX, newY, elementW, elementH, activeEdges, SNAP_THRESHOLD);

        if (snapped.snapped) {
          dx = snapped.x - dragElementState.elementX;
          dy = snapped.y - dragElementState.elementY;
        }

        setAlignmentGuides([...snapped.snappedGuides]);

        const distances = calculateDistances(
          { x: snapped.x, y: snapped.y, w: elementW, h: elementH },
          snapElements,
          excludeIds
        );
        setDistanceLines(distances);
      } else {
        setAlignmentGuides([]);
        setDistanceLines([]);
      }

      const lineNum = parseInt(dragElementState.elementId);
      if (!isNaN(lineNum)) {
        if (dragElementState.isLine) {
          const lines = effectiveContent.split(/\r?\n/);
          const line = lines[lineNum - 1];
          const isEndRelative = line.includes('->(') && !line.includes('x2=') && !line.includes('y2=');
          handleLineDrag(
            effectiveContent,
            lineNum,
            dragElementState.elementX,
            dragElementState.elementY,
            dragElementState.elementX2,
            dragElementState.elementY2,
            dx,
            dy,
            rafUpdater,
            isEndRelative
          );
        } else {
          const gridSnapSize = useGridSnap ? 10 : 0;
          
          handleElementDrag(
            effectiveContent,
            lineNum,
            dragElementState.elementX,
            dragElementState.elementY,
            dx,
            dy,
            rafUpdater,
            useGridSnap,
            gridSnapSize
          );
        }
      }
      return;
    }

    if (multiDragElements.length > 0) {
      const currentCoords = getSvgCoords(e.clientX, e.clientY);
      
      // 使用所有元素的平均起始位置作为参考点，而不是第一个元素
      const avgStartX = multiDragElements.reduce((sum, el) => sum + el.startX, 0) / multiDragElements.length;
      const avgStartY = multiDragElements.reduce((sum, el) => sum + el.startY, 0) / multiDragElements.length;
      const startCoords = getSvgCoords(avgStartX, avgStartY);
      
      let dx = currentCoords.x - startCoords.x;
      let dy = currentCoords.y - startCoords.y;
      
      const groupBounds = getGroupBounds(multiDragElements.map(e => e.elementId));
      if (!groupBounds) {
        rafUpdater(effectiveContent);
        return;
      }

      // 多选元素智能吸附
      if (snapToGuides) {
        const newX = groupBounds.x + dx;
        const newY = groupBounds.y + dy;

        const excludeIds = multiDragElements.map(e => e.elementId);
        const otherElements = (ast?.elements || []).filter((el: SolarWireElement, idx: number) => {
          const id = el.location?.line?.toString() || (idx + 1).toString();
          return !excludeIds.includes(id);
        });

        const otherElementsBoundsMap = getAllElementsBoundsMap(otherElements);
        const snapElements: SnapElement[] = otherElements.map((el: SolarWireElement, idx: number) => {
          const id = el.location?.line?.toString() || (idx + 1).toString();
          const b = otherElementsBoundsMap.get(id);
          return { id, bounds: { x: b?.x ?? 0, y: b?.y ?? 0, w: b?.w ?? 0, h: b?.h ?? 0 } };
        }).filter(e => !(e.bounds.w === 0 && e.bounds.h === 0));

        const allGuides = collectAllGuides({
          currentBounds: groupBounds,
          excludeIds,
          elements: snapElements,
          threshold: SNAP_THRESHOLD,
        });

        const activeEdges = getActiveEdgesForMove();
        const snapped = computeSnap(allGuides, newX, newY, groupBounds.w, groupBounds.h, activeEdges, SNAP_THRESHOLD);

        dx += snapped.snapped ? snapped.x - newX : 0;
        dy += snapped.snapped ? snapped.y - newY : 0;

        setAlignmentGuides([...snapped.snappedGuides]);

        const distances = calculateDistances(
          { x: snapped.x, y: snapped.y, w: groupBounds.w, h: groupBounds.h },
          snapElements,
          excludeIds
        );
        setDistanceLines(distances);

        const gridSnapSize = 10;
        const snappedDx = Math.round(dx / gridSnapSize) * gridSnapSize;
        const snappedDy = Math.round(dy / gridSnapSize) * gridSnapSize;
        dx = snappedDx;
        dy = snappedDy;
      } else {
        setAlignmentGuides([]);
        setDistanceLines([]);
      }

      let newContent = effectiveContent;
      
      multiDragElements.forEach((el) => {
        const lineNum = parseInt(el.elementId);
        if (isNaN(lineNum)) return;
        
        // 获取元素边界信息，确定正确的属性行
        const bounds = detectElementBounds(effectiveContent, lineNum);
        const attributeLine = bounds.attributeLine;
        
        let finalX = Math.round(el.elementX + dx);
        let finalY = Math.round(el.elementY + dy);
        
        if (el.isLine) {
          if (el.elementX2 !== undefined && el.elementY2 !== undefined) {
            const originalDx = el.elementX2 - el.elementX;
            const originalDy = el.elementY2 - el.elementY;
            let newX2 = finalX + originalDx;
            let newY2 = finalY + originalDy;
            
            newContent = updateLineAttribute(newContent, attributeLine, 'x', finalX);
            newContent = updateLineAttribute(newContent, attributeLine, 'y', finalY);
            newContent = updateLineAttribute(newContent, attributeLine, 'x2', newX2);
            newContent = updateLineAttribute(newContent, attributeLine, 'y2', newY2);
          }
        } else {
          // dx和dy已经统一应用了网格吸附，这里直接使用
          newContent = updateLineAttribute(newContent, attributeLine, 'x', finalX);
          newContent = updateLineAttribute(newContent, attributeLine, 'y', finalY);
        }
      });
      
      rafUpdater(newContent);
      return;
    }

    if (boxSelection) {
      // 使用屏幕坐标更新框选框
      setBoxSelection({
        ...boxSelection,
        currentX: e.clientX,
        currentY: e.clientY
      });
    } else {
      const hoveredElement = document.elementFromPoint(e.clientX, e.clientY);
      const elementId = hoveredElement ? getElementIdFromSVGElement(hoveredElement as SVGElement) : null;
      setHoveredElement(elementId);
    }

    if (!dragElementState && multiDragElements.length === 0 && !resizeHandleState && !dragPreviewElement) {
      if (altKeyPressed && selectedElements.length > 0 && hoveredElement) {
        const selectedId = selectedElements[0];
        if (selectedId !== hoveredElement) {
          const selectedBounds = getElementBounds(selectedId);
          const hoveredBounds = getElementBounds(hoveredElement);
          if (selectedBounds && hoveredBounds &&
              !(selectedBounds.w === 0 && selectedBounds.h === 0) &&
              !(hoveredBounds.w === 0 && hoveredBounds.h === 0)) {
            const snapElements: SnapElement[] = [{ id: hoveredElement, bounds: hoveredBounds }];
            const distances = calculateDistances(selectedBounds, snapElements, []);
            setDistanceLines(distances);
          }
        }
      } else if (altKeyPressed && selectedElements.length > 0 && !hoveredElement) {
        setDistanceLines([]);
      }
    }

    if (!altKeyPressed && selectedElements.length > 0 && !dragElementState && multiDragElements.length === 0 && !resizeHandleState) {
      const selectedId = selectedElements[0];
      const selectedBounds = getElementBounds(selectedId);
      if (selectedBounds && !(selectedBounds.w === 0 && selectedBounds.h === 0)) {
        const elements = ast?.elements || [];
        const allElementsBoundsMap = getAllElementsBoundsMap(elements);
        const snapElements: SnapElement[] = elements.map((el: SolarWireElement, idx: number) => {
          const id = el.location?.line?.toString() || (idx + 1).toString();
          const b = allElementsBoundsMap.get(id);
          return { id, bounds: { x: b?.x ?? 0, y: b?.y ?? 0, w: b?.w ?? 0, h: b?.h ?? 0 } };
        }).filter(e => !(e.bounds.w === 0 && e.bounds.h === 0) && e.id !== selectedId);

        let nearestElement: SnapElement | null = null;
        let nearestDist = Infinity;
        for (const el of snapElements) {
          const cx1 = selectedBounds.x + selectedBounds.w / 2;
          const cy1 = selectedBounds.y + selectedBounds.h / 2;
          const cx2 = el.bounds.x + el.bounds.w / 2;
          const cy2 = el.bounds.y + el.bounds.h / 2;
          const dist = Math.sqrt((cx1 - cx2) ** 2 + (cy1 - cy2) ** 2);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestElement = el;
          }
        }

        if (nearestElement) {
          const distances = calculateDistances(selectedBounds, [nearestElement], []);
          setDistanceLines(distances);
        } else {
          setDistanceLines([]);
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      endCanvasDrag();
      return;
    }

    if (resizeHandleState) {
      setResizeHandleState(null);
      return;
    }

    if (dragElementState) {
      setDragElementState(null);
      setAlignmentGuides([]);
      return;
    }

    if (multiDragElements.length > 0) {
      setMultiDragElements([]);
      setAlignmentGuides([]);
      return;
    }

    if (boxSelection) {
      const startCoords = getSvgCoords(boxSelection.startX, boxSelection.startY);
      const currentCoords = getSvgCoords(boxSelection.currentX, boxSelection.currentY);
      testBoxSelection(
        startCoords.x,
        startCoords.y,
        currentCoords.x,
        currentCoords.y
      );
      setBoxSelection(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    if (dragPreviewElement) {
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      setDragPreviewElement({
        ...dragPreviewElement,
        x: Math.round(svgCoords.x),
        y: Math.round(svgCoords.y)
      });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();

    const plainText = e.dataTransfer.getData('text/plain');
    if (plainText) {
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      setDragPreviewElement({
        type: 'component',
        x: Math.round(svgCoords.x),
        y: Math.round(svgCoords.y),
        code: plainText
      });
      return;
    }

    const jsonData = e.dataTransfer.getData('application/json');
    if (!jsonData) return;

    try {
      const elementData = JSON.parse(jsonData);
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      setDragPreviewElement({
        type: elementData.type,
        x: Math.round(svgCoords.x),
        y: Math.round(svgCoords.y)
      });
    } catch (error) {
      console.error('Drag enter error:', error);
    }
  };

  const handleDragLeave = () => {
    setDragPreviewElement(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragPreviewElement(null);

    try {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      
      if (imageFiles.length > 0) {
        // 不需要再次调用 handleImageDrop，因为它的实现已经在 useImageDrop hook 中处理了 preventDefault
        // 直接调用 onImageAdded 回调
        const svgCoords = getSvgCoords(e.clientX, e.clientY);
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          try {
            const relativePath = await saveImageToAssetsDir(file, fileDir || '');
            const size = await getImageSizeFromBlob(file);
            handleImageAdded(relativePath, e.clientX + i * 20, e.clientY + i * 20, size);
          } catch (error) {
            console.error('Failed to save image:', error);
            feedback.toast.error(`Failed to save image: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        return;
      }

      const plainText = e.dataTransfer.getData('text/plain');
      if (plainText) {
        // 验证拖放内容是否安全
        if (!validateDropContent(plainText)) {
          feedback.toast.error('Invalid or unsafe content');
          return;
        }
        
        const svgCoords = getSvgCoords(e.clientX, e.clientY);
        const x = Math.round(svgCoords.x);
        const y = Math.round(svgCoords.y);

        const originalLines = plainText.split(/\r?\n/);
        const noteLineIndices = new Set<number>();
        for (let i = 0; i < originalLines.length; i++) {
          if (isInsideMultilineNoteContent(originalLines, i)) {
            noteLineIndices.add(i);
          }
        }

        const adjustedCode = originalLines
          .map((line, lineIndex) => {
            if (noteLineIndices.has(lineIndex)) {
              return line;
            }

            let resultLine = line;

            resultLine = resultLine.replace(
              /@\((\d+),\s*(\d+)\)/g,
              (match) => {
                const m = match.match(/@\((\d+),\s*(\d+)\)/);
                if (m) {
                  const nx = x + parseInt(m[1], 10);
                  const ny = y + parseInt(m[2], 10);
                  return `@(${nx},${ny})`;
                }
                return match;
              }
            );

            resultLine = resultLine.replace(
              /->\(\s*(\d+)\s*,\s*(\d+)\s*\)/g,
              (match) => {
                const m = match.match(/->\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
                if (m) {
                  const nx = x + parseInt(m[1], 10);
                  const ny = y + parseInt(m[2], 10);
                  return `->(${nx},${ny})`;
                }
                return match;
              }
            );

            return resultLine;
          })
          .join('\n');

        const currentContent = effectiveContent || '';
        const newContent = currentContent.trimEnd() + '\n\n' + adjustedCode;
        effectiveSetContent(newContent);

        const existingLineCount = currentContent.trimEnd().split(/\r?\n/).length;
        setTimeout(() => {
          try {
            const ast = parse(newContent);
            const newElementIds = ast.elements
              .filter((el: SolarWireElement) => (el.location?.line ?? 0) > existingLineCount)
              .map((el: SolarWireElement) => String(el.location?.line));
            if (newElementIds.length > 0) {
              useSolarWireStore.getState().selectElements(newElementIds);
            }
          } catch {}
        }, 50);

        return;
      }

      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) return;

      const elementData = JSON.parse(jsonData);
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      const x = Math.round(svgCoords.x);
      const y = Math.round(svgCoords.y);

      let newLine = '';
      switch (elementData.type) {
        case 'rectangle':
          newLine = `["Rectangle"] @(${x},${y}) w=100 h=50`;
          break;
        case 'circle':
          newLine = `("Circle") @(${x},${y})`;
          break;
        case 'text':
          newLine = `"Text" @(${x},${y})`;
          break;
        case 'line':
          newLine = `-- @(${x},${y})->(${x + 100},${y})`;
          break;
        case 'image':
          if (!allowImageElements) {
            feedback.toast.error('Image elements are not allowed in component editing mode');
            return;
          }
          {
            const api = (window as any).api;
            if (!api || !api.openFileDialog) {
              feedback.toast.error('File dialog not available');
              return;
            }
            const projectDir = getProjectDir(currentPath, selectedFile?.path);
            if (!projectDir) {
              feedback.toast.error('Please open a project directory first');
              return;
            }
            try {
              const paths = await api.openFileDialog({
                properties: ['openFile'],
                filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
              });
              if (!paths || paths.length === 0) return;
              const filePath = paths[0];
              const fileName = filePath.split(/[\\/]/).pop() || 'image.png';
              const timestamp = Date.now();
              const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
              const relativePath = `assets/images/${timestamp}_${sanitizedName}`;

              feedback.toast.info('Copying image...');

              try {
                await api.ensureDir(`${projectDir}/assets/images`);
              } catch (dirErr) {
                const errMsg = dirErr instanceof Error ? dirErr.message : String(dirErr);
                feedback.toast.error(`Failed to create assets directory: ${errMsg}`);
                return;
              }
              try {
                await api.copyFile(filePath, `${projectDir}/${relativePath}`);
              } catch (copyErr) {
                const errMsg = copyErr instanceof Error ? copyErr.message : String(copyErr);
                feedback.toast.error(`Failed to copy image file: ${errMsg}`);
                return;
              }

              feedback.toast.success('Image added successfully');

              const img = new Image();
              img.onload = () => {
                const aspect = img.width / img.height;
                const maxDim = 400;
                let w = Math.min(maxDim, img.width);
                let h = w / aspect;
                if (h > maxDim) { h = maxDim; w = h * aspect; }
                const line = `<${relativePath}> @(${x},${y}) w=${Math.round(w)} h=${Math.round(h)}`;
                const currentContent = effectiveContent || '';
                const newContent = currentContent.trimEnd() + '\n' + line;
                effectiveSetContent(newContent);
              };
              img.onerror = () => {
                const line = `<${relativePath}> @(${x},${y})`;
                const currentContent = effectiveContent || '';
                const newContent = currentContent.trimEnd() + '\n' + line;
                effectiveSetContent(newContent);
              };
              img.src = filePath;
            } catch (err) {
              console.error('Image insert failed:', err);
              const errMsg = err instanceof Error ? err.message : String(err);
              feedback.toast.error(`Failed to add image: ${errMsg}`);
            }
            return;
          }
        case 'placeholder':
          newLine = `[?"Placeholder"] @(${x},${y}) w=100 h=50`;
          break;
        case 'table':
          newLine = `## @(${x},${y}) w=200 h=100`;
          break;
        default:
          return;
      }

      const currentContent = effectiveContent || '';
      const newContent = currentContent.trimEnd() + '\n' + newLine;
      effectiveSetContent(newContent);

    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const handleDragOverCombined = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    if (dragPreviewElement) {
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      setDragPreviewElement({
        ...dragPreviewElement,
        x: Math.round(svgCoords.x),
        y: Math.round(svgCoords.y)
      });
    }

    handleImageDragOver(e);
  };

  const renderBoxSelection = () => {
    if (!boxSelection) return null;

    const startCoords = getSvgCoords(boxSelection.startX, boxSelection.startY);
    const currentCoords = getSvgCoords(boxSelection.currentX, boxSelection.currentY);

    const x = Math.min(startCoords.x, currentCoords.x);
    const y = Math.min(startCoords.y, currentCoords.y);
    const width = Math.abs(currentCoords.x - startCoords.x);
    const height = Math.abs(currentCoords.y - startCoords.y);

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={hexToRgba(primaryColor, 0.1)}
        stroke={primaryColor}
        strokeWidth={2 / scale}
        strokeDasharray={`${4 / scale},${4 / scale}`}
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  const renderHoverHighlight = () => {
    if (!hoveredElement) return null;

    const bounds = getElementBounds(hoveredElement);
    if (bounds.w === 0 && bounds.h === 0) return null;

    return (
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.w}
        height={bounds.h}
        fill="none"
        stroke={primaryColor}
        strokeWidth={1 / scale}
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  const getComponentPreviewBounds = (code: string, mouseX: number, mouseY: number) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const lines = code.split(/\r?\n/);
    for (const line of lines) {
      const coordMatches = line.matchAll(/@((\d+),\s*(\d+))/g);
      for (const match of coordMatches) {
        const ex = parseInt(match[2], 10);
        const ey = parseInt(match[3], 10);
        minX = Math.min(minX, ex);
        minY = Math.min(minY, ey);
        maxX = Math.max(maxX, ex);
        maxY = Math.max(maxY, ey);
      }

      const lineEndMatches = line.matchAll(/->\((\d+),\s*(\d+)\)/g);
      for (const match of lineEndMatches) {
        const ex = parseInt(match[2], 10);
        const ey = parseInt(match[3], 10);
        maxX = Math.max(maxX, ex);
        maxY = Math.max(maxY, ey);
      }

      const widthMatch = line.match(/w=(\d+)/);
      const heightMatch = line.match(/h=(\d+)/);
      if (widthMatch && heightMatch) {
        const lastCoordMatch = [...line.matchAll(/@((\d+),\s*(\d+))/g)].pop();
        if (lastCoordMatch) {
          const ex = parseInt(lastCoordMatch[2], 10) + parseInt(widthMatch[1], 10);
          const ey = parseInt(lastCoordMatch[3], 10) + parseInt(heightMatch[1], 10);
          maxX = Math.max(maxX, ex);
          maxY = Math.max(maxY, ey);
        }
      }
    }

    if (minX === Infinity) {
      return { x: mouseX, y: mouseY, width: 100, height: 50 };
    }

    const width = maxX - minX + 20;
    const height = maxY - minY + 20;

    return {
      x: mouseX,
      y: mouseY,
      width,
      height
    };
  };

  const renderDragPreview = () => {
    if (!dragPreviewElement) return null;

    const { type, x, y } = dragPreviewElement;

    // 根据元素类型渲染不同的预览形状
    switch (type) {
      case 'rectangle':
        return (
          <rect
            x={x}
            y={y}
            width={100}
            height={50}
            fill={hexToRgba(primaryColor, 0.3)}
            stroke={primaryColor}
            strokeWidth={2 / scale}
            strokeDasharray="4,4"
            style={{ pointerEvents: 'none' }}
          />
        );
      case 'rounded-rectangle':
        return (
          <rect
            x={x}
            y={y}
            width={100}
            height={50}
            rx={6}
            ry={6}
            fill={hexToRgba(primaryColor, 0.3)}
            stroke={primaryColor}
            strokeWidth={2 / scale}
            strokeDasharray="4,4"
            style={{ pointerEvents: 'none' }}
          />
        );
      case 'circle':
        return (
          <ellipse
            cx={x + 50}
            cy={y + 20}
            rx={50}
            ry={20}
            fill={hexToRgba(primaryColor, 0.3)}
            stroke={primaryColor}
            strokeWidth={2 / scale}
            strokeDasharray="4,4"
            style={{ pointerEvents: 'none' }}
          />
        );
      case 'text':
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={x}
              y={y}
              width={80}
              height={20}
              fill={hexToRgba(primaryColor, 0.3)}
              stroke={primaryColor}
              strokeWidth={2 / scale}
              strokeDasharray="4,4"
            />
            <text
              x={x + 5}
              y={y + 15}
              fontSize={12 / scale}
              fill={primaryColor}
              style={{ userSelect: 'none' }}
            >
              Text
            </text>
          </g>
        );
      case 'line':
        return (
          <line
            x1={x}
            y1={y}
            x2={x + 100}
            y2={y}
            stroke={primaryColor}
            strokeWidth={2 / scale}
            strokeDasharray="4,4"
            style={{ pointerEvents: 'none' }}
          />
        );
      case 'image':
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={x}
              y={y}
              width={100}
              height={80}
              fill={hexToRgba(primaryColor, 0.15)}
              stroke={primaryColor}
              strokeWidth={2 / scale}
              strokeDasharray="4,4"
            />
            <g transform={`translate(${x + 35}, ${y + 20}) scale(${1 / scale})`}>
              <rect x="0" y="0" width="30" height="30" fill="none" stroke={primaryColor} strokeWidth="2" rx="4" />
              <path d="M6 10 L15 22 L24 10" fill="none" stroke={primaryColor} strokeWidth="2" />
              <circle cx="10" cy="13" r="2.5" fill={primaryColor} />
            </g>
          </g>
        );
      case 'placeholder':
        return (
          <rect
            x={x}
            y={y}
            width={100}
            height={50}
            fill={hexToRgba(primaryColor, 0.3)}
            stroke={primaryColor}
            strokeWidth={2 / scale}
            strokeDasharray="4,4"
            style={{ pointerEvents: 'none' }}
          />
        );
      case 'table':
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={x}
              y={y}
              width={200}
              height={100}
              fill={hexToRgba(primaryColor, 0.3)}
              stroke={primaryColor}
              strokeWidth={2 / scale}
              strokeDasharray="4,4"
            />
            <line
              x1={x}
              y1={y + 25}
              x2={x + 200}
              y2={y + 25}
              stroke={primaryColor}
              strokeWidth={1 / scale}
              strokeDasharray="2,2"
            />
            <line
              x1={x + 100}
              y1={y}
              x2={x + 100}
              y2={y + 100}
              stroke={primaryColor}
              strokeWidth={1 / scale}
              strokeDasharray="2,2"
            />
          </g>
        );
      case 'component':
        if (!dragPreviewElement?.code) return null;
        const componentBounds = getComponentPreviewBounds(dragPreviewElement.code, x, y);
        return (
          <rect
            x={componentBounds.x}
            y={componentBounds.y}
            width={componentBounds.width}
            height={componentBounds.height}
            fill={hexToRgba(primaryColor, 0.15)}
            stroke={primaryColor}
            strokeWidth={2 / scale}
            strokeDasharray="6,4"
            rx={4}
            ry={4}
            style={{ pointerEvents: 'none' }}
          />
        );
      default:
        return null;
    }
  };

  const renderSelectionHandles = () => {
    if (selectedElements.length === 0) return null;

    const handles: React.ReactElement[] = [];
    const handleSize = 8 / scale;

    selectedElements.forEach((elementId) => {
      const elementData = getElementData(elementId);
      const bounds = getElementBounds(elementId);
      
      if (elementData && elementData.type === 'line') {
        // 线段元素 - 渲染两个端点句柄
        const { x1, y1, x2, y2 } = getLineCoordinates(elementData);
        
        const endPoints = [
          { x: x1, y: y1, handle: 'start' as const },
          { x: x2, y: y2, handle: 'end' as const }
        ];

        endPoints.forEach((point) => {
          handles.push(
            <circle
              key={`${elementId}-handle-${point.handle}`}
              data-element-id={elementId}
              data-handle={point.handle}
              cx={point.x}
              cy={point.y}
              r={handleSize / 2}
              fill="white"
              stroke={primaryColor}
              strokeWidth={2 / scale}
              style={{ cursor: 'move', pointerEvents: 'auto' }}
            />
          );
        });
      } else if (elementData) {
        // 文本元素和其他元素（非线段）渲染选择边框
        if (elementData.type === 'text') {
          // 文本元素：只渲染边框，不渲染缩放句柄
          handles.push(
            <rect
              key={`${elementId}-selection-border`}
              data-element-id={elementId}
              x={bounds.x}
              y={bounds.y}
              width={bounds.w}
              height={bounds.h}
              fill="none"
              stroke={primaryColor}
              strokeWidth={2 / scale}
              style={{ pointerEvents: 'none' }}
            />
          );
        } else {
          // 其他元素：渲染边框和缩放句柄
          const isCircle = elementData.type === 'circle';
          const corners = isCircle
            ? [
                { x: bounds.x, y: bounds.y, handle: 'nw' as const },
                { x: bounds.x + bounds.w, y: bounds.y, handle: 'ne' as const },
                { x: bounds.x, y: bounds.y + bounds.h, handle: 'sw' as const },
                { x: bounds.x + bounds.w, y: bounds.y + bounds.h, handle: 'se' as const }
              ]
            : [
                { x: bounds.x, y: bounds.y, handle: 'nw' as const },
                { x: bounds.x + bounds.w / 2, y: bounds.y, handle: 'n' as const },
                { x: bounds.x + bounds.w, y: bounds.y, handle: 'ne' as const },
                { x: bounds.x + bounds.w, y: bounds.y + bounds.h / 2, handle: 'e' as const },
                { x: bounds.x + bounds.w, y: bounds.y + bounds.h, handle: 'se' as const },
                { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h, handle: 's' as const },
                { x: bounds.x, y: bounds.y + bounds.h, handle: 'sw' as const },
                { x: bounds.x, y: bounds.y + bounds.h / 2, handle: 'w' as const }
              ];

          const cursorMap: Record<string, string> = isCircle
            ? { nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize' }
            : { nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', e: 'e-resize',
                se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize' };

          corners.forEach((corner) => {
            handles.push(
              <rect
                key={`${elementId}-handle-${corner.handle}`}
                data-element-id={elementId}
                data-handle={corner.handle}
                x={corner.x - handleSize / 2}
                y={corner.y - handleSize / 2}
                width={handleSize}
                height={handleSize}
                fill="white"
                stroke={primaryColor}
                strokeWidth={2 / scale}
                style={{ cursor: cursorMap[corner.handle], pointerEvents: 'auto' }}
              />
            );
          });
        }
      }
    });

    return handles;
  };

  /**
   * 渲染参考线 - 显示相对坐标的参考关系
   */
  const renderReferenceLines = () => {
    if (selectedElements.length === 0) return null;

    const lines: React.ReactElement[] = [];

    selectedElements.forEach((elementId) => {
      const elementData = getElementData(elementId);
      if (!elementData) return;

      const bounds = getElementBounds(elementId);
      const lineNum = parseInt(elementId);
      
      if (!isNaN(lineNum)) {
        const contentLines = effectiveContent.split(/\r?\n/);
        if (lineNum > 0 && lineNum <= contentLines.length) {
          const line = contentLines[lineNum - 1];
          
          // 检测是否是相对坐标格式
          const isRelative = line.includes('->(') && !line.includes('x2=') && !line.includes('y2=');
          
          if (isRelative && elementData.type === 'line') {
            // 绘制从起点到终点的参考线
            const { x1, y1, x2, y2 } = getLineCoordinates(elementData);
            const lineElement = elementData as any;
            
            lines.push(
              <line
                key={`ref-line-${elementId}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--text-muted)"
                strokeWidth={2 / scale}
                strokeDasharray="4,4"
                opacity="0.5"
                pointerEvents="none"
              />
            );
            
            // 添加偏移量标签
            const dx = lineElement.end?.dx || x2 - x1;
            const dy = lineElement.end?.dy || y2 - y1;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            
            lines.push(
              <text
                key={`ref-label-${elementId}`}
                x={midX}
                y={midY - (5 / scale)}
                fontSize={`${10 / scale}px`}
                fill="var(--text-muted)"
                textAnchor="middle"
                pointerEvents="none"
              >
                dx:{dx}, dy:{dy}
              </text>
            );
          }
        }
      }
    });

    return <g className="reference-lines">{lines}</g>;
  };

  const renderError = () => {
    if (!parseError) return null;

    return (
      <div className="error-overlay">
        <div className="error-content">
          <div className="error-title">⚠️ Parse Error</div>
          <pre className="error-message">{parseError}</pre>
        </div>
      </div>
    );
  };

  const snapRenderContext: RenderContext = useMemo(() => ({
    viewBox: viewBox || null,
    scale,
    primaryColor,
  }), [viewBox, scale, primaryColor]);

  const renderSnapOverlays = () => {
    const guidesEl = renderAlignmentGuides(alignmentGuides, snapRenderContext);
    const distancesEl = renderDistanceLines(distanceLines, snapRenderContext);

    if (!guidesEl && !distancesEl) return null;

    return (
      <g className="snap-overlays">
        {guidesEl}
        {distancesEl}
      </g>
    );
  };

  const renderEmpty = () => {
    if (parseError || svg || hasSyntaxErrors) return null;
    
    return (
      <div className="empty-overlay">
        <div className="empty-content">
          <div className="empty-icon">📝</div>
          <div className="empty-text">Drag elements here or write SolarWire code</div>
        </div>
      </div>
    );
  };

  const setIsPreviewFocused = useSolarWireStore(s => s.setIsPreviewFocused);

  const cursor = isSpacePressed ? 'grab' : undefined;

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltKeyPressed(true);
        return;
      }

      const path = e.composedPath();
      const isInPreview = containerRef.current && path.includes(containerRef.current);

      const activeElement = document.activeElement;
      const isEditing = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable ||
        (activeElement as any).classList?.contains('monaco-editor')
      );

      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElements.length > 0 && !isEditing) {
        e.preventDefault();
        const result = await copyElements({
          elementIds: selectedElements,
          content: effectiveContent,
          fileDir: fileDir || undefined
        });
        if (result.success) {
          await copyToSystemClipboard();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (isEditing) return;

        const clipboardItems = await navigator.clipboard.read().catch(() => []);
        const hasImageInClipboard = clipboardItems.some(item =>
          item.types.some(type => type.startsWith('image/'))
        );

        if (hasImageInClipboard) {
          return;
        }

        e.preventDefault();
        await pasteElements({
          content: effectiveContent,
          targetPosition: lastMousePosition,
          setContent: effectiveSetContent,
          setSelectedElements: selectElements,
          fileDir: fileDir || undefined
        });
        return;
      }

      if (!isInPreview || selectedElements.length === 0) return;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltKeyPressed(false);
        setDistanceLines([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElements, effectiveContent, effectiveSetContent, selectElements, lastMousePosition, fileDir]);

  return (
    <div
      ref={containerRef}
      className={`solarwire-preview ${isSpacePressed ? 'pan-mode' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setHoveredElement(null);
        handleMouseUp({} as React.MouseEvent);
      }}
      onFocus={() => setIsPreviewFocused(true)}
      onBlur={() => setIsPreviewFocused(false)}
      onDragOver={handleDragOverCombined}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={(e) => {
        e.stopPropagation();
        if (selectedElements.length > 0) {
          selectElements([]);
        }
        if (onContextMenu) {
          onContextMenu(e);
        }
      }}
      style={{
        cursor,
        userSelect: 'none',
        outline: 'none'
      }}
      tabIndex={0}
    >
      {svg && containerSize.width > 0 && containerSize.height > 0 && (
        <CanvasRuler
          position={position}
          scale={scale}
          viewBoxOffset={{ x: viewBox?.x || 0, y: viewBox?.y || 0 }}
          width={containerSize.width}
          height={containerSize.height}
        />
      )}

      {svg && (
        <div
          ref={svgContainerRef}
          className="svg-container"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: getTransform(),
            transformOrigin: '0 0',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
          onSelect={(e) => e.preventDefault()}
        />
      )}

      {svg && (
        <div
          className="interaction-layer-wrapper"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            transform: getTransform(),
            transformOrigin: '0 0'
          }}
        >
          <svg
            className="interaction-layer"
            viewBox={viewBox ? `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}` : "0 0 100000 100000"}
            width={viewBox?.width || 100000}
            height={viewBox?.height || 100000}
            style={{
              overflow: 'visible'
            }}
          >
            <g style={{ pointerEvents: 'auto' }}>
              {renderHoverHighlight()}
              {renderDragPreview()}
              {renderBoxSelection()}
              {renderReferenceLines()}
              {renderSelectionHandles()}
              {renderSnapOverlays()}
            </g>
          </svg>
        </div>
      )}

      {renderError()}
      {renderEmpty()}
    </div>
  );
}

export default SolarWirePreview;
