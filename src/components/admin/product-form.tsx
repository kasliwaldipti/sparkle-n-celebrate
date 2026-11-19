"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProduct } from "@/app/admin/products/actions";
import { rupeesToPaise } from "@/lib/money";
import { slugify } from "@/lib/validators/product";

interface SignedUpload {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

/** Signed upload: our server signs, the browser uploads straight to Cloudinary. */
async function uploadToCloudinary(file: File): Promise<string> {
  const sign = (await (await fetch("/api/cloudinary/sign", { method: "POST" })).json()) as SignedUpload;
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sign.apiKey);
  body.append("timestamp", String(sign.timestamp));
  body.append("signature", sign.signature);
  body.append("folder", sign.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body });
  if (!res.ok) throw new Error("Image upload failed");
  return ((await res.json()) as { public_id: string }).public_id;
}

export function ProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
        const publicIds = await Promise.all(files.map(uploadToCloudinary));
        const result = await createProduct({
          name,
          slug,
          description: String(formData.get("description") ?? ""),
          // The admin types rupees; we store integer paise.
          pricePaise: rupeesToPaise(Number(formData.get("price"))),
          images: publicIds.map((publicId) => ({ publicId, alt: name })),
        });
        if (!result.ok) return setError(result.error);
        router.push("/admin/products");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          required
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="slug">Slug (web address)</Label>
        <Input
          id="slug"
          value={slug}
          required
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
        <p className="text-xs text-muted-foreground">/products/{slug || "…"}</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="price">Price (₹)</Label>
        <Input id="price" name="price" type="number" min="0" step="0.01" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={5} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="images">Photos</Label>
        <Input id="images" name="images" type="file" accept="image/*" multiple />
      </div>
      {/* TODO: category picker, variants/SKUs and stock */}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save product"}
      </Button>
    </form>
  );
}
