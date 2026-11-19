"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { readCart, writeCart, type CartLine } from "@/lib/cart";
import { formatPaise, lineTotalPaise } from "@/lib/money";

// Snapshot cache so useSyncExternalStore gets a stable value between changes.
let snapshot: CartLine[] | null = null;
const listeners = new Set<() => void>();
const EMPTY: CartLine[] = [];

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  snapshot ??= readCart();
  return snapshot;
}
function update(lines: CartLine[]) {
  writeCart(lines);
  snapshot = lines;
  listeners.forEach((l) => l());
}

export function CartView() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  if (lines.length === 0) {
    return (
      <p className="text-muted-foreground">
        Your cart is empty. <Link href="/products" className="underline">Browse jewellery</Link>
      </p>
    );
  }

  const subtotal = lines.reduce((sum, l) => sum + lineTotalPaise(l.pricePaise, l.quantity), 0);

  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-xl border">
        {lines.map((l) => (
          <li key={l.inventoryItemId} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{l.name}</p>
              <p className="text-sm text-muted-foreground">
                {l.variant} × {l.quantity}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span>{formatPaise(lineTotalPaise(l.pricePaise, l.quantity))}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update(lines.filter((x) => x.inventoryItemId !== l.inventoryItemId))}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <p className="text-lg">Subtotal: {formatPaise(subtotal)}</p>
        <Link href="/checkout" className={buttonVariants()}>
          Checkout
        </Link>
      </div>
    </div>
  );
}
