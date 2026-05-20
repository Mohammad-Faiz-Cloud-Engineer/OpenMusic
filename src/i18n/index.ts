import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import en from './locales/en.json';

const isRtl = Localization.getLocales()[0]?.textDirection === 'rtl';
if (I18nManager.isRTL !== isRtl) {
  I18nManager.allowRTL(isRtl);
  I18nManager.forceRTL(isRtl);
}

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  showSupportNotice: false,
}).catch((err) => console.warn('[i18n] init failed:', err));

export default i18n;
