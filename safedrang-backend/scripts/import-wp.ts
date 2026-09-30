import fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CSV_FILE_PATH = 'C:/Users/Talha Zia/.gemini/antigravity-ide/brain/4c58a8bd-ec93-43a9-8e7c-7fa2bbb15246/.user_uploaded/media_1790599338748.csv';

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

async function main() {
  console.log('🔄 Starting WordPress CSV Import...');
  const results: any[] = [];

  // Read CSV
  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`📦 Found ${results.length} rows in CSV.`);
      
      let imported = 0;
      let skipped = 0;

      for (const row of results) {
        // Skip variations or empty names
        if (!row.Name || row.Type !== 'simple') {
          skipped++;
          continue;
        }

        const name = row.Name.replace(/"/g, '').trim();
        const sku = row.SKU || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const baseSlug = slugify(name);
        
        // Handle Price
        const price = parseFloat(row['Regular price'] || row['Sale price'] || '0');
        const salePrice = row['Sale price'] ? parseFloat(row['Sale price']) : null;
        if (price === 0) {
          skipped++;
          continue; // Skip products without price
        }

        // Handle Category
        let categoryId = null;
        const catName = row.Categories ? row.Categories.split(',')[0].trim() : 'Uncategorized';
        if (catName) {
          const catSlug = slugify(catName);
          const category = await prisma.category.upsert({
            where: { slug: catSlug },
            update: {},
            create: { name: catName, slug: catSlug, description: catName, status: 'ACTIVE' }
          });
          categoryId = category.id;
        }

        // Handle Images
        const imageUrls = row.Images ? row.Images.split(',').map((u: string) => u.trim()).filter(Boolean) : [];

        // Check if product exists
        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
          skipped++;
          continue;
        }

        // Ensure unique slug
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.product.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Create Product
        await prisma.product.create({
          data: {
            name,
            slug,
            sku,
            price,
            salePrice,
            stock: parseInt(row.Stock || '10'),
            categoryId,
            status: row.Published === '1' ? 'PUBLISHED' : 'DRAFT',
            description: row.Description || row['Short description'] || '',
            images: {
              create: imageUrls.map((url: string, index: number) => ({
                url,
                altText: name,
                sortOrder: index
              }))
            }
          }
        });

        imported++;
        console.log(`✅ Imported: ${name}`);
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🎉 Import Complete!`);
      console.log(`✅ Successfully imported: ${imported}`);
      console.log(`⏭️ Skipped (variations/duplicates/no price): ${skipped}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      await prisma.$disconnect();
    });
}

main().catch(console.error);
