import Link from "next/link";
import { siteConfig } from "@/config/site";

const NAV = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/orders", "Orders"],
  ["/admin/approvals", "Approvals"],
] as const;

// /admin is gated by src/proxy.ts, and every admin page and action calls requireAdmin() as well.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="border-b bg-muted/40 p-4 md:w-56 md:border-r md:border-b-0">
        <Link href="/" className="font-semibold">
          {siteConfig.name}
        </Link>
        <p className="text-xs text-muted-foreground">Admin</p>
        <nav className="mt-4 flex gap-4 text-sm md:flex-col md:gap-2">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="hover:underline">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
