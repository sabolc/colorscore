/**
 * ULWILA Color Score Editor — Language Context
 *
 * Provides language state and translations to the entire app via React context.
 */

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type { Translations, SupportedLanguage } from "./types";
import { en } from "./en";
import { hu } from "./hu";

const STORAGE_KEY = "ulwila-lang";

const DICTIONARIES: Record<SupportedLanguage, Translations> = {
  en,
  hu,
};

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hu", label: "HU" },
];

/**
 * Detect the initial language: localStorage → browser lang → "en"
 */
function detectInitialLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in DICTIONARIES) {
      return stored as SupportedLanguage;
    }
  } catch {
    // localStorage may be unavailable (SSR, privacy mode)
  }

  // Try browser language
  const browserLang = navigator?.language?.slice(0, 2);
  if (browserLang && browserLang in DICTIONARIES) {
    return browserLang as SupportedLanguage;
  }

  return "en";
}

interface LanguageContextValue {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SupportedLanguage>(detectInitialLanguage);

  const setLang = useCallback((newLang: SupportedLanguage) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore localStorage write errors
    }
  }, []);

  const t = useMemo(() => DICTIONARIES[lang], [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access translations and language switching.
 * Must be used inside a LanguageProvider.
 */
export function useTranslation(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

/**
 * Get the current translations without React context.
 * Reads the language from localStorage and returns the dictionary.
 * Useful in non-component code (e.g., export modules).
 */
export function getCurrentTranslations(): Translations {
  let lang: SupportedLanguage = "en";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in DICTIONARIES) {
      lang = stored as SupportedLanguage;
    }
  } catch {
    // Ignore
  }
  return DICTIONARIES[lang];
}
