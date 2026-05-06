/**
 * SolarWire Preview 工具函数
 * 从 SolarWirePreview.tsx 中提取的工具函数
 */

import { MAX_IMAGE_DIMENSION, DEFAULT_IMAGE_WIDTH } from './constants';

/**
 * 验证文件目录是否有效
 * @param fileDir 文件目录
 * @param currentPath 当前路径
 * @returns 是否有效
 */
export const isValidFileDir = (fileDir: string, currentPath: string): boolean => {
  if (!fileDir || !currentPath) return false;
  const normalizedFileDir = fileDir.replace(/\\/g, '/').toLowerCase();
  const normalizedCurrentPath = currentPath.replace(/\\/g, '/').toLowerCase();
  return normalizedFileDir.startsWith(normalizedCurrentPath);
};

/**
 * 获取项目目录
 * @param currentPath 当前路径
 * @param selectedFilePath 选中的文件路径
 * @returns 项目目录
 */
export const getProjectDir = (currentPath: string, selectedFilePath: string | undefined): string | null => {
  if (selectedFilePath) {
    const fileDir = selectedFilePath.replace(/[\\/][^\\/]*$/, '');
    return fileDir;
  }
  if (currentPath) return currentPath;
  return null;
};

/**
 * 从行中解析坐标
 * @param line 行内容
 * @returns 坐标对象 { x, y, x2, y2 }
 */
const parseCoordinatesFromLine = (line: string): { x: number; y: number; x2: number; y2: number } => {
  let x = 0;
  let y = 0;
  let x2 = 0;
  let y2 = 0;

  const coordPattern = /@\((\d+),\s*(\d+)\)/;
  const match = line.match(coordPattern);
  if (match) {
    x = parseInt(match[1]);
    y = parseInt(match[2]);
  } else {
    const xMatch = line.match(/x=([\d]+)/);
    const yMatch = line.match(/y=([\d]+)/);
    if (xMatch) x = parseInt(xMatch[1]);
    if (yMatch) y = parseInt(yMatch[1]);
  }

  // 检查是否是线段元素，获取终点坐标
  const lineEndPattern = /->\((\d+),\s*(\d+)\)/;
  const lineEndMatch = line.match(lineEndPattern);
  if (lineEndMatch) {
    x2 = parseInt(lineEndMatch[1]);
    y2 = parseInt(lineEndMatch[2]);
  } else {
    const x2Match = line.match(/x2=([\d]+)/);
    const y2Match = line.match(/y2=([\d]+)/);
    if (x2Match) x2 = parseInt(x2Match[1]);
    if (y2Match) y2 = parseInt(y2Match[1]);
  }

  return { x, y, x2, y2 };
};

/**
 * 获取元素数据，包括线段元素的终点坐标
 * @param content 文档内容
 * @param lineNum 行号
 * @returns 元素坐标数据
 */
export const getElementDataFromContent = (content: string, lineNum: number) => {
  const lines = content.split(/\r?\n/);
  if (lineNum < 1 || lineNum > lines.length) return null;
  const line = lines[lineNum - 1];
  return parseCoordinatesFromLine(line);
};

/**
 * 吸附到网格
 * @param value 值
 * @param gridSize 网格大小
 * @returns 吸附后的值
 */
export const snapToGridValue = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * 将十六进制颜色转换为RGBA
 * @param hex 十六进制颜色
 * @param alpha 透明度
 * @returns RGBA颜色字符串
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 计算图片尺寸
 * @param size 原始尺寸
 * @returns 调整后的尺寸
 */
export const calculateImageSize = (size?: { width: number; height: number }): { w: number; h: number | undefined } => {
  if (size) {
    if (size.width > MAX_IMAGE_DIMENSION || size.height > MAX_IMAGE_DIMENSION) {
      const ratio = Math.min(MAX_IMAGE_DIMENSION / size.width, MAX_IMAGE_DIMENSION / size.height);
      return {
        w: Math.round(size.width * ratio),
        h: Math.round(size.height * ratio)
      };
    } else {
      return {
        w: Math.round(size.width),
        h: Math.round(size.height)
      };
    }
  } else {
    return {
      w: DEFAULT_IMAGE_WIDTH,
      h: undefined
    };
  }
};

/**
 * 创建RAF内容更新器
 * @param setContent 内容设置函数
 * @returns RAF更新器函数
 */
export function createRafContentUpdater(setContent: (content: string) => void) {
  let rafId: number | null = null;
  let pendingContent: string | null = null;

  const flush = () => {
    rafId = null;
    if (pendingContent !== null) {
      setContent(pendingContent);
      pendingContent = null;
    }
  };

  return (newContent: string) => {
    pendingContent = newContent;
    if (rafId === null) {
      rafId = requestAnimationFrame(flush);
    }
  };
}
