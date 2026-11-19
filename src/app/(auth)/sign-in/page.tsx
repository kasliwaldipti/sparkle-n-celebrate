import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sign in to {siteConfig.name}</h1>
      <Suspense>
        <SignInFormWithCallback searchParams={searchParams} />
      </Suspense>
      {/* TODO: registration page */}
    </div>
  );
}

async function SignInFormWithCallback({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { callbackUrl } = await searchParams;
  // Only allow same-site relative redirects.
  const safe = typeof callbackUrl === "string" && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
    ? callbackUrl
    : "/account/orders";
  return <SignInForm callbackUrl={safe} />;
}
