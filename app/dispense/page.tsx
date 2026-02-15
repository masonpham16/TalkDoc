"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Slot = "B1" | "B2" | "B3" | "B4" | "T1" | "T2" | "T3" | "T4";

const PI_IP = "http://10.166.153.56:5000";

export default function DispensePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Slot | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const question = useMemo(() => (selected ? `${selected}?` : null), [selected]);

  async function handleDispense(slot: Slot) {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`${PI_IP}/api/dispense`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slot }),
      });

      const data = await response.json();

      if (data.ok) {
        setMessage(`✅ Dispensed ${slot} at angle ${data.angle}`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch {
      setMessage("❌ Could not connect to Raspberry Pi");
    } finally {
      setBusy(false);
      setSelected(null);
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900">

      {/* HEADER */}
      <header className="bg-[#003f3f] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          {/* Home */}
          <button
            onClick={() => router.push("/")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00b3b3] shadow-md hover:scale-105 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 10v11h14V10" />
            </svg>
          </button>

          {/* Title */}
          <div className="text-center">
            <div className="text-3xl font-bold tracking-wide">TalkDoc</div>
            <div className="text-sm opacity-80">(Info)</div>
          </div>

          {/* Bell */}
          <button
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#00d4c4] shadow-md hover:scale-105 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 -translate-y-[0.5px]"
            >
              <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>

        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">

          {/* LEFT: Diagram */}
          <div className="flex justify-center">
            <DispenseDiagram selected={selected} onSelect={setSelected} />
          </div>

          {/* RIGHT: Prompt */}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-light">
              What do you want
              <br />
              to dispense?
            </h1>

            {question && (
              <>
                <div className="mt-6 text-2xl font-semibold text-[#18a34a]">
                  {question}
                </div>

                <div className="mt-6 flex gap-8">
                  <button
                    disabled={busy}
                    onClick={() => selected && handleDispense(selected)}
                    className={`h-24 w-24 rounded-full text-3xl font-bold text-white shadow-lg transition ${
                      busy
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-[#22c55e] hover:scale-105"
                    }`}
                  >
                    YES
                  </button>

                  <button
                    disabled={busy}
                    onClick={() => setSelected(null)}
                    className={`h-24 w-24 rounded-full text-3xl font-bold text-white shadow-lg transition ${
                      busy
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-[#ef4444] hover:scale-105"
                    }`}
                  >
                    NO
                  </button>
                </div>
              </>
            )}

            {message && (
              <div className="mt-10 w-full max-w-md rounded-xl bg-white/80 p-4 shadow">
                <div className="font-semibold">Status</div>
                <div className="mt-1">{message}</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* SVG DIAGRAM */
function DispenseDiagram({
  selected,
  onSelect,
}: {
  selected: Slot | null;
  onSelect: (id: Slot) => void;
}) {
  const yellow = "#F7FF00";
  const green = "#35F000";
  const stroke = "#000000";

  const fillFor = (id: Slot) => (selected === id ? green : yellow);

  return (
    <svg viewBox="0 0 520 520" className="w-[min(520px,95vw)] select-none">

      {/* Trapezoid */}
      <path d="M120 80 L400 80 L440 470 L80 470 Z" fill="white" stroke={stroke} strokeWidth="8" />

      {/* Connector */}
      <line x1="260" y1="230" x2="260" y2="305" stroke={stroke} strokeWidth="6" />

      {/* TOP (T1-T4) */}
      <ellipse cx="260" cy="160" rx="155" ry="78" fill={yellow} opacity="0.92" />

      {["T1","T2","T3","T4"].map((slot, i) => (
        <text
          key={slot}
          x={[260,360,260,160][i]}
          y={[120,165,205,165][i]}
          textAnchor="middle"
          fontSize="24"
          fontWeight="700"
          onClick={() => onSelect(slot as Slot)}
          style={{ cursor: "pointer", fill: selected===slot ? green : "black" }}
        >
          {slot}
        </text>
      ))}

      {/* BOTTOM (B1-B4) */}
      <ellipse cx="260" cy="375" rx="190" ry="92" fill={yellow} opacity="0.92" />

      {["B1","B2","B3","B4"].map((slot, i) => (
        <text
          key={slot}
          x={[260,380,260,140][i]}
          y={[345,395,450,395][i]}
          textAnchor="middle"
          fontSize="34"
          fontWeight="700"
          onClick={() => onSelect(slot as Slot)}
          style={{ cursor: "pointer", fill: selected===slot ? green : "black" }}
        >
          {slot}
        </text>
      ))}

    </svg>
  );
}
