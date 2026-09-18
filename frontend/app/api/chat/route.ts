import { NextResponse } from "next/server";

const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite"
];

export async function POST(request: Request) {
  try {
    const rawApiKey = process.env.GEMINI_API_KEY;
    const apiKey = rawApiKey?.trim().replace(/^["']|["']$/g, "");

    if (!apiKey) {
      console.error("Gemini API key is not configured or empty in process.env.GEMINI_API_KEY");
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { question, language, history = [] } = body || {};

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question parameter is required." },
        { status: 400 }
      );
    }

    const langName =
      language === "hi"
        ? "Hindi"
        : language === "mr"
        ? "Marathi"
        : "English";

    const systemInstruction = `You are "Nashik AI Guide", an expert AI travel guide for Nashik, Maharashtra, India.
Guidelines:
1. Language: Answer naturally in the user's requested language (${langName}).
2. Scope: Provide clear, accurate information about Nashik places (Trimbakeshwar, Sula Vineyards, Panchavati, Pandavleni, Anjaneri, Goda Ghat, Muktidham), food (Misal Pav), wine, Kumbh Mela, transport, and itineraries.
3. Completeness: Always complete your sentences fully. Never stop mid-sentence.
4. Formatting: Use clean bullet points (•) and concise paragraphs. Avoid markdown headers (#) or raw markdown syntax.
5. Accuracy: Preserve verified names, timings, emergency contacts, and facts accurately.`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Include last few messages from history if provided
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        if (msg && typeof msg.content === "string" && msg.content.trim()) {
          const role = msg.role === "user" ? "user" : "model";
          contents.push({
            role,
            parts: [{ text: msg.content.trim() }],
          });
        }
      }
    }

    // Append user prompt with system context
    const userPromptText = `[System Context: ${systemInstruction}]\n\nUser Question: ${question}`;
    contents.push({
      role: "user",
      parts: [{ text: userPromptText }],
    });

    let lastError: string | null = null;

    for (const model of GEMINI_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1000,
                topP: 0.8,
              },
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini model ${model} failed with status ${response.status}:`, errorText);
          lastError = `[${model}] HTTP ${response.status}: ${errorText.slice(0, 200)}`;
          continue;
        }

        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const generatedText = parts
          .map((part: { text?: string }) => part.text || "")
          .join("")
          .trim();

        if (generatedText && generatedText.length > 0) {
          return NextResponse.json({ reply: generatedText, modelUsed: model });
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`Gemini fetch error for ${model}:`, err);
      }
    }

    return NextResponse.json(
      { error: "All Gemini model attempts failed", details: lastError },
      { status: 502 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
