import { describe, it, expect, vi } from 'vitest';
import { deepClone, throttle, debounce, generateRandomString, delay, getNestedProperty } from '../common-utils';

describe('Common Utils', () => {
  it('should deep clone objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it('should deep clone arrays', () => {
    const arr = [1, 2, { a: 3 }];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[2]).not.toBe(arr[2]);
  });

  it('should deep clone dates', () => {
    const date = new Date();
    const cloned = deepClone(date);
    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
  });

  it('should throttle function calls', async () => {
    const mockFn = vi.fn();
    const throttled = throttle(mockFn, 100);
    
    throttled();
    throttled();
    throttled();
    
    await delay(150);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should debounce function calls', async () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 100);
    
    debounced();
    debounced();
    debounced();
    
    await delay(50);
    expect(mockFn).not.toHaveBeenCalled();
    
    await delay(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should generate random string', () => {
    const str = generateRandomString(10);
    expect(typeof str).toBe('string');
    expect(str.length).toBe(10);
  });

  it('should delay execution', async () => {
    const start = performance.now();
    await delay(50);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(50);
  });

  it('should get nested property', () => {
    const obj = { a: { b: { c: 123 } } };
    expect(getNestedProperty(obj, 'a.b.c', 0)).toBe(123);
    expect(getNestedProperty(obj, 'a.b.d', 0)).toBe(0);
  });
});
