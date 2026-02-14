"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      
      {/* Header */}
      <div className="w-full bg-black text-white px-5 py-4 flex items-center justify-between">
        <button className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
          H
        </button>

        <div className="flex flex-col items-center">
          <div className="text-xl font-semibold tracking-wide">
            TalkDoc
          </div>
          <button className="mt-1 text-xs px-2 py-1 rounded-full bg-white/20">
            i
          </button>
        </div>

        <button className="w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold">
          !
        </button>
      </div>

      {/* Main Buttons */}
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        <Link
          href="/inventory"
          className="block w-full bg-black text-white rounded-2xl h-40 flex items-center justify-center text-4xl font-light"
        >
          Inventory
        </Link>

        <Link
          href="/dispense"
          className="block w-full bg-black text-white rounded-2xl h-40 flex items-center justify-center text-4xl font-light"
        >
          Dispense
        </Link>

        <Link
          href="/schedule"
          className="block w-full bg-black text-white rounded-2xl h-40 flex items-center justify-center text-4xl font-light"
        >
          Schedule / Reminders
        </Link>

      </div>

      {/* Floating AI Button */}
      <button className="fixed right-5 bottom-6 w-16 h-16 rounded-full bg-gray-400 border-4 border-black shadow-lg flex items-center justify-center text-2xl font-bold text-white">
        AI
      </button>

    </main>
  );
}

