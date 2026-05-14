import { useEffect } from 'react';
import { usePreviewStore } from '../../../stores/previewStore';
import { useSolarWireStore } from '../../../stores/solarWireStore';
import { copyElements, pasteElements, copyToSystemClipboard } from '../../../services/clipboard';

interface UseKeyboardShortcutsOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  effectiveContent: string;
  effectiveSetContent: (c: string) => void;
  fileDir: string | undefined;
  lastMousePosition: { x: number; y: number };
}

export function useKeyboardShortcuts({
  containerRef,
  effectiveContent,
  effectiveSetContent,
  fileDir,
  lastMousePosition,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        usePreviewStore.getState().setAltKeyPressed(true);
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

      const { selectedElements, selectElements } = useSolarWireStore.getState();

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
        const { setAltKeyPressed, setDistanceLines } = usePreviewStore.getState();
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
  }, [containerRef, effectiveContent, effectiveSetContent, fileDir, lastMousePosition]);
}
