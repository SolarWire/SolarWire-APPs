import React, { createContext, useContext, ReactNode } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { EditorMode } from '../../shared/types/editor';
import { useSolarWireStore, SelectionTool } from '../stores/solarWireStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useComponentLibraryStore } from '../stores/componentLibraryStore';

interface EditorContextValue {
  // Editor state
  content: string;
  setContent: (content: string) => void;
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  isModified: boolean;
  setModified: (modified: boolean) => void;
  undo: () => void;

  // SolarWire state
  selectedElements: string[];
  setSelectedElements: (ids: string[]) => void;
  selectElements: (ids: string[]) => void;
  selectionTool: SelectionTool;
  setSelectionTool: (tool: SelectionTool) => void;
  isPanMode: boolean;
  setIsPanMode: (isPanMode: boolean) => void;
  showNotes: boolean;
  setShowNotes: (show: boolean) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  isSpacePressed: boolean;
  setIsSpacePressed: (pressed: boolean) => void;

  // Settings state
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  favoriteColors: string[];
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  addFavoriteColor: (color: string) => void;
  removeFavoriteColor: (color: string) => void;

  // Component library state
  showComponentLibrary: boolean;
  setShowComponentLibrary: (show: boolean) => void;
  activeLibraryId: string | null;
  setActiveLibrary: (libraryId: string | null) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const editorStore = useEditorStore();
  const solarWireStore = useSolarWireStore();
  const settingsStore = useSettingsStore();
  const componentLibraryStore = useComponentLibraryStore();

  const value: EditorContextValue = {
    // Editor state
    content: editorStore.content,
    setContent: editorStore.setContent,
    mode: editorStore.mode,
    setMode: editorStore.setMode,
    isModified: editorStore.isModified,
    setModified: editorStore.setModified,
    undo: editorStore.undo,

    // SolarWire state
    selectedElements: solarWireStore.selectedElements,
    setSelectedElements: solarWireStore.setSelectedElements,
    selectElements: solarWireStore.selectElements,
    selectionTool: solarWireStore.selectionTool,
    setSelectionTool: solarWireStore.setSelectionTool,
    isPanMode: solarWireStore.isPanMode,
    setIsPanMode: solarWireStore.setIsPanMode,
    showNotes: solarWireStore.showNotes,
    setShowNotes: solarWireStore.setShowNotes,
    zoomLevel: solarWireStore.zoomLevel,
    setZoomLevel: solarWireStore.setZoomLevel,
    isSpacePressed: solarWireStore.isSpacePressed,
    setIsSpacePressed: solarWireStore.setIsSpacePressed,

    // Settings state
    showGrid: settingsStore.showGrid,
    setShowGrid: settingsStore.setShowGrid,
    gridSize: settingsStore.gridSize,
    setGridSize: settingsStore.setGridSize,
    snapToGrid: settingsStore.snapToGrid,
    setSnapToGrid: settingsStore.setSnapToGrid,
    favoriteColors: settingsStore.favoriteColors,
    primaryColor: settingsStore.primaryColor,
    setPrimaryColor: settingsStore.setPrimaryColor,
    addFavoriteColor: settingsStore.addFavoriteColor,
    removeFavoriteColor: settingsStore.removeFavoriteColor,

    // Component library state
    showComponentLibrary: componentLibraryStore.showComponentLibrary,
    setShowComponentLibrary: componentLibraryStore.setShowComponentLibrary,
    activeLibraryId: componentLibraryStore.activeLibraryId,
    setActiveLibrary: componentLibraryStore.setActiveLibrary,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorContext(): EditorContextValue {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within EditorProvider');
  }
  return context;
}
