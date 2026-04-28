export type ViewType = 'file' | 'requirement' | 'solarwire';
export type Theme = 'dark' | 'light';

export interface AppState {
  currentView: ViewType;
  theme: Theme;
  setCurrentView: (view: ViewType) => void;
  setTheme: (theme: Theme) => void;
}
