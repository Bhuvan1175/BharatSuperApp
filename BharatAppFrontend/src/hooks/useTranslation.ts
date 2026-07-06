import {useLanguage} from '../context/LanguageContext';
import {Translation} from '../localization';

/** Convenience hook that exposes the active string table + language controls. */
export const useTranslation = (): {
  t: Translation;
  language: 'en' | 'hi';
  setLanguage: (c: 'en' | 'hi') => void;
} => {
  const {t, language, setLanguage} = useLanguage();
  return {t, language, setLanguage};
};
