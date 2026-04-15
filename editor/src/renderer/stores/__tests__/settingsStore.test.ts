import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../settingsStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('settingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('should load default settings', () => {
    const state = useSettingsStore.getState();
    expect(state.primaryColor).toBeDefined();
    expect(state.favoriteColors).toBeDefined();
  });

  it('should persist settings to localStorage', () => {
    useSettingsStore.getState().setPrimaryColor('#FF0000');
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'solarwire-settings',
      expect.stringContaining('#FF0000')
    );
  });

  it('should load persisted settings on init', () => {
    const savedState = JSON.stringify({
      gitName: 'Test User',
      gitEmail: 'test@example.com',
      primaryColor: '#00FF00',
      favoriteColors: ['#00FF00', '#FF0000']
    });
    localStorageMock.getItem.mockReturnValue(savedState);
    
    // 重新加载设置
    useSettingsStore.getState().loadSettings();
    
    expect(useSettingsStore.getState().primaryColor).toBe('#00FF00');
    expect(useSettingsStore.getState().gitName).toBe('Test User');
  });

  it('should add favorite color', () => {
    useSettingsStore.getState().addFavoriteColor('#123456');
    
    expect(useSettingsStore.getState().favoriteColors).toContain('#123456');
  });

  it('should remove favorite color', () => {
    useSettingsStore.getState().addFavoriteColor('#123456');
    useSettingsStore.getState().removeFavoriteColor('#123456');
    
    expect(useSettingsStore.getState().favoriteColors).not.toContain('#123456');
  });

  it('should reset favorite colors', () => {
    useSettingsStore.getState().addFavoriteColor('#123456');
    useSettingsStore.getState().resetFavoriteColors();
    
    expect(useSettingsStore.getState().favoriteColors).toHaveLength(8); // 默认8个颜色
  });
});
