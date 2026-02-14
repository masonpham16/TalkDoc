"use client";

import { useState } from "react";
import Link from "next/link";

const slots = ["B1","B2","B3","B4","T1","T2","T3","T4"];

export default function InventoryPage() {

  const [inventory, setInventory] = useState(
    Object.fromEntries(
      slots.map(slot => [slot, { name: "", qty: 0 }])
    )
  );

  function updateName(slot: string, value: string) {
    setInventory(prev => ({
      ...prev,
      [slot]: { ...prev[slot], name: value }
    }));
  }

  function changeQty(slot: string, amount: number) {
    setInventory(prev => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        qty: Math.max(0, prev[slot].qty + amount)
      }
    }));
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

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6">Inventory</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {slots.map(slot => (
            <div key={slot} className="border rounded-2xl p-4 shadow-sm">
              <h2 className="text-lg font-semibold">{slot}</h2>

              <input
                type="text"
                placeholder="Item name"
                value={inventory[slot].name}
                onChange={(e) => updateName(slot, e.target.value)}
                className="mt-3 w-full border rounded-lg px-3 py-2 text-sm"
              />

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => changeQty(slot, -1)}
                  className="px-3 py-2 bg-gray-200 rounded-lg"
                >
                  -
                </button>

                <div className="font-semibold">
                  {inventory[slot].qty}
                </div>

                <button
                  onClick={() => changeQty(slot, 1)}
                  className="px-3 py-2 bg-black text-white rounded-lg"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}
