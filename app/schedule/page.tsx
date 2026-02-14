"use client";

import { useState } from "react";
import Link from "next/link";

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const slots = ["B1","B2","B3","B4","T1","T2","T3","T4"];

export default function SchedulePage() {

  const [day, setDay] = useState("Monday");
  const [time, setTime] = useState("08:00");
  const [slot, setSlot] = useState("B1");
  const [reminders, setReminders] = useState<any[]>([]);

  function addReminder() {
    setReminders(prev => [
      ...prev,
      { day, time, slot }
    ]);
  }

  function removeReminder(index: number) {
    setReminders(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <div className="w-full bg-black text-white px-5 py-4 flex items-center justify-between">
        <Link href="/" className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
          H
        </Link>

        <div className="text-xl font-semibold">
          TalkDoc
        </div>

        <div className="w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold">
          !
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6">Schedule / Reminders</h1>

        <div className="grid md:grid-cols-3 gap-6">

          <div>
            <label className="text-sm font-semibold">Day</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-2"
            >
              {days.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Slot</label>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-2"
            >
              {slots.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>

        <button
          onClick={addReminder}
          className="mt-6 px-6 py-3 bg-black text-white rounded-lg"
        >
          Add Reminder
        </button>

        <div className="mt-10 space-y-4">
          {reminders.map((r, index) => (
            <div key={index} className="border p-4 rounded-lg flex justify-between items-center">
              <div>
                {r.day} — {r.time} — {r.slot}
              </div>
              <button
                onClick={() => removeReminder(index)}
                className="text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

      </div>

    </main>
  );
}
