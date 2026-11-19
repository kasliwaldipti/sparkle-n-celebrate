"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";

interface Props {
  variants: { id: string; label: string }[];
  name: string;
  pricePaise: number;
}

export function AddToCartButton({ variants, name, pricePaise }: Props) {
  const [variantId, setVariantId] = useState(variants[0]?.id);
  const [added, setAdded] = useState(false);

  return (
    <div className="space-y-3">
      {variants.length > 1 && (
        <select
          className="rounded-md border px-3 py-2"
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      )}
      <Button
        onClick={() => {
          const v = variants.find((x) => x.id === variantId);
          if (!v) return;
          addToCart({ inventoryItemId: v.id, name, variant: v.label, pricePaise, quantity: 1 });
          setAdded(true);
        }}
      >
        {added ? "Added to cart" : "Add to cart"}
      </Button>
    </div>
  );
}
