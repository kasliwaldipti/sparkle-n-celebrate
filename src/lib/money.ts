import { siteConfig } from "@/config/site";

// Money is always integer paise. Convert to rupees only for display.

export function assertPaise(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid paise amount: ${value}`);
  }
  return value;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatPaise(paise: number): string {
  assertPaise(paise);
  return new Intl.NumberFormat(siteConfig.locale, {
    style: "currency",
    currency: siteConfig.currency,
  }).format(paise / 100);
}

export function lineTotalPaise(unitPricePaise: number, quantity: number): number {
  assertPaise(unitPricePaise);
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new Error(`Invalid quantity: ${quantity}`);
  }
  return unitPricePaise * quantity;
}
