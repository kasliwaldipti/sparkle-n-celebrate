"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { signInSchema } from "@/lib/validators/auth";

export async function signInAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return "Enter a valid email and password.";

  const callbackUrl = String(formData.get("callbackUrl") ?? "/account/orders");
  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/",
    });
    return null;
  } catch (e) {
    if (e instanceof AuthError) return "Incorrect email or password.";
    throw e; // Rethrow the redirect.
  }
}
