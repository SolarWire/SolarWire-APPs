export type ViewType = 'file' | 'requirement' | 'solarwire' | 'version' | 'git';
export type Theme = 'dark' | 'light';

export interface AppState {
  currentView: ViewType;
  theme: Theme;
  setCurrentView: (view: ViewType) => void;
  setTheme: (theme: Theme) => void;
}
