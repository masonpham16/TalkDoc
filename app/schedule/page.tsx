"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Shared keys (used across pages)
 * Inventory:      talkdoc_inventory_simple_v1
 * Reminders:      talkdoc_reminders_v2
 * Notifications:  talkdoc_notifications_v2
 * Unread flag:    talkdoc_notifications_unread_v2
 *
 * NOTE: This page uses AM/PM in the UI, but stores times internally as "HH:MM" 24-hr.
 * It supports EVERY minute of the day (not just 15-minute steps).
 * Notifications "fire" while the app/tab is open (in-app notifications).
 */

type Slot = "B1" | "B2" | "B3" | "B4" | "T1" | "T2" | "T3" | "T4";
type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

type Item = { name: string; quantity: number };
type Inventory = Record<Slot, Item | null>;

type Reminder = {
  id: string;
  slot: Slot;
  itemName: string;
  days: DayKey[];
  times: string[]; // "HH:MM" 24-hr internal
  createdAt: number;
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  meta?: { reminderId?: string; slot?: Slot; itemName?: string; day?: DayKey; time?: string };
};

const INV_KEY = "talkdoc_inventory_simple_v1";
const REM_KEY = "talkdoc_reminders_v2";
const NOTIF_KEY = "talkdoc_notifications_v2";
const NOTIF_UNREAD_KEY = "talkdoc_notifications_unread_v2";
const FIRED_KEY = "talkdoc_reminder_fired_v2";

const DAYS: { key: DayKey; label: string }[] = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" },
];

function emptyInventory(): Inventory {
  return { B1: null, B2: null, B3: null, B4: null, T1: null, T2: null, T3: null, T4: null };
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildTimesEveryMinute(): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m++) out.push(`${pad2(h)}:${pad2(m)}`);
  }
  return out;
}
const TIMES_1MIN = buildTimesEveryMinute();

