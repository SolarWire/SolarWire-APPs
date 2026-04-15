import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../editorStore';

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      mode: 'solarwire',
      content: '',
      isModified: false,
      isLoading: false,
      loadingMessage: undefined,
      history: [],
      historyIndex: -1
    });
  });

  it('should initialize with default state', () => {
    const state = useEditorStore.getState();
    expect(state.mode).toBe('solarwire');
    expect(state.content).toBe('');
    expect(state.isModified).toBe(false);
    expect(state.history).toEqual([]);
    expect(state.historyIndex).toBe(-1);
  });

  it('should update content and mark as modified', () => {
    const store = useEditorStore.getState();
    store.setContent('# New Content');

    const newState = useEditorStore.getState();
    expect(newState.content).toBe('# New Content');
    expect(newState.isModified).toBe(true);
  });

  it('should track history when content changes', () => {
    const store = useEditorStore.getState();

    store.setContent('Step 1');
    store.setContent('Step 2');

    const state = useEditorStore.getState();
    expect(state.history.length).toBe(2);
    expect(state.historyIndex).toBe(1);
    expect(state.content).toBe('Step 2');
  });

  it('should undo to previous content', () => {
    const store = useEditorStore.getState();

    store.setContent('First');
    store.setContent('Second');
    store.undo();

    const state = useEditorStore.getState();
    expect(state.content).toBe('First');
    expect(state.historyIndex).toBe(0);
  });

  it('should limit history to 50 entries', () => {
    const store = useEditorStore.getState();

    for (let i = 0; i < 55; i++) {
      store.setContent(`Content ${i}`);
    }

    const state = useEditorStore.getState();
    expect(state.history.length).toBeLessThanOrEqual(50);
  });

  it('should undo back to initial state when no previous content exists', () => {
    const store = useEditorStore.getState();

    store.setContent('First');
    store.undo();

    const state = useEditorStore.getState();
    expect(state.content).toBe('');
    expect(state.historyIndex).toBe(-1);
  });

  it('should not record history for identical content', () => {
    const store = useEditorStore.getState();

    store.setContent('Same');
    store.setContent('Same');

    const state = useEditorStore.getState();
    expect(state.history.length).toBe(1);
  });

  it('should set loading state', () => {
    const store = useEditorStore.getState();

    store.setLoading(true, 'Loading...');

    const state = useEditorStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.loadingMessage).toBe('Loading...');
  });

  it('should set modified state', () => {
    const store = useEditorStore.getState();

    store.setModified(false);

    const state = useEditorStore.getState();
    expect(state.isModified).toBe(false);
  });

  it('should set mode', () => {
    const store = useEditorStore.getState();

    store.setMode('markdown');

    const state = useEditorStore.getState();
    expect(state.mode).toBe('markdown');
  });

  it('should handle rapid content changes', () => {
    const store = useEditorStore.getState();

    for (let i = 0; i < 10; i++) {
      store.setContent(`Content ${i}`);
    }

    const state = useEditorStore.getState();
    expect(state.history.length).toBe(10);
    expect(state.historyIndex).toBe(9);
    expect(state.content).toBe('Content 9');
  });

  it('should handle multiple undo operations', () => {
    const store = useEditorStore.getState();

    store.setContent('A');
    store.setContent('B');
    store.setContent('C');
    store.undo();
    store.undo();

    const state = useEditorStore.getState();
    expect(state.content).toBe('A');
    expect(state.historyIndex).toBe(0);
  });

  it('should not redo when at latest state', () => {
    const store = useEditorStore.getState();

    store.setContent('First');
    store.setContent('Second');

    store.redo();

    const state = useEditorStore.getState();
    expect(state.content).toBe('Second');
    expect(state.historyIndex).toBe(1);
  });

  it('should not undo when no history', () => {
    const store = useEditorStore.getState();

    store.undo();

    const state = useEditorStore.getState();
    expect(state.content).toBe('');
    expect(state.historyIndex).toBe(-1);
  });
});
