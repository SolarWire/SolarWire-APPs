/**
 * 坐标转换工具函数测试
 */

import { describe, test, expect } from 'vitest';
import {
  absoluteToRelative,
  relativeToAbsolute,
  normalizeCoordinate,
  getLineStartMode,
  getLineEndMode,
  getLineStartCoords,
  getLineEndCoords
} from '../../src/shared/utils/coordinate-converter';

describe('Coordinate Converter', () => {
  describe('absoluteToRelative', () => {
    test('should calculate correct offset from absolute coordinates', () => {
      const result = absoluteToRelative(
        { x: 150, y: 200 },
        { x: 100, y: 100 }
      );
      expect(result).toEqual({ dx: 50, dy: 100 });
    });

    test('should handle negative offsets', () => {
      const result = absoluteToRelative(
        { x: 50, y: 50 },
        { x: 100, y: 100 }
      );
      expect(result).toEqual({ dx: -50, dy: -50 });
    });

    test('should handle zero offset', () => {
      const result = absoluteToRelative(
        { x: 100, y: 100 },
        { x: 100, y: 100 }
      );
      expect(result).toEqual({ dx: 0, dy: 0 });
    });
  });

  describe('relativeToAbsolute', () => {
    test('should calculate correct absolute position from relative offset', () => {
      const result = relativeToAbsolute(
        { dx: 50, dy: 100 },
        { x: 100, y: 100 }
      );
      expect(result).toEqual({ x: 150, y: 200 });
    });

    test('should handle negative offsets', () => {
      const result = relativeToAbsolute(
        { dx: -50, dy: -50 },
        { x: 100, y: 100 }
      );
      expect(result).toEqual({ x: 50, y: 50 });
    });

    test('should handle zero offset', () => {
      const result = relativeToAbsolute(
        { dx: 0, dy: 0 },
        { x: 100, y: 100 }
      );
      expect(result).toEqual({ x: 100, y: 100 });
    });
  });

  describe('normalizeCoordinate', () => {
    test('should return value for absolute coordinates', () => {
      const result = normalizeCoordinate(
        { type: 'absolute', value: 100 },
        null
      );
      expect(result).toBe(100);
    });

    test('should return value for relative coordinates', () => {
      const result = normalizeCoordinate(
        { type: 'relative', value: 50 },
        null
      );
      expect(result).toBe(50);
    });

    test('should handle edge coordinates - Left', () => {
      const referenceBounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = normalizeCoordinate(
        { type: 'edge', direction: 'L', value: 5 },
        referenceBounds
      );
      expect(result).toBe(15); // 10 + 5
    });

    test('should handle edge coordinates - Right', () => {
      const referenceBounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = normalizeCoordinate(
        { type: 'edge', direction: 'R', value: 0 },
        referenceBounds
      );
      expect(result).toBe(110); // 10 + 100 + 0
    });

    test('should handle edge coordinates - Top', () => {
      const referenceBounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = normalizeCoordinate(
        { type: 'edge', direction: 'T', value: 10 },
        referenceBounds
      );
      expect(result).toBe(30); // 20 + 10
    });

    test('should handle edge coordinates - Bottom', () => {
      const referenceBounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = normalizeCoordinate(
        { type: 'edge', direction: 'B', value: 0 },
        referenceBounds
      );
      expect(result).toBe(70); // 20 + 50 + 0
    });

    test('should handle edge coordinates - Center', () => {
      const referenceBounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = normalizeCoordinate(
        { type: 'edge', direction: 'C', value: 0 },
        referenceBounds
      );
      expect(result).toBe(60); // 10 + 100/2
    });

    test('should return default value when referenceBounds is null for edge coordinates', () => {
      const result = normalizeCoordinate(
        { type: 'edge', direction: 'L', value: 5 },
        null,
        0
      );
      expect(result).toBe(0);
    });
  });
});

describe('Line Coordinate Helpers', () => {
  describe('getLineStartMode', () => {
    test('should return absolute for absolute start coordinates', () => {
      const lineElement = {
        type: 'line',
        start: {
          x: { type: 'absolute' as const, value: 100 },
          y: { type: 'absolute' as const, value: 200 }
        }
      };
      expect(getLineStartMode(lineElement as any)).toBe('absolute');
    });

    test('should return relative for relative start coordinates', () => {
      const lineElement = {
        type: 'line',
        start: {
          x: { type: 'relative' as const, value: 50 },
          y: { type: 'relative' as const, value: 100 }
        }
      };
      expect(getLineStartMode(lineElement as any)).toBe('relative');
    });
  });

  describe('getLineEndMode', () => {
    test('should return absolute for absolute end coordinates', () => {
      const lineElement = {
        type: 'line',
        end: {
          x: { type: 'absolute' as const, value: 200 },
          y: { type: 'absolute' as const, value: 300 }
        }
      };
      expect(getLineEndMode(lineElement as any)).toBe('absolute');
    });

    test('should return relative for relative end coordinates (dx, dy)', () => {
      const lineElement = {
        type: 'line',
        end: {
          type: 'relative' as const,
          dx: 100,
          dy: 100
        }
      };
      expect(getLineEndMode(lineElement as any)).toBe('relative');
    });
  });

  describe('getLineStartCoords', () => {
    test('should return start coordinates for absolute coordinates', () => {
      const lineElement = {
        type: 'line',
        start: {
          x: { type: 'absolute' as const, value: 100 },
          y: { type: 'absolute' as const, value: 200 }
        }
      };
      const coords = getLineStartCoords(lineElement as any);
      expect(coords).toEqual({ x: 100, y: 200 });
    });

    test('should return 0,0 for non-line elements', () => {
      const element = { type: 'rectangle' };
      const coords = getLineStartCoords(element as any);
      expect(coords).toEqual({ x: 0, y: 0 });
    });
  });

  describe('getLineEndCoords', () => {
    test('should return end coordinates for absolute coordinates', () => {
      const lineElement = {
        type: 'line',
        start: {
          x: { type: 'absolute' as const, value: 100 },
          y: { type: 'absolute' as const, value: 200 }
        },
        end: {
          x: { type: 'absolute' as const, value: 300 },
          y: { type: 'absolute' as const, value: 400 }
        }
      };
      const startCoords = { x: 100, y: 200 };
      const coords = getLineEndCoords(lineElement as any, startCoords);
      expect(coords).toEqual({ x: 300, y: 400 });
    });

    test('should calculate end coordinates for relative coordinates (dx, dy)', () => {
      const lineElement = {
        type: 'line',
        start: {
          x: { type: 'absolute' as const, value: 100 },
          y: { type: 'absolute' as const, value: 200 }
        },
        end: {
          type: 'relative' as const,
          dx: 100,
          dy: 150
        }
      };
      const startCoords = { x: 100, y: 200 };
      const coords = getLineEndCoords(lineElement as any, startCoords);
      expect(coords).toEqual({ x: 200, y: 350 });
    });

    test('should return default end position when end is not defined', () => {
      const lineElement = {
        type: 'line',
        start: {
          x: { type: 'absolute' as const, value: 100 },
          y: { type: 'absolute' as const, value: 200 }
        }
      };
      const startCoords = { x: 100, y: 200 };
      const coords = getLineEndCoords(lineElement as any, startCoords);
      expect(coords).toEqual({ x: 200, y: 200 }); // Default: +100 on x
    });
  });
});
