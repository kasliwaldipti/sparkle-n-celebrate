import { SiteHeader } from "@/components/layout/site-header";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">{children}</main>
    </>
  );
}
