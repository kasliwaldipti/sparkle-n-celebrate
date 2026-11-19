import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// /account is protected by src/proxy.ts; pages also re-check the session.
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      <SiteFooter />
    </>
  );
}
