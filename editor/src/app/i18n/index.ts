import { en } from './locales/en';
import { zh } from './locales/zh';

export type Language = 'en' | 'zh';

export type TranslationKeys = typeof en;

export const translations: Record<Language, TranslationKeys> = {
  en,
  zh,
};

export const defaultLanguage: Language = 'zh';

export function getTranslation(language: Language): TranslationKeys {
  return translations[language] || translations[defaultLanguage];
}
