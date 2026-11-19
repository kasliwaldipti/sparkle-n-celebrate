import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { requireEnv } from "@/lib/env";

function configure() {
  cloudinary.config({
    cloud_name: requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
    api_key: requireEnv("CLOUDINARY_API_KEY"),
    api_secret: requireEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });
  return cloudinary;
}

export const PRODUCT_IMAGE_FOLDER = "products";

/**
 * Signs a direct browser-to-Cloudinary upload. Only call after an ADMIN role check.
 * The browser never sees the API secret.
 */
export function signProductUpload() {
  const c = configure();
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder: PRODUCT_IMAGE_FOLDER };
  const signature = c.utils.api_sign_request(paramsToSign, requireEnv("CLOUDINARY_API_SECRET"));
  return {
    ...paramsToSign,
    signature,
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
    cloudName: requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
  };
}

export async function deleteImage(publicId: string) {
  // TODO: call when a ProductImage row is deleted.
  return configure().uploader.destroy(publicId);
}
