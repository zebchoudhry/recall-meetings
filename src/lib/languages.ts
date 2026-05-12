export interface LanguageOption {
  code: string; // ISO 639-1
  bcp47: string; // for Web Speech API
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", bcp47: "en-US", label: "English", flag: "🇺🇸" },
  { code: "es", bcp47: "es-ES", label: "Español", flag: "🇪🇸" },
  { code: "fr", bcp47: "fr-FR", label: "Français", flag: "🇫🇷" },
  { code: "de", bcp47: "de-DE", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", bcp47: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "it", bcp47: "it-IT", label: "Italiano", flag: "🇮🇹" },
  { code: "zh", bcp47: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "ja", bcp47: "ja-JP", label: "日本語", flag: "🇯🇵" },
  { code: "hi", bcp47: "hi-IN", label: "हिन्दी", flag: "🇮🇳" },
  { code: "ar", bcp47: "ar-SA", label: "العربية", flag: "🇸🇦" },
];

export const getLanguageByCode = (code: string): LanguageOption | undefined =>
  SUPPORTED_LANGUAGES.find((l) => l.code === code);

export const getBcp47 = (code: string): string =>
  getLanguageByCode(code)?.bcp47 ?? "en-US";

export const getLanguageLabel = (code: string): string =>
  getLanguageByCode(code)?.label ?? code.toUpperCase();