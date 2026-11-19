"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCheckout } from "@/app/(store)/checkout/actions";
import { readCart } from "@/lib/cart";

const FIELDS = [
  ["name", "Full name"],
  ["phone", "Phone"],
  ["line1", "Address line 1"],
  ["line2", "Address line 2 (optional)"],
  ["city", "City"],
  ["state", "State"],
  ["pincode", "PIN code"],
] as const;

export function CheckoutForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    const address = Object.fromEntries(FIELDS.map(([k]) => [k, String(formData.get(k) ?? "") || undefined]));
    const items = readCart().map((l) => ({ inventoryItemId: l.inventoryItemId, quantity: l.quantity }));

    startTransition(async () => {
      const result = await createCheckout({ items, address });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // TODO: load https://checkout.razorpay.com/v1/checkout.js, open the widget with
      // result.data, then call confirmPayment() with the handler response and redirect
      // to /account/orders/[id].
      setError("Payment widget not wired up yet (TODO).");
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {FIELDS.map(([name, label]) => (
        <div key={name} className="space-y-1">
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} name={name} required={name !== "line2"} />
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Placing order…" : "Pay with Razorpay"}
      </Button>
    </form>
  );
}
