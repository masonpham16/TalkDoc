"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Slot = "B1" | "B2" | "B3" | "B4" | "T1" | "T2" | "T3" | "T4";

type Item = {
  name: string;
  quantity: number;
};

type Inventory = Record<Slot, Item | null>;

const LS_KEY = "talkdoc_inventory_simple_v1";

function emptyInventory(): Inventory {
  return { B1: null, B2: null, B3: null, B4: null, T1: null, T2: null, T3: null, T4: null };
}

function safeParseInventory(raw: string | null): Inventory | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const slots: Slot[] = ["B1", "B2", "B3", "B4", "T1", "T2", "T3", "T4"];
    const inv: any = {};
    for (const s of slots) inv[s] = parsed[s] ?? null;
    return inv as Inventory;
  } catch {
    return null;
  }
}

export default function InventoryPage() {
  const router = useRouter();

  const [infoOpen, setInfoOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  const [inventory, setInventory] = useState<Inventory>(emptyInventory());
  const [selected, setSelected] = useState<Slot | null>(null);

  const [selectPopupOpen, setSelectPopupOpen] = useState(true);

  type Mode = "none" | "add" | "details" | "edit" | "removeConfirm";
  const [mode, setMode] = useState<Mode>("none");

  // form
  const [draftName, setDraftName] = useState("");
  const [draftQty, setDraftQty] = useState<number>(1);

  const [status, setStatus] = useState("");

  const selectedItem = useMemo(() => (selected ? inventory[selected] : null), [inventory, selected]);

  // Load from localStorage once
  useEffect(() => {
    const local = safeParseInventory(localStorage.getItem(LS_KEY));
    if (local) setInventory(local);
    setHydrated(true);
  }, []);

  // Save to localStorage whenever inventory changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY, JSON.stringify(inventory));
  }, [inventory, hydrated]);

  // When select changes, choose correct panel
  useEffect(() => {
    if (!selected) {
      setMode("none");
      return;
    }

    setSelectPopupOpen(false);
    setStatus("");

    const item = inventory[selected];
    if (item) {
      setMode("details");
      setDraftName(item.name);
      setDraftQty(item.quantity);
    } else {
      setMode("add");
      setDraftName("");
      setDraftQty(1);
    }
  }, [selected, inventory]);

  function saveItem() {
    if (!selected) return;
    const name = draftName.trim();
    if (!name) {
      setStatus("❌ Please enter an item name.");
      return;
    }
    const qty = Number(draftQty);
    if (!Number.isFinite(qty) || qty < 0) {
      setStatus("❌ Quantity must be 0 or greater.");
      return;
    }

    setInventory((prev) => ({ ...prev, [selected]: { name, quantity: qty } }));
    setMode("details");
    setStatus("✅ Saved.");
  }

  function startEdit() {
    if (!selected || !selectedItem) return;
    setDraftName(selectedItem.name);
    setDraftQty(selectedItem.quantity);
    setMode("edit");
    setStatus("");
  }

  function confirmRemove() {
    setMode("removeConfirm");
    setStatus("");
  }

  function removeItem() {
    if (!selected) return;
    setInventory((prev) => ({ ...prev, [selected]: null }));
    setMode("add");
    setDraftName("");
    setDraftQty(1);
    setStatus("✅ Removed.");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7f6] to-[#c8f1ef] text-slate-900">
      {/* HEADER */}
      <header className="bg-[#003f3f] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Home */}
          <button
            onClick={() => router.push("/")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00b3b3] shadow-md hover:scale-105 transition"
            aria-label="Home"
            title="Home"
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

          {/* Title / Info */}
          <button onClick={() => setInfoOpen(true)} className="text-center">
            <div className="text-3xl font-bold tracking-wide">TalkDoc</div>
            <div className="text-sm opacity-80">(Info)</div>
          </button>

          {/* Bell */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#00d4c4] shadow-md hover:scale-105 transition"
            aria-label="Notifications"
            title="Notifications"
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

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          {/* LEFT: diagram */}
          <div className="flex justify-center">
            <SimpleSlotModel selected={selected} inventory={inventory} onSelect={setSelected} />
          </div>

          {/* RIGHT: panel */}
          <div className="flex flex-col items-center text-center">
            {mode === "none" ? (
              <div className="mt-16 text-5xl font-extrabold tracking-tight text-slate-900">
                Please select a sector
              </div>
            ) : (
              <div className="w-full max-w-xl rounded-3xl bg-white/85 p-8 shadow-xl">
                {/* ADD */}
                {mode === "add" && selected && !selectedItem && (
                  <>
                    <div className="text-4xl font-extrabold">Add Item</div>

                    <div className="mt-10 space-y-7 text-left">
                      <Field label="Item Name">
                        <input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-[#00b3b3]"
                        />
                      </Field>

                      <Field label="Quantity">
                        <input
                          type="number"
                          min={0}
                          value={draftQty}
                          onChange={(e) => setDraftQty(Number(e.target.value))}
                          className="w-40 rounded-2xl border border-slate-300 bg-white px-6 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-[#00b3b3]"
                        />
                      </Field>

                      <button
                        onClick={saveItem}
                        className="w-full rounded-2xl bg-slate-400 py-5 text-2xl font-extrabold text-slate-900 shadow-lg hover:bg-slate-500 transition"
                      >
                        Save
                      </button>
                    </div>
                  </>
                )}

                {/* DETAILS */}
                {mode === "details" && selected && selectedItem && (
                  <>
                    <div className="text-4xl font-extrabold">Item</div>

                    <div className="mt-10 space-y-6 text-left">
                      <div className="rounded-3xl bg-[#e8fbfb] p-7">
                        <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-lg">
                          <div>
                            <div className="font-extrabold text-slate-800">Slot</div>
                            <div className="text-slate-700">{selected}</div>
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800">Quantity</div>
                            <div className="text-slate-700">{selectedItem.quantity}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="font-extrabold text-slate-800">Item Name</div>
                            <div className="text-slate-700">{selectedItem.name}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={startEdit}
                          className="flex-1 rounded-2xl bg-[#22c55e] py-4 text-xl font-extrabold text-white shadow-lg hover:opacity-90 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={confirmRemove}
                          className="flex-1 rounded-2xl bg-[#ef4444] py-4 text-xl font-extrabold text-white shadow-lg hover:opacity-90 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* EDIT */}
                {mode === "edit" && selected && selectedItem && (
                  <>
                    <div className="text-4xl font-extrabold">Edit Item</div>

                    <div className="mt-10 space-y-7 text-left">
                      <Field label="Item Name">
                        <input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-[#00b3b3]"
                        />
                      </Field>

                      <Field label="Quantity">
                        <input
                          type="number"
                          min={0}
                          value={draftQty}
                          onChange={(e) => setDraftQty(Number(e.target.value))}
                          className="w-40 rounded-2xl border border-slate-300 bg-white px-6 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-[#00b3b3]"
                        />
                      </Field>

                      <div className="flex gap-4">
                        <button
                          onClick={saveItem}
                          className="flex-1 rounded-2xl bg-slate-400 py-5 text-2xl font-extrabold text-slate-900 shadow-lg hover:bg-slate-500 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setMode("details")}
                          className="flex-1 rounded-2xl bg-slate-200 py-5 text-2xl font-extrabold text-slate-900 shadow hover:bg-slate-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* REMOVE CONFIRM */}
                {mode === "removeConfirm" && selected && selectedItem && (
                  <>
                    <div className="text-4xl font-extrabold">Remove</div>

                    <div className="mt-8 flex items-center justify-center gap-3">
                      <div className="w-full rounded-2xl border border-slate-400 bg-white px-6 py-4 text-left text-lg font-semibold">
                        {selectedItem.name}
                      </div>
                      <div className="text-4xl font-extrabold">?</div>
                    </div>

                    <div className="mt-10 flex items-center justify-center gap-10">
                      <button
                        onClick={removeItem}
                        className="h-24 w-24 rounded-full bg-[#22c55e] text-3xl font-extrabold text-white shadow-lg hover:scale-105 transition"
                      >
                        YES
                      </button>
                      <button
                        onClick={() => setMode("details")}
                        className="h-24 w-24 rounded-full bg-[#ef4444] text-3xl font-extrabold text-white shadow-lg hover:scale-105 transition"
                      >
                        NO
                      </button>
                    </div>
                  </>
                )}

                {status && (
                  <div className="mt-8 rounded-2xl bg-white px-5 py-4 text-left shadow">
                    <div className="text-xl font-extrabold text-slate-900">Status</div>
                    <div className="mt-2 text-slate-700">{status}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Select popup */}
      {selectPopupOpen && (
        <Overlay onClose={() => setSelectPopupOpen(false)}>
          <div className="w-[min(720px,92vw)] rounded-3xl border-4 border-[#003f3f] bg-white p-10 shadow-2xl text-center">
            <div className="text-5xl font-extrabold text-slate-900">Please select a sector</div>
            <div className="mt-4 text-slate-600">
              Click any label (T1–T4 or B1–B4) to add, edit, or remove an item.
            </div>
            <button
              onClick={() => setSelectPopupOpen(false)}
              className="mt-8 rounded-2xl bg-[#00b3b3] px-7 py-3 text-lg font-extrabold text-white hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </Overlay>
      )}

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
        <Overlay onClose={() => setNotifOpen(false)}>
          <div className="relative w-[min(720px,92vw)] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Notifications</h2>
              <button className="text-2xl font-bold" onClick={() => setNotifOpen(false)}>
                ✕
              </button>
            </div>
            <p className="mt-6 text-slate-600">No notifications yet.</p>
          </div>
        </Overlay>
      )}
    </div>
  );
}

/**
 * Diagram:
 * - no wedge lines
 * - click labels only
 * - ✓ if occupied, ✕ if empty
 * - no item names shown on the diagram
 */
function SimpleSlotModel({
  selected,
  inventory,
  onSelect,
}: {
  selected: Slot | null;
  inventory: Inventory;
  onSelect: (slot: Slot) => void;
}) {
  const stroke = "#000000";
  const yellow = "#F7FF00";
  const green = "#35F000";

  function isFilled(slot: Slot) {
    return !!inventory[slot];
  }

  function labelStyle(slot: Slot) {
    const active = selected === slot;
    return {
      cursor: "pointer",
      fontWeight: 900,
      fontSize: slot.startsWith("T") ? 26 : 38,
      fill: "#000",
      paintOrder: "stroke",
      stroke: active ? green : "transparent",
      strokeWidth: active ? 10 : 0,
      strokeLinejoin: "round" as const,
    };
  }

  function statusMark(slot: Slot) {
    return isFilled(slot) ? "✓" : "✕";
  }

  function markFill(slot: Slot) {
    return isFilled(slot) ? "#16a34a" : "#dc2626";
  }

  const markPos: Record<Slot, { x: number; y: number; size: number }> = {
    T1: { x: 295, y: 135, size: 18 },
    T2: { x: 415, y: 170, size: 18 },
    T3: { x: 295, y: 205, size: 18 },
    T4: { x: 175, y: 170, size: 18 },
    B1: { x: 305, y: 350, size: 24 },
    B2: { x: 440, y: 395, size: 24 },
    B3: { x: 305, y: 455, size: 24 },
    B4: { x: 170, y: 395, size: 24 },
  };

  return (
    <svg viewBox="0 0 520 520" className="w-[min(540px,95vw)] select-none">
      <path d="M120 80 L400 80 L440 470 L80 470 Z" fill="white" stroke={stroke} strokeWidth="10" />
      <line x1="260" y1="230" x2="260" y2="305" stroke={stroke} strokeWidth="8" />
      <ellipse cx="260" cy="160" rx="175" ry="88" fill={yellow} />
      <ellipse cx="260" cy="380" rx="210" ry="100" fill={yellow} />

      {/* labels */}
      <text x="260" y="135" textAnchor="middle" style={labelStyle("T1")} onClick={() => onSelect("T1")}>T1</text>
      <text x="380" y="170" textAnchor="middle" style={labelStyle("T2")} onClick={() => onSelect("T2")}>T2</text>
      <text x="260" y="205" textAnchor="middle" style={labelStyle("T3")} onClick={() => onSelect("T3")}>T3</text>
      <text x="140" y="170" textAnchor="middle" style={labelStyle("T4")} onClick={() => onSelect("T4")}>T4</text>

      <text x="260" y="350" textAnchor="middle" style={labelStyle("B1")} onClick={() => onSelect("B1")}>B1</text>
      <text x="395" y="395" textAnchor="middle" style={labelStyle("B2")} onClick={() => onSelect("B2")}>B2</text>
      <text x="260" y="455" textAnchor="middle" style={labelStyle("B3")} onClick={() => onSelect("B3")}>B3</text>
      <text x="125" y="395" textAnchor="middle" style={labelStyle("B4")} onClick={() => onSelect("B4")}>B4</text>

      {/* marks */}
      {(Object.keys(markPos) as Slot[]).map((slot) => (
        <text
          key={slot}
          x={markPos[slot].x}
          y={markPos[slot].y}
          textAnchor="middle"
          fontSize={markPos[slot].size}
          fontWeight={900}
          fill={markFill(slot)}
        >
          {statusMark(slot)}
        </text>
      ))}
    </svg>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-2xl font-extrabold text-[#0f172a]">{label}:</div>
      {children}
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

/*
IMPORTANT (Dispense sharing):
This page stores inventory under localStorage key:
  "talkdoc_inventory_simple_v1"

To show the item name in your Dispense page when a slot is selected,
read this same key and map slot -> item.name.
*/
