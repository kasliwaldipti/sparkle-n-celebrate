import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { signProductUpload } from "@/lib/cloudinary";

// Returns a signed upload payload so the admin's browser can upload straight to Cloudinary.
export async function POST() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(signProductUpload());
}
