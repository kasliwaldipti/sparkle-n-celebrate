import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Next 16 "proxy" (formerly middleware). Runs on the Node runtime.
// This is a first gate only: pages, Server Actions and route handlers still check roles themselves.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (!user) {
    const url = new URL("/sign-in", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
