import type { LocalizedContent } from "@/lib/localizedContent";

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const LANGUAGES = ["en", "hi", "mr"] as const;

function validateResult(value: unknown, source: Record<string, string>): LocalizedContent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const result: LocalizedContent = {};

  for (const [field, original] of Object.entries(source)) {
    const candidate = data[field];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const translated = candidate as Record<string, unknown>;
    if (!LANGUAGES.every((locale) => typeof translated[locale] === "string" && (translated[locale] as string).trim())) return null;
    if (translated.en !== original) return null;
    result[field] = {
      en: original,
      hi: (translated.hi as string).trim(),
      mr: (translated.mr as string).trim(),
    };
  }
  return result;
}

export async function generateVisitorContentTranslations(
  source: Record<string, string>
): Promise<LocalizedContent> {
  const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!apiKey) throw new Error("Translation service is unavailable.");

  const prompt = [
    "Translate the supplied visitor-facing content into natural Hindi and Marathi.",
    "Preserve proper place/business names, numbers, URLs, contact details, and technical identifiers where appropriate.",
    "Return only valid JSON with the same field names, each mapped to an object containing en, hi, and mr strings.",
    "The en value must exactly equal the supplied English source.",
    JSON.stringify(source),
  ].join("\n");
  let lastFailure = "Translation service did not return a valid translation.";

  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
          }),
          signal: AbortSignal.timeout(20000),
        }
      );
      if (!response.ok) {
        lastFailure = `Translation service returned HTTP ${response.status}.`;
        console.warn(`Content translation model ${model} returned HTTP ${response.status}.`);
        continue;
      }
      const responseBody = await response.json();
      const text = responseBody?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("")
        .trim();
      if (!text) continue;
      const translations = validateResult(JSON.parse(text), source);
      if (translations) return translations;
      console.warn(`Content translation model ${model} returned incomplete or invalid fields.`);
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
      console.warn(`Content translation request to ${model} failed.`, lastFailure);
    }
  }
  throw new Error(lastFailure);
}
