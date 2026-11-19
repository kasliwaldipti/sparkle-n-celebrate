import { describe, expect, it } from "vitest";
import { assertPaise, formatPaise, lineTotalPaise, rupeesToPaise } from "@/lib/money";

describe("money (integer paise)", () => {
  it("converts rupees to paise without float drift", () => {
    expect(rupeesToPaise(1499)).toBe(149900);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
  });

  it("rejects non-integer or negative paise", () => {
    expect(() => assertPaise(10.5)).toThrow();
    expect(() => assertPaise(-1)).toThrow();
  });

  it("multiplies line totals in paise", () => {
    expect(lineTotalPaise(64900, 3)).toBe(194700);
    expect(() => lineTotalPaise(64900, 0)).toThrow();
  });

  it("formats as Indian rupees", () => {
    expect(formatPaise(14990000)).toBe("₹1,49,900.00");
  });
});
