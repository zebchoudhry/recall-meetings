import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { dictionaries, en, TranslationKey } from "./strings";

type UiLang = "en" | "es";

interface I18nContextValue {
  uiLang: UiLang;
  setUiLang: (lang: UiLang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const STORAGE_KEY = "recall.uiLang";

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [uiLang, setUiLangState] = useState<UiLang>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "es" ? "es" : "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, uiLang);
    document.documentElement.lang = uiLang;
  }, [uiLang]);

  const setUiLang = useCallback((lang: UiLang) => setUiLangState(lang), []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = dictionaries[uiLang] ?? en;
      let str = dict[key] ?? en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [uiLang],
  );

  const value = useMemo(() => ({ uiLang, setUiLang, t }), [uiLang, setUiLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components don't crash if rendered outside provider.
    return {
      uiLang: "en",
      setUiLang: () => {},
      t: (key) => en[key] ?? key,
    };
  }
  return ctx;
};