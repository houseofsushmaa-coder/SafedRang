import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Seeding Safed Rang database...');
    // ── Super Admin ──────────────────────────────────
    const passwordHash = await bcrypt.hash('Admin@123!', 12);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@safedrang.com' },
        update: {},
        create: {
            name: 'Safed Rang Admin',
            email: 'admin@safedrang.com',
            passwordHash,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
        },
    });
    console.log(`✅ Admin user: ${superAdmin.email}`);
    // ── Categories ───────────────────────────────────
    const sarees = await prisma.category.upsert({
        where: { slug: 'sarees' },
        update: {},
        create: {
            name: 'Sarees',
            slug: 'sarees',
            description: 'Handcrafted Lucknowi Chikankari Sarees',
            status: 'ACTIVE',
            sortOrder: 1,
        },
    });
    const kurtaSets = await prisma.category.upsert({
        where: { slug: 'kurta-sets' },
        update: {},
        create: {
            name: 'Kurta Sets',
            slug: 'kurta-sets',
            description: 'Elegant Chikankari Kurta Sets',
            status: 'ACTIVE',
            sortOrder: 2,
        },
    });
    const blouses = await prisma.category.upsert({
        where: { slug: 'blouses' },
        update: {},
        create: {
            name: 'Blouses',
            slug: 'blouses',
            description: 'Premium Chanderi Silk Blouses',
            status: 'ACTIVE',
            sortOrder: 3,
        },
    });
    console.log('✅ Categories seeded');
    // ── Sample Products ──────────────────────────────
    const products = [
        {
            name: '"Surkh-lal" Chanderi Chikankari Saree',
            slug: 'surkh-lal-chanderi-chikankari-saree',
            sku: 'TFS110061',
            price: 7499,
            stock: 5,
            categoryId: sarees.id,
            featured: true,
            bestseller: false,
            newArrival: false,
            fabric: 'Chanderi Silk',
            craft: 'Lucknowi Chikankari',
            status: 'PUBLISHED',
            description: 'An exquisite crimson red handloom saree featuring intricate all-over Chikankari embroidery.',
            images: ['https://safedrang.com/wp-content/uploads/2025/09/surkh-lal-1-450x572.jpeg'],
        },
        {
            name: '"Neelkamal" Mul Chanderi Chikankari Saree',
            slug: 'neelkamal-mul-chanderi-chikankari-saree',
            sku: 'TFS110063',
            price: 10599,
            stock: 3,
            categoryId: sarees.id,
            featured: false,
            bestseller: true,
            newArrival: false,
            fabric: 'Mul Chanderi',
            craft: 'Lucknowi Chikankari',
            status: 'PUBLISHED',
            description: 'The Neelkamal saree is a breath of fresh air, featuring deep blue hues.',
            images: ['https://safedrang.com/wp-content/uploads/2025/08/NEEL-KAMAL-1-450x572.jpeg'],
        },
        {
            name: 'Bright Yellow Mul Chanderi Chikankari Kurta Set',
            slug: 'bright-yellow-mul-chanderi-chikankari-kurta-set',
            sku: 'TFS110066',
            price: 6999,
            salePrice: 4999,
            stock: 8,
            categoryId: kurtaSets.id,
            featured: false,
            bestseller: false,
            newArrival: true,
            fabric: 'Mul Chanderi',
            craft: 'Lucknowi Chikankari',
            status: 'PUBLISHED',
            description: 'A vibrant yellow kurta set perfect for haldi ceremonies or bright summer days.',
            images: ['https://safedrang.com/wp-content/uploads/2025/08/Yellow-Kurta-1-450x572.jpeg'],
        },
    ];
    for (const productData of products) {
        const { images, salePrice, ...rest } = productData;
        const existing = await prisma.product.findUnique({ where: { sku: rest.sku } });
        if (!existing) {
            await prisma.product.create({
                data: {
                    ...rest,
                    salePrice: salePrice ?? null,
                    taxRate: 5,
                    images: {
                        create: images.map((url, i) => ({ url, altText: rest.name, sortOrder: i })),
                    },
                },
            });
            console.log(`✅ Product: ${rest.name}`);
        }
    }
    // ── Sample Coupon ────────────────────────────────
    await prisma.coupon.upsert({
        where: { code: 'WELCOME10' },
        update: {},
        create: {
            code: 'WELCOME10',
            type: 'PERCENTAGE',
            value: 10,
            minimumOrderAmount: 2000,
            maximumDiscount: 500,
            firstOrderOnly: true,
            status: true,
        },
    });
    console.log('✅ Coupon WELCOME10 created');
    // ── Settings ─────────────────────────────────────
    const settings = [
        { key: 'site_name', value: { text: 'Safed Rang' }, group: 'general' },
        { key: 'currency', value: { code: 'INR', symbol: '₹' }, group: 'general' },
        { key: 'tax_rate', value: { gst: 5 }, group: 'tax' },
        { key: 'free_shipping_threshold', value: { amount: 999 }, group: 'shipping' },
        { key: 'cod_charge', value: { amount: 50 }, group: 'shipping' },
        { key: 'cod_enabled', value: { enabled: true }, group: 'shipping' },
    ];
    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
    }
    console.log('✅ Settings seeded');
    console.log('\n🎉 Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin login: admin@safedrang.com');
    console.log('Password:    Admin@123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
