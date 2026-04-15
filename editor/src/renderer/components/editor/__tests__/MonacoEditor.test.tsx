import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MonacoEditor from '../MonacoEditor';
import { useAppStore } from '../../../stores/appStore';

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, language, theme, options, onMount }: any) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };
    
    // 模拟 onMount 回调
    if (onMount) {
      const mockEditor = {
        deltaDecorations: vi.fn(() => []),
        revealLineInCenter: vi.fn(),
      };
      const mockMonaco = {
        languages: {
          getLanguages: vi.fn(() => []),
          register: vi.fn(),
          setMonarchTokensProvider: vi.fn(),
          setLanguageConfiguration: vi.fn(),
        },
        Range: vi.fn((line: number) => ({ line })),
      };
      onMount(mockEditor, mockMonaco);
    }
    
    return (
      <textarea 
        data-testid="monaco-mock"
        defaultValue={value}
        onChange={handleChange}
        role="textbox"
        aria-label="Code editor"
        className="monaco-editor-mock"
      />
    );
  }
}));

// Mock useAppStore
vi.mock('../../../stores/appStore', () => ({
  useAppStore: vi.fn(() => ({
    theme: 'light'
  }))
}));

describe('MonacoEditor', () => {
  const mockOnChange = vi.fn();

  it('should render editor container', () => {
    render(
      <MonacoEditor 
        value="# Test" 
        onChange={mockOnChange}
        language="markdown"
      />
    );
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should display initial value', () => {
    render(
      <MonacoEditor 
        value="# Initial Content" 
        onChange={mockOnChange}
        language="markdown"
      />
    );
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('# Initial Content');
  });

  it('should call onChange when content modified', () => {
    render(
      <MonacoEditor 
        value="" 
        onChange={mockOnChange}
        language="markdown"
      />
    );
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '# New content' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('# New content');
  });

  it('should accept custom height', () => {
    const { container } = render(
      <MonacoEditor 
        value="# Test" 
        onChange={mockOnChange}
        language="markdown"
        height="200px"
      />
    );
    
    const editorContainer = container.querySelector('.monaco-editor');
    expect(editorContainer).toHaveStyle('height: 200px');
  });

  it('should handle highlight lines', () => {
    render(
      <MonacoEditor 
        value="# Test" 
        onChange={mockOnChange}
        language="markdown"
        highlightLines={[1, 2]}
      />
    );
    
    // 验证组件能够正常渲染，highlightLines 会在 useEffect 中处理
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should use custom primary color', () => {
    render(
      <MonacoEditor 
        value="# Test" 
        onChange={mockOnChange}
        language="markdown"
        primaryColor="#ff0000"
      />
    );
    
    // 验证组件能够正常渲染，primaryColor 会在 useEffect 中处理
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
