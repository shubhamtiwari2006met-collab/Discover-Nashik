"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, Sparkles, Mic, Volume2, VolumeX } from "lucide-react";
import { useTranslation, type Language } from "@/lib/i18n";

type SpeechRecognitionEventLike = Event & { results: SpeechRecognitionResultList };
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  const browserWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
};

const speechLocale: Record<Language, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

const cleanChatReply = (reply: string) => reply
  .replace(/^\s{0,3}#{1,6}\s*/gm, "")
  .replace(/^\s*[-*+]\s+/gm, "• ")
  .replace(/\*\*(.*?)\*\*/g, "$1")
  .replace(/__(.*?)__/g, "$1")
  .replace(/`([^`]+)`/g, "$1")
  .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
  .replace(/[ \t]+\n/g, "\n")
  .trim();

const getGreetingMessage = (language: Language = "en") => {
  if (language === "hi") {
    return "नमस्ते! डिस्कवर नासिक में आपका स्वागत है। मैं नासिक के आध्यात्मिक स्थलों, कुंभ मेला 2027, मंदिरों, पंचवटी, त्र्यंबकेश्वर और तीर्थ यात्रा के बारे में आपकी कैसे मदद कर सकता हूँ?";
  }
  if (language === "mr") {
    return "नमस्कार! डिस्कव्हर नाशिकमध्ये आपले स्वागत आहे. मी तुम्हाला नाशिकची धार्मिक ठिकाणे, कुंभमेळा २०२७, मंदिरे, पंचवटी, त्र्यंबकेश्वर आणि प्रवासाच्या नियोजनाबद्दल कशी मदत करू शकतो?";
  }
  return "Hello! Welcome to Discover Nashik. How can I help you explore Nashik's spiritual places, Kumbh Mela 2027, temples, pilgrimage routes, or other local attractions?";
};

const getPredefinedReply = (input: string, language: Language = "en") => {
  const value = input.toLowerCase().trim();

  // Greetings
  if (value === "hi" || value === "hello" || value === "hey" || value.startsWith("hi ") || value.startsWith("hello ")) {
    return getGreetingMessage(language);
  }

  if (value.includes("2 days")) {
    return "Day 1: Trimbakeshwar Temple → Panchavati → Ram Kund → Kalaram Temple\nDay 2: Anjaneri Fort → Pandavleni Caves → Muktidham";
  }

  if (value.includes("3 days")) {
    return "Day 1: Trimbakeshwar Temple → Panchavati → Ram Kund\nDay 2: Anjaneri Fort → Pandavleni Caves → Goda Ghat\nDay 3: Muktidham → Coin Museum → Someshwar Temple";
  }

  if (value.includes("4 days")) {
    return "Day 1: Trimbakeshwar → Panchavati → Ramkund → Goda Ghat\nDay 2: Anjaneri/Brahmagiri → Pandavleni Caves\nDay 3: Local Food (Misal Pav) → ISKCON Temple → Swaminarayan Temple → Tapovan\nDay 4: Navshya Ganpati → Gangapur Dam → Local Heritage Markets";
  }

  if (value.includes("best time to visit")) {
    return "The best time to visit Nashik is from October to March when the weather is pleasant for pilgrimage and sightseeing. During Kumbh Mela 2027, plan ahead for auspicious bathing dates.";
  }

  if (value.includes("famous places") || value.includes("best places")) {
    return "Some famous spiritual and cultural places in Nashik include Trimbakeshwar Temple (Jyotirlinga), Panchavati, Ram Kund, Kalaram Temple, Muktidham, and Anjaneri Fort.";
  }

  if (value.includes("kumbh")) {
    return "Kumbh Mela 2027 in Nashik will take place along the sacred Godavari River (Ram Kund) and Trimbakeshwar. Plan your accommodation and transport early as millions of pilgrims gather.";
  }

  if (value.includes("non-veg") || value.includes("non veg") || value.includes("meat") || value.includes("chicken") || value.includes("mutton") || value.includes("fish")) {
    return "Nashik has local eateries serving regional non-vegetarian cuisine. However, note that areas surrounding holy sites like Trimbakeshwar and Ram Kund strictly serve vegetarian food.";
  }

  if (value.includes("alcohol") || value.includes("liquor") || value.includes("bar") || value.includes("pub")) {
    return "Alcohol is restricted near holy pilgrimage zones like Trimbakeshwar and sacred ghats. Licensed establishments are available in commercial areas of Nashik city.";
  }

  // Only mention wine/vineyards if user explicitly asked
  if (value.includes("wine") || value.includes("vineyard") || value.includes("winery")) {
    return "Nashik has notable wineries such as Sula Vineyards, York Winery, and Soma Vineyards located towards Gangapur Dam.";
  }

  if (value.includes("food") || value.includes("eat")) {
    return "Nashik is renowned for vegetarian specialties like Misal Pav, Vada Pav, Sabudana Vada, and traditional Maharashtrian sweets like Shrikhand and Jalebi.";
  }

  if (value.includes("temple") || value.includes("temples")) {
    return "Key sacred temples in Nashik include Trimbakeshwar Jyotirlinga, Kalaram Temple, Muktidham, Navshya Ganpati, and Kapaleshwar Temple.";
  }

  if (value.includes("nature") || value.includes("trek")) {
    return "For nature and trekking, explore Anjaneri Fort (birthplace of Lord Hanuman), Brahmagiri Hill, Pandavleni Caves, and the serene Gangapur Dam backwaters.";
  }

  if (value.includes("history")) {
    return "Nashik has deep historical significance dating back to the Ramayana period at Panchavati and Tapovan, along with the ancient 2nd-century BCE Pandavleni Caves.";
  }

  return getGreetingMessage(language);
};

const getGeminiReply = async (
  question: string,
  language: Language,
  history: { role: "user" | "ai"; content: string }[] = []
): Promise<string> => {
  if (typeof window !== "undefined" && !navigator.onLine) {
    return getPredefinedReply(question, language);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, language, history }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error(`Chat API request failed with status ${response.status}:`, errData);
      return getPredefinedReply(question, language);
    }

    const data = await response.json();
    if (data?.reply && typeof data.reply === "string" && data.reply.trim().length > 0) {
      return data.reply.trim();
    }

    return getPredefinedReply(question, language);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Chat API request timed out, using predefined reply.");
    } else {
      console.error("Chat API request failed, using predefined reply:", error);
    }
    return getPredefinedReply(question, language);
  } finally {
    clearTimeout(timeoutId);
  }
};

export function ChatbotWidget() {
  const { language, t } = useTranslation();
  const [chatLanguage, setChatLanguage] = useState<Language>(language);
  const [isOpen, setIsOpen] = useState(false);

  // Sync chat language when global language changes
  useEffect(() => {
    setChatLanguage(language);
  }, [language]);

  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: getGreetingMessage(language) }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const voiceAvailable = typeof window !== "undefined" && Boolean(window.speechSynthesis || getSpeechRecognition());
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeSpeechIdRef = useRef<number>(0);
  const activeRequestIdRef = useRef<number>(0);

  const stopSpeaking = () => {
    activeSpeechIdRef.current += 1;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingIndex(null);
  };

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Cancel speech whenever the chatbot is closed or language is changed
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
    }
  }, [isOpen]);

  useEffect(() => {
    stopSpeaking();
  }, [chatLanguage]);

  const speak = (text: string, index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    activeSpeechIdRef.current += 1;
    const currentSpeechId = activeSpeechIdRef.current;

    // Cancel any ongoing speech immediately before starting new utterance
    window.speechSynthesis.cancel();

    const utteranceText = text.replace(/•/g, "").trim();
    if (!utteranceText) return;

    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.lang = speechLocale[chatLanguage] || "en-IN";

    utterance.onstart = () => {
      if (activeSpeechIdRef.current === currentSpeechId) {
        setIsSpeaking(true);
        setSpeakingIndex(index);
      }
    };

    utterance.onend = () => {
      if (activeSpeechIdRef.current === currentSpeechId) {
        setIsSpeaking(false);
        setSpeakingIndex(null);
      }
    };

    utterance.onerror = () => {
      if (activeSpeechIdRef.current === currentSpeechId) {
        setIsSpeaking(false);
        setSpeakingIndex(null);
      }
    };

    setIsSpeaking(true);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceInput = () => {
    const recognitionConstructor = getSpeechRecognition();
    if (!recognitionConstructor) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new recognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLocale[chatLanguage];
    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript || "")
        .join(" ");
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleSend = async () => {
    const currentInput = input.trim();
    if (!currentInput) return;

    // 1. IMMEDIATELY cancel any ongoing speech
    stopSpeaking();

    // 2. Increment request ID to prevent stale out-of-order API responses from overwriting latest UI
    activeRequestIdRef.current += 1;
    const currentRequestId = activeRequestIdRef.current;

    const currentHistory = [...messages];
    setMessages(prev => [...prev, { role: "user", content: currentInput }]);
    setInput("");
    setIsLoading(true);

    try {
      const reply = await getGeminiReply(currentInput, chatLanguage, currentHistory);

      // Check if a newer request was sent while waiting
      if (currentRequestId !== activeRequestIdRef.current) {
        return;
      }

      const cleanedReply = cleanChatReply(reply);
      setMessages(prev => [...prev, { role: "ai", content: cleanedReply }]);
    } catch (error) {
      if (currentRequestId !== activeRequestIdRef.current) return;
      console.error("Chat request failed:", error);
      const fallbackReply = cleanChatReply(getPredefinedReply(currentInput, chatLanguage));
      setMessages(prev => [...prev, { role: "ai", content: fallbackReply }]);
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const closeChatbot = () => {
    stopSpeaking();
    setIsOpen(false);
  };

  const toggleOpen = () => {
    setIsOpen(prev => {
      const nextState = !prev;
      if (!nextState) {
        stopSpeaking();
      }
      return nextState;
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-24 right-4 z-50 flex h-[520px] w-80 flex-col overflow-hidden rounded-[22px] border border-orange-100 bg-white shadow-[0_22px_70px_rgba(67,31,12,0.28)] dark:border-orange-900/50 dark:bg-slate-900 md:right-8 md:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-orange-400/20 bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c] p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-[#fff7ed] text-orange-600 shadow-[0_4px_14px_rgba(93,35,8,0.22)]">
                  <div className="absolute inset-1 rounded-full border border-orange-200" />
                  <MessageCircle className="relative h-5 w-5 stroke-[1.8]" />
                  <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-[#fff7ed] bg-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold tracking-tight">{t("Nashik AI Guide")}</h3>
                    <Sparkles className="h-3.5 w-3.5 text-orange-100" />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-orange-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
                    {t("Always here to help")}
                  </p>
                </div>
              </div>
              <button onClick={closeChatbot} className="rounded-full p-2 text-orange-50 transition-colors hover:bg-white/15" aria-label="Close chatbot">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chatbot Language Selector */}
            <div className="flex items-center justify-between border-b border-orange-100 bg-[#fffaf5] px-4 py-2 text-xs dark:border-slate-800 dark:bg-slate-950">
              <span className="font-semibold text-slate-600 dark:text-slate-400">{t("Language")}:</span>
              <div className="flex items-center gap-1">
                {(["en", "hi", "mr"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      setChatLanguage(lang);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                      chatLanguage === lang
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-600 hover:bg-orange-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {lang === "en" ? "English" : lang === "hi" ? "हिन्दी" : "मराठी"}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#fffaf5] p-4 dark:bg-slate-950">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`group relative max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6 whitespace-pre-line shadow-sm ${
                    msg.role === "user" 
                      ? "rounded-br-md bg-orange-500 text-white" 
                      : "rounded-bl-md border border-orange-100 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}>
                    {msg.content}
                    {msg.role === "ai" && voiceAvailable && (
                      <button
                        type="button"
                        onClick={() => {
                          if (speakingIndex === i) {
                            stopSpeaking();
                          } else {
                            speak(msg.content, i);
                          }
                        }}
                        className="absolute -bottom-2 -right-2 rounded-full border border-orange-100 bg-white p-1.5 text-orange-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-orange-300"
                        aria-label={speakingIndex === i ? t("Stop reading") : t("Read aloud")}
                      >
                        {speakingIndex === i ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-orange-100 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <span className="flex gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400 [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400 [animation-delay:300ms]" /></span>
                    {t("Thinking...")}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2 border-t border-orange-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isLoading && handleSend()}
                placeholder={t("Ask about Nashik...")}
                className="chatbot-message-input flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-orange-700 focus:ring-2 focus:ring-orange-900/30"
              />
              {voiceAvailable && getSpeechRecognition() && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`flex-shrink-0 rounded-xl p-2.5 text-white shadow-sm transition-all hover:-translate-y-0.5 ${isListening ? "bg-red-500 hover:bg-red-600" : "bg-slate-700 hover:bg-slate-800"}`}
                  aria-label={isListening ? t("Stop voice input") : t("Start voice input")}
                  title={isListening ? t("Stop voice input") : t("Start voice input")}
                >
                  <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
                </button>
              )}
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="flex-shrink-0 rounded-xl bg-orange-500 p-2.5 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-orange-600 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        suppressHydrationWarning
        className="group fixed bottom-6 right-4 z-50 flex h-[62px] w-[62px] items-center justify-center rounded-full border-4 border-[#fff7ed] bg-[#ea580c] text-white shadow-[0_10px_30px_rgba(234,88,12,0.38)] transition-all hover:bg-[#c2410c] hover:shadow-[0_12px_34px_rgba(234,88,12,0.5)] dark:border-[#1a120f] md:right-8"
        aria-label={isOpen ? "Close chatbot" : "Open Nashik AI Guide"}
      >
        <span className="absolute inset-1 rounded-full border border-white/25" />
        {isOpen ? <X className="relative h-6 w-6" /> : <MessageCircle className="relative h-7 w-7 stroke-[1.7] transition-transform group-hover:scale-105" />}
      </motion.button>
    </>
  );
}
