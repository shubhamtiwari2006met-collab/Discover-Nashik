import { NextResponse } from "next/server";

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash"
];

export async function POST(request: Request) {
  try {
    const rawApiKey = process.env.GEMINI_API_KEY;
    const apiKey = rawApiKey?.trim().replace(/^["']|["']$/g, "");

    if (!apiKey) {
      console.error("Gemini API key is missing on the server.");
      return NextResponse.json(
        { error: "AI Assistant is currently unavailable. Please try again later." },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request payload." }, { status: 400 });
    }

    const { question, language, history = [] } = body || {};

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "A valid question string is required." },
        { status: 400 }
      );
    }

    const sanitizedQuestion = question.trim().slice(0, 1000);

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

    // Include last few messages from history if provided and valid
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        if (msg && typeof msg === "object" && typeof msg.content === "string" && msg.content.trim()) {
          const role = msg.role === "user" ? "user" : "model";
          contents.push({
            role,
            parts: [{ text: msg.content.trim().slice(0, 500) }],
          });
        }
      }
    }

    // Append user prompt with system context
    const userPromptText = `[System Context: ${systemInstruction}]\n\nUser Question: ${sanitizedQuestion}`;
    contents.push({
      role: "user",
      parts: [{ text: userPromptText }],
    });

    let lastError: string | null = null;

    for (const model of GEMINI_MODELS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
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

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Gemini model ${model} returned status ${response.status}`);
          lastError = `[${model}] HTTP ${response.status}`;
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
        console.warn(`Gemini fetch error for model ${model}:`, lastError);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return NextResponse.json(
      { error: "AI Assistant is currently busy. Please try asking again in a moment." },
      { status: 502 }
    );
  } catch (error: unknown) {
    console.error("Chat API internal error:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

