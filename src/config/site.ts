// Single source of truth for brand details. Never hard-code the brand name elsewhere.
export const siteConfig = {
  name: "Sparkle N' Celebrate",
  // TODO: replace with the real tagline.
  tagline: "Jewellery for every celebration",
  description: "Handpicked jewellery from Sparkle N' Celebrate, delivered across India.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // TODO: replace with real contact details.
  contact: {
    email: "hello@example.com",
    phone: "+91 00000 00000",
    whatsapp: "+91 00000 00000",
    address: "TODO: business address, India",
  },
  social: {
    instagram: "",
    facebook: "",
  },
  currency: "INR",
  locale: "en-IN",
} as const;

export type SiteConfig = typeof siteConfig;
