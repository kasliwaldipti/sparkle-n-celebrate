"use client";

import type { ImageLoaderProps } from "next/image";

// next/image loader: Cloudinary resizes and converts formats, so the server needs no sharp.
// `src` is a Cloudinary public ID (e.g. "products/ring-01"); absolute URLs pass through.
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps) {
  if (src.startsWith("http") || src.startsWith("/")) return src;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const params = ["f_auto", "c_limit", `w_${width}`, `q_${quality ?? "auto"}`].join(",");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${params}/${src}`;
}
