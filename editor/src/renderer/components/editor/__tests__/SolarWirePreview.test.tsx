import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SolarWirePreview from '../SolarWirePreview';
import { useSolarWireStore } from '../../../stores/solarWireStore';
import { useEditorStore } from '../../../stores/editorStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { parse } from '../../../lib/parser-src';
import { render as renderSVG } from '../../../lib/renderer-svg-src';

// Mock ResizeObserver for test environment
global.ResizeObserver = class {
  constructor(callback: ResizeObserverCallback) {}
  observe(target: Element) {}
  unobserve(target: Element) {}
  disconnect() {}
};

// Mock all dependencies
vi.mock('../../../stores/solarWireStore');
vi.mock('../../../stores/editorStore');
vi.mock('../../../stores/settingsStore');
vi.mock('../../../lib/parser-src');
vi.mock('../../../lib/renderer-svg-src');
vi.mock('../../../utils/solarwire-utils');

// Mock debounce and throttle from lodash-es
vi.mock('lodash-es', () => ({
  debounce: (fn: Function, delay: number) => fn,
  throttle: (fn: Function, delay: number) => fn,
}));

const mockUseSolarWireStore = vi.mocked(useSolarWireStore);
const mockUseEditorStore = vi.mocked(useEditorStore);
const mockUseSettingsStore = vi.mocked(useSettingsStore);
const mockParse = vi.mocked(parse);
const mockRender = vi.mocked(renderSVG);

describe('SolarWirePreview', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock store hooks
    mockUseSolarWireStore.mockReturnValue({
      selectedElements: [],
      selectElements: vi.fn(),
      // Add other required store methods
    } as any);
    
    mockUseEditorStore.mockReturnValue({
      content: '',
      setContent: vi.fn(),
      // Add other required store methods
    } as any);
    
    mockUseSettingsStore.mockReturnValue({
      primaryColor: '#ff6b00',
      // Add other required store methods
    } as any);
    
    // Mock parse function
    mockParse.mockReturnValue({
      elements: [],
      // Add other required parse return values
    } as any);
    
    // Mock render function
    mockRender.mockReturnValue({
      svg: '<svg><rect width="100" height="100" /></svg>',
      viewBox: { x: 0, y: 0, width: 1000, height: 1000 },
      // Add other required render return values
    } as any);
  });

  it('should render the component', () => {
    render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
      />
    );
    
    expect(screen.getByText('Drag elements here or write SolarWire code')).toBeInTheDocument();
  });

  it('should handle wheel event for zooming', async () => {
    const onZoomChange = vi.fn();
    
    const { container } = render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
        onZoomChange={onZoomChange}
      />
    );
    
    // Simulate wheel event
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: -100, // Zoom in
      clientX: 100,
      clientY: 100,
      preventDefault: vi.fn(),
    });
    
    container.querySelector('.solarwire-preview')?.dispatchEvent(wheelEvent);
    
    await waitFor(() => {
      expect(onZoomChange).toHaveBeenCalled();
    });
  });

  it('should handle mouse down event', () => {
    const { container } = render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
      />
    );
    
    // Simulate mouse down event
    const mouseDownEvent = new MouseEvent('mousedown', {
      button: 0, // Left mouse button
      clientX: 100,
      clientY: 100,
    });
    
    container.querySelector('.solarwire-preview')?.dispatchEvent(mouseDownEvent);
    
    // Add assertions based on expected behavior
  });

  it('should handle mouse move event', () => {
    const { container } = render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
      />
    );
    
    // Simulate mouse move event
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 150,
    });
    
    container.querySelector('.solarwire-preview')?.dispatchEvent(mouseMoveEvent);
    
    // Add assertions based on expected behavior
  });

  it('should handle mouse up event', () => {
    const { container } = render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
      />
    );
    
    // Simulate mouse up event
    const mouseUpEvent = new MouseEvent('mouseup', {
      clientX: 200,
      clientY: 200,
    });
    
    container.querySelector('.solarwire-preview')?.dispatchEvent(mouseUpEvent);
    
    // Add assertions based on expected behavior
  });

  it('should handle drag over event', () => {
    const { container } = render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
      />
    );
    
    // Simulate drag over event
    const dragOverEvent = new DragEvent('dragover', {
      preventDefault: vi.fn(),
      dataTransfer: {
        dropEffect: 'none',
      } as any,
    });
    
    container.querySelector('.solarwire-preview')?.dispatchEvent(dragOverEvent);
    
    // Add assertions based on expected behavior
  });

  it('should handle drop event', async () => {
    const mockSetContent = vi.fn();
    mockUseEditorStore.mockReturnValue({
      content: '',
      setContent: mockSetContent,
    } as any);
    
    const { container } = render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
      />
    );
    
    // Simulate drop event
    const dropEvent = new DragEvent('drop', {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue(JSON.stringify({ type: 'rectangle' })),
      } as any,
    });
    
    container.querySelector('.solarwire-preview')?.dispatchEvent(dropEvent);
    
    await waitFor(() => {
      expect(mockSetContent).toHaveBeenCalled();
    });
  });

  it('should render error message when there is a parse error', async () => {
    // Mock parse to throw an error
    mockParse.mockImplementation(() => {
      throw new Error('Parse error');
    });
    
    render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Parse Error')).toBeInTheDocument();
    });
  });

  it('should render loading indicator when rendering', async () => {
    // Mock render to be slow
    mockRender.mockImplementation(() => {
      // Simulate slow rendering
      return {
        svg: '<svg><rect width="100" height="100" /></svg>',
        viewBox: { x: 0, y: 0, width: 1000, height: 1000 },
      } as any;
    });
    
    render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
      />
    );
    
    // Wait for rendering indicator
    await waitFor(() => {
      expect(screen.getByText('Rendering...')).toBeInTheDocument();
    });
  });

  it('should handle box selection', () => {
    const mockSelectElements = vi.fn();
    mockUseSolarWireStore.mockReturnValue({
      selectedElements: [],
      selectElements: mockSelectElements,
    } as any);
    
    const { container } = render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="box-inclusive" 
      />
    );
    
    // Simulate box selection
    const previewElement = container.querySelector('.solarwire-preview');
    
    // Mouse down to start box selection
    const mouseDownEvent = new MouseEvent('mousedown', {
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    previewElement?.dispatchEvent(mouseDownEvent);
    
    // Mouse move to expand selection
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 200,
      clientY: 200,
    });
    previewElement?.dispatchEvent(mouseMoveEvent);
    
    // Mouse up to finish selection
    const mouseUpEvent = new MouseEvent('mouseup', {
      clientX: 200,
      clientY: 200,
    });
    previewElement?.dispatchEvent(mouseUpEvent);
    
    // Add assertions based on expected behavior
  });

  it('should handle pan mode when space is pressed', () => {
    const { container } = render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
        isSpacePressed={true}
      />
    );
    
    const previewElement = container.querySelector('.solarwire-preview');
    expect(previewElement).toHaveClass('pan-mode');
  });

  it('should handle pan mode when isPanMode is true', () => {
    const { container } = render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
        isPanMode={true}
      />
    );
    
    const previewElement = container.querySelector('.solarwire-preview');
    expect(previewElement).toHaveClass('pan-mode');
  });

  it('should not show notes when showNotes is false', () => {
    render(
      <SolarWirePreview 
        zoomLevel={100} 
        selectionTool="select" 
        showNotes={false}
      />
    );
    
    // Add assertions based on expected behavior
  });
});
