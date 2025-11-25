
import { translations } from '../lib/translations';
import { AppSettings } from '../types';

export const useTranslation = (language: AppSettings['language']) => {
  const t = (key: keyof typeof translations['en'], replacements?: Record<string, string | number>) => {
    const dict = translations[language] || translations['en'];
    let text = dict[key] || translations['en'][key] || key;
    
    if (replacements && typeof text === 'string') {
        Object.entries(replacements).forEach(([placeholder, value]) => {
            text = text.replace(`{${placeholder}}`, String(value));
        });
    }
    return text;
  };

  return { t };
};
