import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Your cart</h1>
      <CartView />
    </div>
  );
}
