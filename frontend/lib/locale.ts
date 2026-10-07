export type Language = "en" | "hi" | "mr";

export function isLanguage(value: string | undefined): value is Language {
  return value === "en" || value === "hi" || value === "mr";
}
