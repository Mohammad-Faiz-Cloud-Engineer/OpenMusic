import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import en from './locales/en.json';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';

const isRtl = Localization.getLocales()[0]?.textDirection === 'rtl';
if (I18nManager.isRTL !== isRtl) {
  I18nManager.allowRTL(isRtl);
  I18nManager.forceRTL(isRtl);
}

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: { en: { translation: en } },
  lng: deviceLocale.startsWith('en') ? 'en' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