function toAmPm(hhmm24: string) {
  const [hhS, mm] = hhmm24.split(":");
  const hh = Number(hhS);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${mm} ${ampm}`;
}

function parseAmPmTo24(input: string): string | null {
  // Accept formats:
  // 8:05 AM, 08:05am, 8 AM, 8am, 12:00 PM, 12 pm, etc.
  const s = input.trim().toUpperCase();

  // H:MM AM/PM
  let m = s.match(/^(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM)$/);
  if (m) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    const ap = m[3];
    if (h < 1 || h > 12) return null;
    if (min < 0 || min > 59) return null;
    let hh = h % 12;
    if (ap === "PM") hh += 12;
    return `${pad2(hh)}:${pad2(min)}`;
  }

  // H AM/PM (=> :00)
  m = s.match(/^(\d{1,2})\s*(AM|PM)$/);
  if (m) {
    const h = Number(m[1]);
    const ap = m[2];
    if (h < 1 || h > 12) return null;
    let hh = h % 12;
    if (ap === "PM") hh += 12;
    return `${pad2(hh)}:00`;
  }

  // allow 24-hr HH:MM
  m = s.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
  if (m) {
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  return null;
}

function dayFromDate(d: Date): DayKey {
  const map: DayKey[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[d.getDay()];
}

function nowHHMM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function todayKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function ScheduleRemindersPage() {
  const router = useRouter();

  const [infoOpen, setInfoOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // ✅ Hydration-safe flags
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [inventory, setInventory] = useState<Inventory>(emptyInventory());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  // Form
  const [selectedDays, setSelectedDays] = useState<DayKey[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [timeSearch, setTimeSearch] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot>("B1");

  const [status, setStatus] = useState("");

  // ✅ Real local time (but rendered only after mount)
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, [mounted]);

  // Load data from localStorage on client
  useEffect(() => {
    const inv = safeParse<Inventory>(localStorage.getItem(INV_KEY));
    if (inv) setInventory(inv);

    const rem = safeParse<Reminder[]>(localStorage.getItem(REM_KEY));
    if (rem) setReminders(rem);

    const nots = safeParse<NotificationItem[]>(localStorage.getItem(NOTIF_KEY));
    if (nots) setNotifications(nots);

    setHasUnread(localStorage.getItem(NOTIF_UNREAD_KEY) === "1");
    setHydrated(true);
  }, []);

  // Persist reminders
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(REM_KEY, JSON.stringify(reminders));
  }, [reminders, hydrated]);

  // Persist notifications + unread flag
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  }, [notifications, hydrated]);

  // Keep inventory fresh if user changes it in another tab
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === INV_KEY && e.newValue) {
        const inv = safeParse<Inventory>(e.newValue);
        if (inv) setInventory(inv);
      }
      if (e.key === NOTIF_UNREAD_KEY) {
        setHasUnread(e.newValue === "1");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const slotOptions = useMemo(() => {
    const slots: Slot[] = ["B1", "B2", "B3", "B4", "T1", "T2", "T3", "T4"];
    return slots.map((s) => ({
      slot: s,
      label: inventory[s]?.name ? `${s} — ${inventory[s]!.name}` : `${s} — (empty)`,
      disabled: !inventory[s],
    }));
  }, [inventory]);

  // Choose a filled slot by default (once)
  useEffect(() => {
    if (!hydrated) return;
    const firstFilled = slotOptions.find((o) => !o.disabled)?.slot;
    if (firstFilled) setSelectedSlot(firstFilled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const filteredTimes = useMemo(() => {
    const q = timeSearch.trim().toUpperCase();
    if (!q) return TIMES_1MIN.slice(0, 90);

    const matches: string[] = [];
    for (const t of TIMES_1MIN) {
      const disp = toAmPm(t).toUpperCase();
      if (t.includes(q) || disp.includes(q)) matches.push(t);
      if (matches.length >= 180) break;
    }
    return matches;
  }, [timeSearch]);

  function toggleDay(d: DayKey) {
    setSelectedDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function toggleTime(t24: string) {
    setSelectedTimes((prev) => (prev.includes(t24) ? prev.filter((x) => x !== t24) : [...prev, t24].sort()));
  }

  function addTypedTime() {
    const t24 = parseAmPmTo24(timeSearch);
    if (!t24) return;
    if (!TIMES_1MIN.includes(t24)) return;
    setSelectedTimes((prev) => (prev.includes(t24) ? prev : [...prev, t24].sort()));
    setTimeSearch("");
  }

  function pushNotification(n: Omit<NotificationItem, "id" | "read">) {
    const newN: NotificationItem = { id: uid("notif"), read: false, ...n };
    setNotifications((prev) => [newN, ...prev]);
    localStorage.setItem(NOTIF_UNREAD_KEY, "1");
    setHasUnread(true);
  }

  function handleAddReminder() {
    setStatus("");

    const invItem = inventory[selectedSlot];
    if (!invItem) {
      setStatus("❌ That slot is empty. Add an item in Inventory first.");
      return;
    }
    if (selectedDays.length === 0) {
      setStatus("❌ Please select at least 1 day.");
      return;
    }
    if (selectedTimes.length === 0) {
      setStatus("❌ Please select at least 1 time.");
      return;
    }

    const r: Reminder = {
      id: uid("rem"),
      slot: selectedSlot,
      itemName: invItem.name,
      days: [...selectedDays],
      times: [...selectedTimes],
      createdAt: Date.now(),
    };

    setReminders((prev) => [r, ...prev]);
    setStatus("✅ Reminder saved.");

    pushNotification({
      title: "Reminder scheduled",
      body: `${invItem.name} (${selectedSlot}) — ${selectedDays.join(", ")} @ ${selectedTimes.map(toAmPm).join(", ")}`,
      createdAt: Date.now(),
      meta: { reminderId: r.id, slot: selectedSlot, itemName: invItem.name },
    });

    setSelectedDays([]);
    setSelectedTimes([]);
    setTimeSearch("");
  }

  function deleteReminder(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    setStatus("✅ Reminder deleted.");
  }

  /**
   * ✅ Fire notifications using REAL local time:
   * - Checks every second
   * - Fires at exact minute boundary (seconds === 0)
   * - Supports ANY minute (not just 15)
   */
  useEffect(() => {
    if (!hydrated) return;

    const fired = safeParse<Record<string, boolean>>(localStorage.getItem(FIRED_KEY)) ?? {};

    const interval = setInterval(() => {
      const now = new Date();
      if (now.getSeconds() !== 0) return;

      const day = dayFromDate(now);
      const t = nowHHMM(now);
      const dateK = todayKey(now);

      const matches = reminders.filter((r) => r.days.includes(day) && r.times.includes(t));
      if (matches.length === 0) return;

      const newFired = { ...fired };
      let changed = false;

      for (const r of matches) {
        const k = `${r.id}|${day}|${t}|${dateK}`;
        if (newFired[k]) continue;

        pushNotification({
          title: "Time to take your pill",
          body: `${r.itemName} (${r.slot}) — ${toAmPm(t)} (now)`,
          createdAt: Date.now(),
          meta: { reminderId: r.id, slot: r.slot, itemName: r.itemName, day, time: t },
        });

        newFired[k] = true;
        changed = true;
      }

      if (changed) localStorage.setItem(FIRED_KEY, JSON.stringify(newFired));
    }, 1000);

    return () => clearInterval(interval);
  }, [hydrated, reminders]);

  function markAllReadAndCloseNotifs() {
    setNotifOpen(false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    localStorage.setItem(NOTIF_UNREAD_KEY, "0");
    setHasUnread(false);
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      {/* HEADER */}
      <header className="bg-[#003f3f] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00b3b3] shadow-md hover:scale-105 transition"
            aria-label="Home"
            title="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 10v11h14V10" />
            </svg>
          </button>

          <button onClick={() => setInfoOpen(true)} className="text-center">
            <div className="text-3xl font-bold tracking-wide">TalkDoc</div>
            <div className="text-sm opacity-80">(Info)</div>
          </button>

          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#00d4c4] shadow-md hover:scale-105 transition"
            aria-label="Notifications"
            title="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 -translate-y-[0.5px]">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>

            {hasUnread && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl bg-white/85 p-10 shadow-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-4xl font-extrabold">Reminders</h1>

            {/* ✅ Hydration-safe clock (renders only after mount) */}
            <div className="rounded-2xl bg-[#e8fbfb] px-5 py-3 text-sm font-extrabold text-slate-800">
              Local time:{" "}
              <span className="text-slate-900">
                {mounted
                  ? clock.toLocaleString(undefined, {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })
                  : "—"}
              </span>
            </div>
          </div>

          {/* FORM */}
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
            {/* Days */}
            <div>
              <div className="mb-3 text-lg font-extrabold text-slate-800">Day (multi-select)</div>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => {
                  const active = selectedDays.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDay(d.key)}
                      className={[
                        "rounded-xl px-4 py-3 text-sm font-extrabold shadow-sm transition",
                        active ? "bg-[#22c55e] text-white" : "bg-[#e8fbfb] text-slate-800 hover:bg-[#d6f5f4]",
                      ].join(" ")}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Times */}
            <div>
              <div className="mb-3 text-lg font-extrabold text-slate-800">Time (multi-select, every minute)</div>

              <div className="flex items-center gap-2">
                <input
                  value={timeSearch}
                  onChange={(e) => setTimeSearch(e.target.value)}
                  placeholder='Type "8:05 AM" or "12 PM" or "14:30"...'
                  className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-[#00b3b3]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTypedTime();
                  }}
                />
                <button
                  type="button"
                  onClick={addTypedTime}
                  className="rounded-2xl bg-[#00b3b3] px-4 py-3 font-extrabold text-white hover:opacity-90"
                >
                  Add
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTimes.length === 0 ? (
                  <div className="text-slate-600">No times selected.</div>
                ) : (
                  selectedTimes.map((t24) => (
                    <button
                      key={t24}
                      type="button"
                      onClick={() => toggleTime(t24)}
                      className="rounded-full bg-[#003f3f] px-3 py-1.5 text-sm font-extrabold text-white hover:opacity-90"
                      title="Click to remove"
                    >
                      {toAmPm(t24)} ✕
                    </button>
                  ))
                )}
              </div>

              <div className="mt-3 max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white">
                {filteredTimes.map((t24) => {
                  const active = selectedTimes.includes(t24);
                  return (
                    <button
                      key={t24}
                      type="button"
                      onClick={() => toggleTime(t24)}
                      className={[
                        "flex w-full items-center justify-between px-4 py-2 text-left transition",
                        active ? "bg-[#d6f5f4]" : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span className="font-semibold">{toAmPm(t24)}</span>
                      {active && (
                        <span className="rounded-full bg-[#22c55e] px-2 py-1 text-xs font-extrabold text-white">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot */}
            <div>
              <div className="mb-3 text-lg font-extrabold text-slate-800">Slot (uses Inventory)</div>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value as Slot)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-[#00b3b3]"
              >
                {slotOptions.map((o) => (
                  <option key={o.slot} value={o.slot}>
                    {o.label}
                  </option>
                ))}
              </select>

              <div className="mt-3 rounded-2xl bg-[#e8fbfb] p-4 text-left">
                <div className="text-sm font-extrabold text-slate-800">Selected item</div>
                <div className="mt-1 text-slate-700">
                  {inventory[selectedSlot]?.name ? inventory[selectedSlot]!.name : "(empty slot)"}
                </div>
              </div>

              <button
                onClick={handleAddReminder}
                className="mt-6 w-full rounded-2xl bg-black py-4 text-lg font-extrabold text-white shadow-lg hover:opacity-90 transition"
              >
                Add Reminder
              </button>

              {status && <div className="mt-4 text-sm font-semibold text-slate-700">{status}</div>}
            </div>
          </div>

          {/* LIST */}
          <div className="mt-12">
            <div className="text-2xl font-extrabold">Saved Reminders</div>

            {reminders.length === 0 ? (
              <div className="mt-4 text-slate-600">No reminders yet.</div>
            ) : (
              <div className="mt-5 space-y-4">
                {reminders.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-lg font-extrabold text-slate-900">
                          {r.itemName} <span className="text-slate-500">({r.slot})</span>
                        </div>
                        <div className="mt-1 text-slate-700">
                          Days: <span className="font-semibold">{r.days.join(", ")}</span>
                        </div>
                        <div className="text-slate-700">
                          Times: <span className="font-semibold">{r.times.map(toAmPm).join(", ")}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteReminder(r.id)}
                        className="mt-3 rounded-xl bg-[#ef4444] px-4 py-2 font-extrabold text-white hover:opacity-90 md:mt-0"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Info modal */}
      {infoOpen && (
        <Overlay onClose={() => setInfoOpen(false)}>
          <div className="relative w-[min(620px,92vw)] rounded-2xl bg-white p-8 shadow-2xl">
            <button className="absolute right-4 top-3 text-2xl font-bold" onClick={() => setInfoOpen(false)}>
              ✕
            </button>
            <h2 className="text-2xl font-bold text-center mb-6">TalkDoc Info</h2>
            <p className="text-center text-slate-600">(Information will go here)</p>
          </div>
        </Overlay>
      )}

      {/* Notifications modal */}
      {notifOpen && (
        <Overlay onClose={markAllReadAndCloseNotifs}>
          <div className="relative w-[min(820px,92vw)] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Notifications</h2>
              <button className="text-2xl font-bold" onClick={markAllReadAndCloseNotifs}>
                ✕
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="mt-6 text-slate-600">No notifications yet.</p>
            ) : (
              <div className="mt-6 space-y-3 max-h-[60vh] overflow-auto pr-1">
                {notifications.map((n) => (
                  <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-extrabold text-slate-900">{n.title}</div>
                      <div className="text-xs text-slate-500">
                        {mounted
                          ? new Date(n.createdAt).toLocaleString(undefined, {
                              weekday: "short",
                              hour: "numeric",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            })
                          : "—"}
                      </div>
                    </div>
                    <div className="mt-1 text-slate-700">{n.body}</div>
                    {!n.read && <div className="mt-2 text-xs font-bold text-red-600">NEW</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 pt-16"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div onMouseDown={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
