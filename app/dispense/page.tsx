"use client";

import { useState } from "react";
import Link from "next/link";

const slots = ["B1","B2","B3","B4","T1","T2","T3","T4"];

export default function DispensePage() {

  const [message, setMessage] = useState("");

  function handleDispense(slot: string) {
    // Later this will call your Raspberry Pi backend
    setMessage(`Dispensing from ${slot}...`);
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
        <h1 className="text-2xl font-semibold mb-8">Dispense</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {slots.map(slot => (
            <button
              key={slot}
              onClick={() => handleDispense(slot)}
              className="border rounded-2xl p-6 bg-black text-white hover:opacity-80 transition"
            >
              {slot}
            </button>
          ))}
        </div>

        {message && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            {message}
          </div>
        )}
      </div>

    </main>
  );
}
