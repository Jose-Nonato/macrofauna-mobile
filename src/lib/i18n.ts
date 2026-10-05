import * as I18nLib from "i18n-js";
import * as Localization from "expo-localization";
import pt from "@/locales/pt.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";

const I18n = new I18nLib.I18n();

I18n.translations = {
  pt,
  en,
  es,
  fr,
};

export const initI18n = (locale: string) => {
  I18n.locale = locale;
  I18n.defaultLocale = "pt";
  I18n.fallbacks = {
    "pt-BR": "pt",
    "en-US": "en",
    "es-ES": "es",
    "es-MX": "es",
    "fr-FR": "fr",
    "fr-CA": "fr",
  };
};

export const getDeviceLanguage = () => {
  const locale = Localization.getLocales()[0]?.languageCode || "pt";
  const supportedLanguages = ["en", "pt", "es", "fr"];
  return supportedLanguages.includes(locale) ? locale : "pt";
};

export const getCurrentLanguage = (): "en" | "pt" | "es" | "fr" => {
  return (I18n.locale as "en" | "pt" | "es" | "fr") || "pt";
};

export const setLanguage = (locale: "en" | "pt" | "es" | "fr") => {
  I18n.locale = locale;
};

export default I18n;
