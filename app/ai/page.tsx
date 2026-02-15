"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

export default function AiPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I’m TalkDoc. Ask me a health question." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔊 TTS additions
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const lastSpokenRef = useRef<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function speak(text: string) {
    if (!voiceEnabled) return;

    // Stop any previous audio so new replies interrupt old ones
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
  const errText = await res.text();
  console.error("TTS failed:", res.status, errText);
  alert(`TTS failed: ${res.status}\n${errText}`);
  return;
}


    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
  }

  // Auto-speak newest assistant message
  useEffect(() => {
    if (!voiceEnabled) return;

    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant?.content) return;

    // Don’t repeat the same message on rerenders
    if (lastSpokenRef.current === lastAssistant.content) return;
    lastSpokenRef.current = lastAssistant.content;

    // Optional: skip speaking obvious errors
    if (
      lastAssistant.content.startsWith("Error:") ||
      lastAssistant.content.toLowerCase().includes("connection error")
    ) {
      return;
    }

    speak(lastAssistant.content);
  }, [messages, voiceEnabled]);

  async function send() {
    if (!input.trim() || loading) return;

    const updated = [...messages, { role: "user", content: input }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });

      const data = await res.json();

      if (data.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Server connection error." },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      {/* Header */}
      <header className="bg-[#003f3f] text-white px-6 py-4 flex justify-between items-center">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-[#00b3b3] flex items-center justify-center"
          aria-label="Home"
        >
          ⌂
        </button>

        <h1 className="text-2xl font-bold">TalkDoc AI</h1>

        {/* 🔊 Voice toggle (needed due to browser autoplay rules) */}
        <button
          onClick={() => setVoiceEnabled((v) => !v)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${
            voiceEnabled ? "bg-[#00b3b3] text-black" : "bg-white/20 text-white"
          }`}
          aria-label="Toggle voice"
          title="Toggle voice"
        >
          {voiceEnabled ? "🔊 Voice: ON" : "🔇 Voice: OFF"}
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-xl p-6 min-h-[60vh] space-y-4 overflow-auto">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={`inline-block px-4 py-3 rounded-2xl ${
                  m.role === "user"
                    ? "bg-[#003f3f] text-white"
                    : "bg-[#e8fbfb] text-slate-900"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && <div className="text-gray-500">Thinking...</div>}

          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex gap-3">
          <input
            className="flex-1 rounded-2xl border px-4 py-3"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask something..."
          />
          <button onClick={send} className="bg-black text-white px-6 rounded-2xl">
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
