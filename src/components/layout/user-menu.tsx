import Link from "next/link";
import { getCurrentUser, signOut } from "@/lib/auth";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return <Link href="/sign-in">Sign in</Link>;

  return (
    <>
      {user.role === "ADMIN" && <Link href="/admin">Admin</Link>}
      <Link href="/account/orders">My Orders</Link>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" className="text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </form>
    </>
  );
}
