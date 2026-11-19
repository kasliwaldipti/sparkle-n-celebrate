import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cPanel/Passenger runs .next/standalone/server.js (PORT comes from process.env.PORT).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Images are optimised by Cloudinary, so keep sharp's native binaries out of the upload.
  outputFileTracingExcludes: {
    "*": ["node_modules/sharp/**", "node_modules/@img/**", "node_modules/@emnapi/**"],
  },
  images: {
    // Cloudinary resizes images, so no sharp is needed on the server.
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.ts",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
