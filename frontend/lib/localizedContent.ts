export type Locale = "en" | "hi" | "mr";

export type LocalizedText = Record<Locale, string>;
export type LocalizedContent = Record<string, LocalizedText>;
export type TranslationStatus = "complete" | "pending" | "failed" | "needs_review";

export function localizeFields<T extends Record<string, unknown>>(
  source: T,
  localizedContent: unknown,
  locale: Locale
): T {
  if (locale === "en" || !localizedContent || typeof localizedContent !== "object") {
    return source;
  }

  const translations = localizedContent as Record<string, unknown>;
  const localized = { ...source };
  for (const [field, value] of Object.entries(translations)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const localizedValue = (value as Partial<LocalizedText>)[locale];
    if (typeof localizedValue === "string" && localizedValue.trim()) {
      (localized as Record<string, unknown>)[field] = localizedValue;
    }
  }
  return localized;
}

export function isLocalizedContent(value: unknown): value is LocalizedContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((fieldValue) => {
    if (!fieldValue || typeof fieldValue !== "object" || Array.isArray(fieldValue)) return false;
    const field = fieldValue as Record<string, unknown>;
    return ["en", "hi", "mr"].every((locale) => typeof field[locale] === "string");
  });
}
