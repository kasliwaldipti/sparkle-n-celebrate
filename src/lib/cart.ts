"use client";

// Client-side cart in localStorage. Prices here are for display only;
// checkout re-reads every price from the database on the server.

export interface CartLine {
  inventoryItemId: string;
  name: string;
  variant: string;
  pricePaise: number;
  quantity: number;
}

const KEY = "cart:v1";

export function readCart(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartLine[];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Storage may be blocked (private mode); the cart just won't persist.
  }
}

export function addToCart(line: CartLine) {
  const lines = readCart();
  const existing = lines.find((l) => l.inventoryItemId === line.inventoryItemId);
  if (existing) existing.quantity = Math.min(existing.quantity + line.quantity, 20);
  else lines.push(line);
  writeCart(lines);
}
