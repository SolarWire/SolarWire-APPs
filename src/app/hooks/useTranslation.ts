import { useI18nStore } from '../stores/i18nStore';
import { TranslationKeys } from '../i18n';

export function useTranslation(): TranslationKeys {
  const { t } = useI18nStore();
  return t;
}
