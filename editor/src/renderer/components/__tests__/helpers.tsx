import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * 自定义 render 函数,自动包裹 Providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    ...options,
    // 如果后续有 Context Providers,在这里包裹
  });
}

/**
 * 模拟用户拖拽操作
 */
export async function simulateDrag(
  element: HTMLElement,
  dx: number,
  dy: number
) {
  const rect = element.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;
  
  // 使用 Pointer Events API
  element.dispatchEvent(new PointerEvent('pointerdown', {
    clientX: startX,
    clientY: startY,
    bubbles: true
  }));
  
  element.dispatchEvent(new PointerEvent('pointermove', {
    clientX: startX + dx,
    clientY: startY + dy,
    bubbles: true
  }));
  
  element.dispatchEvent(new PointerEvent('pointerup', {
    clientX: startX + dx,
    clientY: startY + dy,
    bubbles: true
  }));
}
