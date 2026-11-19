import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/** For admin pages: redirects anyone who isn't an ADMIN. (Server Actions use requireRole("ADMIN").) */
export async function requireAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?callbackUrl=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
