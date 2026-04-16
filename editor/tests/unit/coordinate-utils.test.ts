import { screenToWorld, worldToScreen, getTransformString } from '../../src/shared/utils/coordinate-utils';

describe('Coordinate Utils', () => {
  const containerRect = {
    left: 100,
    top: 50,
    width: 800,
    height: 600
  } as DOMRect;

  const position = { x: 50, y: 30 };
  const scale = 2;

  test('screenToWorld should correctly convert screen coordinates to world coordinates', () => {
    const result = screenToWorld(200, 150, containerRect, position, scale);
    expect(result).toEqual({ x: 25, y: 35 });
  });

  test('worldToScreen should correctly convert world coordinates to screen coordinates', () => {
    const result = worldToScreen(25, 35, containerRect, position, scale);
    expect(result).toEqual({ x: 200, y: 150 });
  });

  test('getTransformString should return correct CSS transform', () => {
    const result = getTransformString(position, scale);
    expect(result).toBe('translate(50px, 30px) scale(2)');
  });

  test('screenToWorld should handle edge case when containerRef is null', () => {
    const result = screenToWorld(200, 150, containerRect, position, scale);
    expect(result).toEqual({ x: 25, y: 35 });
  });

  test('worldToScreen should handle edge case when containerRef is null', () => {
    const result = worldToScreen(25, 35, containerRect, position, scale);
    expect(result).toEqual({ x: 200, y: 150 });
  });

  test('getTransformString should handle scale of 1', () => {
    const result = getTransformString(position, 1);
    expect(result).toBe('translate(50px, 30px) scale(1)');
  });

  test('getTransformString should handle zero position', () => {
    const result = getTransformString({ x: 0, y: 0 }, scale);
    expect(result).toBe('translate(0px, 0px) scale(2)');
  });
});