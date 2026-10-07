import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.product.count();
  console.log("Products in DB:", count);
  const cats = await prisma.category.findMany({ select: { id: true, slug: true } });
  console.log("Categories:", JSON.stringify(cats));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
