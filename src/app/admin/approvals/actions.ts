"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const reviewSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(1000).optional(),
});

/**
 * Records an admin decision. Approving does NOT yet perform the refund, cancellation or address change.
 * TODO: on APPROVED, run the matching action (Razorpay refund, order cancel + restock, address update)
 * and notify the customer.
 */
export async function reviewApproval(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = reviewSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) throw new Error("Invalid review");

  await db.approvalRequest.update({
    where: { id: parsed.data.id, status: "PENDING" },
    data: {
      status: parsed.data.decision,
      reviewNote: parsed.data.note,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });
  revalidatePath("/admin/approvals");
}
