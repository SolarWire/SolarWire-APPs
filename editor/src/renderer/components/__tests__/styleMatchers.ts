import { expect } from 'vitest';

/**
 * 自定义 matcher: 检查元素是否有特定 CSS 类
 */
export function toHaveClass(element: HTMLElement, className: string) {
  const hasClass = element.classList.contains(className);
  return {
    pass: hasClass,
    message: () => 
      `Expected element to ${hasClass ? 'not ' : ''}have class "${className}"`
  };
}

/**
 * 自定义 matcher: 检查元素样式
 */
export function toHaveStyleProperty(
  element: HTMLElement, 
  property: string, 
  value: string
) {
  const actual = getComputedStyle(element)[property];
  return {
    pass: actual === value,
    message: () => 
      `Expected ${property} to be "${value}", got "${actual}"`
  };
}

expect.extend({
  toHaveClass,
  toHaveStyleProperty
});
