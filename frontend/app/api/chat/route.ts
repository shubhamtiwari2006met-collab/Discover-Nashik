import { NextResponse } from "next/server";

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash"
];

// Rate Limiter Configuration: 10 requests per 60 seconds per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const ipRequestStore = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map(ip => ip.trim());
    if (ips[0]) return ips[0].slice(0, 45);
  }
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim().slice(0, 45);

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim().slice(0, 45);

  return "127.0.0.1";
}

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Cleanup stale entries if store grows large
  if (ipRequestStore.size > 1000) {
    for (const [ip, timestamps] of ipRequestStore.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > windowStart);
      if (validTimestamps.length === 0) {
        ipRequestStore.delete(ip);
      } else {
        ipRequestStore.set(ip, validTimestamps);
      }
    }
  }

  const timestamps = ipRequestStore.get(clientIp) || [];
  const validTimestamps = timestamps.filter(ts => ts > windowStart);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestStore.set(clientIp, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  ipRequestStore.set(clientIp, validTimestamps);
  return false;
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before sending another message." },
        { status: 429 }
      );
    }

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

    const systemInstruction = `You are the AI assistant for Discover Nashik, a spiritual and cultural visitor guide focused especially on Kumbh Mela 2027 and Nashik's pilgrimage heritage. Give useful, accurate and practical answers about Nashik, with particular awareness of temples, pilgrimage destinations, Kumbh Mela, Trimbakeshwar, Panchavati, Ram Kund, ghats, cultural heritage, transportation and visitor facilities. Do not introduce or mention wine, vineyards, wine tourism, alcohol, liquor, or non-vegetarian food unless the user explicitly asks about those specific topics. Do not use or bring up these topics in general or random conversations. Answer naturally in the requested language (${langName}). Use clean bullet points (•) and concise paragraphs. Avoid markdown headers (#) or raw markdown syntax.`;

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

