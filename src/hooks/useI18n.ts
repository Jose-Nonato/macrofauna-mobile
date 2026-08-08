import I18n from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

export const useI18n = () => {
  const { language } = useLanguage();
  const [, setForceUpdate] = useState({});

  useEffect(() => {
    setForceUpdate({});
  }, [language]);

  const t = (key: string, defaultValue?: string) => {
    const value = I18n.t(key);
    return value === key && defaultValue ? defaultValue : value;
  };

  return { t, language };
};
