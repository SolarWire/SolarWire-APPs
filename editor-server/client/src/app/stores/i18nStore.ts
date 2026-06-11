import { create } from 'zustand';
import { Language, getTranslation, TranslationKeys, defaultLanguage } from '../i18n';
import { feedback } from './feedbackStore';

export interface I18nState {
  language: Language;
  t: TranslationKeys;
  setLanguage: (language: Language) => void;
  loadLanguage: () => void;
  saveLanguage: () => void;
}

const defaultI18nState = {
  language: defaultLanguage,
  t: getTranslation(defaultLanguage),
};

export const useI18nStore = create<I18nState>((set, get) => ({
  ...defaultI18nState,

  setLanguage: (language: Language) => {
    set({ 
      language,
      t: getTranslation(language)
    });
    get().saveLanguage();
  },

  loadLanguage: () => {
    try {
      const saved = localStorage.getItem('solarwire-language');
      if (saved) {
        const language = saved as Language;
        if (language === 'en' || language === 'zh') {
          set({ 
            language,
            t: getTranslation(language)
          });
        }
      }
    } catch (error) {
      console.error('Failed to load language:', error);
      feedback.toast.error('Failed to load language');
    }
  },

  saveLanguage: () => {
    try {
      const { language } = get();
      localStorage.setItem('solarwire-language', language);
    } catch (error) {
      console.error('Failed to save language:', error);
      feedback.toast.error('Failed to save language');
    }
  }
}));
