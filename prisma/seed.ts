import { config } from "dotenv";

// `neon env pull` writes .env.local; .env still works as a fallback.
config({ path: [".env.local", ".env"], quiet: true });
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL }),
});

const categories = [
  { name: "Earrings", slug: "earrings" },
  { name: "Necklaces", slug: "necklaces" },
  { name: "Bangles", slug: "bangles" },
];

// Prices in integer paise (₹1,499.00 = 149900). Image IDs are placeholders: upload real photos from /admin.
const products = [
  { name: "Rose Gold Heart Pendant", slug: "rose-gold-heart-pendant", category: "necklaces", pricePaise: 149900, stock: 12 },
  { name: "Kundan Jhumka Earrings", slug: "kundan-jhumka-earrings", category: "earrings", pricePaise: 89900, stock: 20 },
  { name: "Pearl Drop Earrings", slug: "pearl-drop-earrings", category: "earrings", pricePaise: 64900, stock: 3 },
  { name: "Layered Choker Necklace", slug: "layered-choker-necklace", category: "necklaces", pricePaise: 219900, stock: 8 },
  { name: "Oxidised Silver Bangle Set", slug: "oxidised-silver-bangle-set", category: "bangles", pricePaise: 119900, stock: 15 },
  { name: "Meenakari Kada", slug: "meenakari-kada", category: "bangles", pricePaise: 99900, stock: 0 },
];

async function upsertUser(email: string | undefined, password: string | undefined, role: "ADMIN" | "CUSTOMER", name: string) {
  if (!email || !password) {
    console.warn(`Skipping ${role} user: set SEED_${role}_EMAIL and SEED_${role}_PASSWORD to create one.`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.upsert({
    where: { email },
    update: { role, passwordHash },
    create: { email, name, role, passwordHash },
  });
  console.log(`Seeded ${role} user ${email}`);
}

async function main() {
  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  for (const p of products) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: p.category } });
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: `${p.name}. Sample product: replace this description from the admin.`,
        pricePaise: p.pricePaise,
        categoryId: category.id,
        inventory: { create: { sku: p.slug.toUpperCase(), quantity: p.stock } },
      },
    });
  }
  console.log(`Seeded ${categories.length} categories and ${products.length} products`);

  await upsertUser(process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD, "ADMIN", "Store Admin");
  await upsertUser(process.env.SEED_CUSTOMER_EMAIL, process.env.SEED_CUSTOMER_PASSWORD, "CUSTOMER", "Test Customer");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
