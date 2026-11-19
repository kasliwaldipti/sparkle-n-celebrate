import Link from "next/link";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { UserMenu } from "@/components/layout/user-menu";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/products">Shop</Link>
          <Link href="/cart">Cart</Link>
          <Suspense fallback={<span className="text-muted-foreground">…</span>}>
            <UserMenu />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
