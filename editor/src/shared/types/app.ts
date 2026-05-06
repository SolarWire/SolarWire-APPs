export type ViewType = 'file' | 'solarwire' | 'componentLibraryManager';
export type Theme = 'dark' | 'light';

export interface AppState {
  currentView: ViewType;
  theme: Theme;
  setCurrentView: (view: ViewType) => void;
  setTheme: (theme: Theme) => void;
}
