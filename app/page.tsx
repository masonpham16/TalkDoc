"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Notif = {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
};

const LS_KEY = "talkdoc_notifications_v1";

function formatTime(ms: number) {
  return new Date(ms).toLocaleString();
}

function loadNotifs(): Notif[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveNotifs(notifs: Notif[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(notifs));
}

export default function HomePage() {
  const router = useRouter();
  const [infoOpen, setInfoOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => {
    const existing = loadNotifs();
    setNotifs(existing);
  }, []);

  useEffect(() => {
    saveNotifs(notifs);
  }, [notifs]);

  const unreadCount = useMemo(
    () => notifs.filter((n) => !n.read).length,
    [notifs]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7f6] to-[#c8f1ef] text-slate-900">
      {/* NAVBAR */}
      <header className="bg-[#003f3f] text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          {/* Home Circle */}
          <button
            onClick={() => router.push("/")}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#00b3b3] shadow-md transition hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="white"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10.5L12 3l9 7.5M5 9.5V21h14V9.5"
              />
            </svg>
          </button>

          {/* Title */}
          <button onClick={() => setInfoOpen(true)} className="text-center">
            <div className="text-3xl font-bold tracking-wide">TalkDoc</div>
            <div className="text-sm opacity-80">Info</div>
          </button>

          {/* Notification Circle */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#00d4c4] shadow-md transition hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 translate-y-[1px]"
            >
              <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-600 ring-2 ring-[#003f3f]" />
            )}
          </button>
        </div>
      </header>

      {/* VIDEO BACKGROUND SECTION (UPDATED) */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "calc(100vh - 80px)" }}
      >
        {/* Background Video */}
        <video
          src="/background.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "brightness(0.9)" }}
        />

        {/* Light overlay so video is clearly visible (adjust to /40 later if you want) */}
        <div className="absolute inset-0 bg-black/15" />

        

        {/* Buttons Content */}
        <main className="relative z-10 mx-auto flex h-full max-w-xl flex-col justify-center gap-8 px-6 py-20">
          <BigButton label="Inventory" onClick={() => router.push("/inventory")} />
          <BigButton label="Dispense" onClick={() => router.push("/dispense")} />
          <BigButton
            label="Schedule"
            onClick={() => router.push("/schedule")}
          />
        </main>
      </div>

      {/* AI Floating Button */}
      <button
        onClick={() => router.push("/ai")}
        className="fixed bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#009999] text-2xl font-bold text-white shadow-lg transition hover:scale-105"
      >
        AI
      </button>

      {/* INFO MODAL */}
      {infoOpen && (
        <Overlay onClose={() => setInfoOpen(false)}>
          <div className="relative w-[min(600px,90vw)] rounded-xl bg-white p-8 shadow-2xl">
            <button
              className="absolute right-4 top-3 text-2xl font-bold"
              onClick={() => setInfoOpen(false)}
            >
              ✕
            </button>
            <h2 className="mb-6 text-center text-2xl font-bold">TalkDoc Info</h2>
            <p className="text-center text-slate-600">
              TalkDoc is an intelligent medication management system designed to
              help users safely store, schedule, and dispense medications while
              receiving reliable health guidance through an integrated AI
              assistant.
            </p>
          </div>
        </Overlay>
      )}

      {/* NOTIFICATIONS MODAL */}
      {notifOpen && (
        <Overlay onClose={() => setNotifOpen(false)}>
          <div className="relative w-[min(750px,92vw)] rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Notifications</h2>
              <button
                className="text-2xl font-bold"
                onClick={() => setNotifOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-6 max-h-[60vh] overflow-auto">
              {notifs.length === 0 ? (
                <p className="text-slate-500">No notifications yet.</p>
              ) : (
                <ul className="space-y-4">
                  {notifs.map((n) => (
                    <li key={n.id} className="rounded-lg border p-4 shadow-sm">
                      <div className="font-semibold">{n.title}</div>
                      <div className="text-sm text-slate-600">{n.message}</div>
                      <div className="mt-2 text-xs text-slate-400">
                        {formatTime(n.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function BigButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl bg-[#003f3f] py-10 text-4xl font-light text-white shadow-xl transition hover:bg-[#005f5f]"
    >
      {label}
    </button>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 pt-16"
      onMouseDown={onClose}
    >
      <div onMouseDown={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
