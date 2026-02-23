// Mi Negocio AVEMARÍA — Seed Script
// Crea datos de prueba: 1 usuario, 8 productos, 6 clientas, 2 compras, 30 ventas, 8 gastos

import { PrismaClient, Category, SaleChannel, SalePayment, PurchasePayment, TransactionType, ExpenseCategory, SaleStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, subMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Sembrando datos de prueba...');

    // ── Seguridad: No borrar datos si no se especifica explícitamente ──
    const forceSeed = process.env.FORCE_SEED === 'true';
    const existingUsers = await prisma.user.count();

    if (existingUsers > 0 && !forceSeed) {
        console.log('⚠️ La base de datos ya tiene datos. Saltando el seed por seguridad.');
        console.log('💡 Para forzar el seed y borrarlo todo, usa: FORCE_SEED=true npm run prisma:seed');
        return;
    }

    if (forceSeed) {
        console.log('🧨 FORCE_SEED detectado. Borrando datos existentes...');
        // ── Limpiar datos existentes (Solo si se fuerza) ──
        await prisma.transaction.deleteMany();
        await prisma.saleItem.deleteMany();
        await prisma.sale.deleteMany();
        await prisma.purchaseItem.deleteMany();
        await prisma.purchase.deleteMany();
        await prisma.customer.deleteMany();
        await prisma.product.deleteMany();
        await prisma.user.deleteMany();
    }

    // ── 1. Usuario ──
    const passwordHash = await bcrypt.hash('Avemaria123!', 12);
    const user = await prisma.user.create({
        data: {
            email: 'yo@minegocio.com',
            passwordHash,
            name: 'Mi Nombre',
            businessName: 'Mi Negocio AVEMARÍA',
        },
    });
    console.log(`✅ Usuario creado: ${user.email}`);

    // ── 2. Productos (8 referencias reales de AVEMARÍA) ──
    const productsData = [
        { ref: 'AVM-0042', name: 'Candongas Luna y Sol', category: Category.CANDONGAS, wholesalePrice: 63992, retailPrice: 90000, stock: 32, minStock: 10, icon: '💛' },
        { ref: 'AVM-0039', name: 'Aretes X3 Cadena Estrella', category: Category.GRANDES, wholesalePrice: 47992, retailPrice: 65000, stock: 24, minStock: 10, icon: '⭐' },
        { ref: 'AVM-0051', name: 'Aretes Sol Perla', category: Category.CANDONGAS, wholesalePrice: 55992, retailPrice: 80000, stock: 6, minStock: 10, icon: '🌸' },
        { ref: 'AVM-0033', name: 'Set X2 Earcuff Sencillo', category: Category.EARCUFFS, wholesalePrice: 19992, retailPrice: 30000, stock: 48, minStock: 10, icon: '🌙' },
        { ref: 'AVM-0058', name: 'Aretes Maxi Duo Sol', category: Category.GRANDES, wholesalePrice: 55900, retailPrice: 80000, stock: 4, minStock: 10, icon: '✨' },
        { ref: 'AVM-0061', name: 'Arete 2 en 1 Perla Amorfa', category: Category.TOPOS, wholesalePrice: 55992, retailPrice: 80000, stock: 18, minStock: 10, icon: '🤍' },
        { ref: 'AVM-0047', name: 'Aretes 3 en 1 Cristal', category: Category.SETS, wholesalePrice: 35900, retailPrice: 50000, stock: 30, minStock: 10, icon: '💎' },
        { ref: 'AVM-0054', name: 'Aretes Maxi Duo Sol II', category: Category.GRANDES, wholesalePrice: 55900, retailPrice: 80000, stock: 12, minStock: 10, icon: '🌟' },
    ];

    const products = await Promise.all(
        productsData.map((p) =>
            prisma.product.create({ data: p }),
        ),
    );
    console.log(`✅ ${products.length} productos creados`);

    // ── 3. Clientas (6) ──
    const customersData = [
        { name: 'Laura Gómez', phone: '3001234567', instagram: '@laurag' },
        { name: 'Sofía Reyes', phone: '3019876543', instagram: '@sofiareyes' },
        { name: 'Camila Torres', phone: '3025554444', instagram: '@camilat' },
        { name: 'Valentina Cruz', phone: '3033332222', instagram: '@valecruz' },
        { name: 'Ana Beltrán', phone: '3041111000', instagram: '@anabelt' },
        { name: 'Mariana López', phone: '3059998877', instagram: '@marial' },
    ];

    const customers = await Promise.all(
        customersData.map((c) =>
            prisma.customer.create({ data: c }),
        ),
    );
    console.log(`✅ ${customers.length} clientas creadas`);

    // ── 4. Compras a AVEMARÍA (2 compras en los últimos 2 meses) ──
    const now = new Date();

    // Compra 1 — hace 2 meses
    const purchase1Date = subMonths(now, 2);
    const purchase1Items = [
        { product: products[0], quantity: 20, unitCost: 63992 },
        { product: products[1], quantity: 15, unitCost: 47992 },
        { product: products[3], quantity: 30, unitCost: 19992 },
        { product: products[6], quantity: 20, unitCost: 35900 },
    ];
    const purchase1Total = purchase1Items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0) + 25000; // + envío

    const purchase1 = await prisma.purchase.create({
        data: {
            orderNumber: 'PED-AVEM-2024-001',
            userId: user.id,
            shippingCost: 25000,
            totalCost: purchase1Total,
            paymentMethod: PurchasePayment.TRANSFERENCIA,
            notes: 'Primer pedido del mes — reposición de stock',
            purchasedAt: purchase1Date,
            items: {
                create: purchase1Items.map((i) => ({
                    productId: i.product.id,
                    quantity: i.quantity,
                    unitCost: i.unitCost,
                })),
            },
        },
    });

    // Transaction EXPENSE para compra 1
    await prisma.transaction.create({
        data: {
            type: TransactionType.EXPENSE,
            amount: purchase1Total,
            category: ExpenseCategory.COMPRA_AVEMARIA,
            description: `Compra a AVEMARÍA — Pedido ${purchase1.orderNumber}`,
            userId: user.id,
            purchaseId: purchase1.id,
            date: purchase1Date,
        },
    });

    // Compra 2 — hace 3 semanas
    const purchase2Date = subDays(now, 21);
    const purchase2Items = [
        { product: products[2], quantity: 10, unitCost: 55992 },
        { product: products[4], quantity: 8, unitCost: 55900 },
        { product: products[5], quantity: 12, unitCost: 55992 },
        { product: products[7], quantity: 10, unitCost: 55900 },
    ];
    const purchase2Total = purchase2Items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0) + 18000;

    const purchase2 = await prisma.purchase.create({
        data: {
            orderNumber: 'PED-AVEM-2024-002',
            userId: user.id,
            shippingCost: 18000,
            totalCost: purchase2Total,
            paymentMethod: PurchasePayment.NEQUI,
            notes: 'Segundo pedido — nuevas referencias',
            purchasedAt: purchase2Date,
            items: {
                create: purchase2Items.map((i) => ({
                    productId: i.product.id,
                    quantity: i.quantity,
                    unitCost: i.unitCost,
                })),
            },
        },
    });

    await prisma.transaction.create({
        data: {
            type: TransactionType.EXPENSE,
            amount: purchase2Total,
            category: ExpenseCategory.COMPRA_AVEMARIA,
            description: `Compra a AVEMARÍA — Pedido ${purchase2.orderNumber}`,
            userId: user.id,
            purchaseId: purchase2.id,
            date: purchase2Date,
        },
    });
    console.log('✅ 2 compras a AVEMARÍA creadas');

    // ── 5. Ventas (30 ventas distribuidas en los últimos 2 meses) ──
    // ── 5. Ventas (30 ventas distribuidas en los últimos 2 meses) ──

    const salesData: Array<{
        daysAgo: number;
        customerIdx: number;
        channel: SaleChannel;
        payment: SalePayment;
        items: Array<{ productIdx: number; quantity: number }>;
    }> = [
            // Mes actual (últimos 30 días) — 18 ventas
            { daysAgo: 1, customerIdx: 0, channel: SaleChannel.WHATSAPP, payment: SalePayment.NEQUI, items: [{ productIdx: 0, quantity: 2 }, { productIdx: 3, quantity: 3 }] },
            { daysAgo: 2, customerIdx: 1, channel: SaleChannel.INSTAGRAM, payment: SalePayment.DAVIPLATA, items: [{ productIdx: 1, quantity: 1 }, { productIdx: 6, quantity: 2 }] },
            { daysAgo: 3, customerIdx: 2, channel: SaleChannel.WHATSAPP, payment: SalePayment.TRANSFERENCIA, items: [{ productIdx: 5, quantity: 2 }] },
            { daysAgo: 4, customerIdx: 3, channel: SaleChannel.INSTAGRAM, payment: SalePayment.NEQUI, items: [{ productIdx: 0, quantity: 1 }, { productIdx: 2, quantity: 1 }] },
            { daysAgo: 5, customerIdx: 4, channel: SaleChannel.PRESENCIAL, payment: SalePayment.EFECTIVO, items: [{ productIdx: 3, quantity: 5 }, { productIdx: 6, quantity: 1 }] },
            { daysAgo: 6, customerIdx: 5, channel: SaleChannel.WHATSAPP, payment: SalePayment.NEQUI, items: [{ productIdx: 7, quantity: 2 }] },
            { daysAgo: 8, customerIdx: 0, channel: SaleChannel.INSTAGRAM, payment: SalePayment.DAVIPLATA, items: [{ productIdx: 4, quantity: 1 }, { productIdx: 1, quantity: 2 }] },
            { daysAgo: 9, customerIdx: 1, channel: SaleChannel.WHATSAPP, payment: SalePayment.NEQUI, items: [{ productIdx: 2, quantity: 2 }, { productIdx: 5, quantity: 1 }] },
            { daysAgo: 11, customerIdx: 2, channel: SaleChannel.INSTAGRAM, payment: SalePayment.TRANSFERENCIA, items: [{ productIdx: 0, quantity: 3 }] },
            { daysAgo: 13, customerIdx: 3, channel: SaleChannel.WHATSAPP, payment: SalePayment.CONTRA_ENTREGA, items: [{ productIdx: 6, quantity: 3 }, { productIdx: 3, quantity: 2 }] },
            { daysAgo: 15, customerIdx: 4, channel: SaleChannel.PRESENCIAL, payment: SalePayment.EFECTIVO, items: [{ productIdx: 1, quantity: 1 }] },
            { daysAgo: 17, customerIdx: 5, channel: SaleChannel.WHATSAPP, payment: SalePayment.NEQUI, items: [{ productIdx: 7, quantity: 1 }, { productIdx: 0, quantity: 1 }] },
            { daysAgo: 19, customerIdx: 0, channel: SaleChannel.INSTAGRAM, payment: SalePayment.DAVIPLATA, items: [{ productIdx: 5, quantity: 3 }] },
            { daysAgo: 21, customerIdx: 1, channel: SaleChannel.WHATSAPP, payment: SalePayment.NEQUI, items: [{ productIdx: 3, quantity: 4 }] },
            { daysAgo: 23, customerIdx: 2, channel: SaleChannel.INSTAGRAM, payment: SalePayment.TRANSFERENCIA, items: [{ productIdx: 4, quantity: 2 }] },
            { daysAgo: 25, customerIdx: 3, channel: SaleChannel.WHATSAPP, payment: SalePayment.NEQUI, items: [{ productIdx: 2, quantity: 1 }, { productIdx: 6, quantity: 2 }] },
            { daysAgo: 27, customerIdx: 4, channel: SaleChannel.PRESENCIAL, payment: SalePayment.EFECTIVO, items: [{ productIdx: 0, quantity: 2 }, { productIdx: 1, quantity: 1 }] },
            { daysAgo: 29, customerIdx: 5, channel: SaleChannel.INSTAGRAM, payment: SalePayment.DAVIPLATA, items: [{ productIdx: 7, quantity: 3 }] },
            // Mes anterior (30-60 días atrás) — 12 ventas
            { daysAgo: 32, customerIdx: 0, channel: SaleChannel.WHATSAPP, payment: SalePayment.NEQUI, items: [{ productIdx: 0, quantity: 1 }, { productIdx: 6, quantity: 1 }] },
            { daysAgo: 35, customerIdx: 1, channel: SaleChannel.INSTAGRAM, payment: SalePayment.DAVIPLATA, items: [{ productIdx: 3, quantity: 3 }] },
            { daysAgo: 37, customerIdx: 2, channel: SaleChannel.WHATSAPP, payment: SalePayment.TRANSFERENCIA, items: [{ productIdx: 1, quantity: 2 }, { productIdx: 5, quantity: 1 }] },
            { daysAgo: 40, customerIdx: 3, channel: SaleChannel.INSTAGRAM, payment: SalePayment.NEQUI, items: [{ productIdx: 2, quantity: 2 }] },
            { daysAgo: 42, customerIdx: 4, channel: SaleChannel.PRESENCIAL, payment: SalePayment.EFECTIVO, items: [{ productIdx: 7, quantity: 1 }, { productIdx: 4, quantity: 1 }] },
            { daysAgo: 44, customerIdx: 5, channel: SaleChannel.WHATSAPP, payment: SalePayment.NEQUI, items: [{ productIdx: 0, quantity: 2 }] },
            { daysAgo: 47, customerIdx: 0, channel: SaleChannel.INSTAGRAM, payment: SalePayment.TRANSFERENCIA, items: [{ productIdx: 6, quantity: 4 }] },
            { daysAgo: 49, customerIdx: 1, channel: SaleChannel.WHATSAPP, payment: SalePayment.DAVIPLATA, items: [{ productIdx: 3, quantity: 2 }, { productIdx: 1, quantity: 1 }] },
            { daysAgo: 51, customerIdx: 2, channel: SaleChannel.INSTAGRAM, payment: SalePayment.NEQUI, items: [{ productIdx: 5, quantity: 2 }] },
            { daysAgo: 53, customerIdx: 3, channel: SaleChannel.WHATSAPP, payment: SalePayment.EFECTIVO, items: [{ productIdx: 4, quantity: 1 }] },
            { daysAgo: 56, customerIdx: 4, channel: SaleChannel.PRESENCIAL, payment: SalePayment.NEQUI, items: [{ productIdx: 2, quantity: 1 }, { productIdx: 0, quantity: 1 }] },
            { daysAgo: 58, customerIdx: 5, channel: SaleChannel.INSTAGRAM, payment: SalePayment.DAVIPLATA, items: [{ productIdx: 7, quantity: 2 }, { productIdx: 6, quantity: 1 }] },
        ];

    let salesCreated = 0;
    for (const saleData of salesData) {
        const saleDate = subDays(now, saleData.daysAgo);
        const customer = customers[saleData.customerIdx];

        // Calcular totales
        const saleItems = saleData.items.map((item) => {
            const product = products[item.productIdx];
            const unitRevenue = Number(product.retailPrice);
            const unitCost = Number(product.wholesalePrice);
            const unitProfit = unitRevenue - unitCost;
            return {
                productId: product.id,
                quantity: item.quantity,
                unitRevenue,
                unitCost,
                unitProfit,
            };
        });

        const totalRevenue = saleItems.reduce((sum, i) => sum + i.unitRevenue * i.quantity, 0);
        const totalCost = saleItems.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
        const netProfit = totalRevenue - totalCost;

        const sale = await prisma.sale.create({
            data: {
                customerId: customer.id,
                userId: user.id,
                channel: saleData.channel,
                paymentMethod: saleData.payment,
                totalRevenue,
                totalCost,
                netProfit,
                status: SaleStatus.COMPLETED,
                soldAt: saleDate,
                items: {
                    create: saleItems,
                },
            },
        });

        // Transaction INCOME automática
        await prisma.transaction.create({
            data: {
                type: TransactionType.INCOME,
                amount: totalRevenue,
                category: ExpenseCategory.OTRO, // DECISIÓN: INCOME usa OTRO como categoría placeholder
                description: `Venta #${sale.folio} — ${customer.name} (${saleData.channel})`,
                userId: user.id,
                saleId: sale.id,
                date: saleDate,
            },
        });

        salesCreated++;
    }
    console.log(`✅ ${salesCreated} ventas creadas`);

    // ── 6. Gastos manuales (8 gastos variados) ──
    const expensesData = [
        { daysAgo: 3, category: ExpenseCategory.ENVIOS, amount: 12000, description: 'Envío Servientrega — Laura Gómez' },
        { daysAgo: 7, category: ExpenseCategory.EMPAQUES, amount: 35000, description: 'Bolsas y cajas de regalo x50' },
        { daysAgo: 12, category: ExpenseCategory.ENVIOS, amount: 15000, description: 'Envío Inter Rapidísimo — Valentina Cruz' },
        { daysAgo: 18, category: ExpenseCategory.PUBLICIDAD, amount: 50000, description: 'Pauta Instagram Stories — 1 semana' },
        { daysAgo: 25, category: ExpenseCategory.ENVIOS, amount: 12000, description: 'Envío Servientrega — Sofía Reyes' },
        { daysAgo: 33, category: ExpenseCategory.EMPAQUES, amount: 28000, description: 'Tissue paper dorado + stickers marca' },
        { daysAgo: 40, category: ExpenseCategory.PUBLICIDAD, amount: 80000, description: 'Pauta Instagram Reels — 2 semanas' },
        { daysAgo: 50, category: ExpenseCategory.ENVIOS, amount: 18000, description: 'Envío coordinadora — pedido múltiple' },
    ];

    for (const expense of expensesData) {
        await prisma.transaction.create({
            data: {
                type: TransactionType.EXPENSE,
                amount: expense.amount,
                category: expense.category,
                description: expense.description,
                userId: user.id,
                date: subDays(now, expense.daysAgo),
            },
        });
    }
    console.log('✅ 8 gastos manuales creados');

    // ── Resumen ──
    const totalProducts = await prisma.product.count();
    const totalCustomers = await prisma.customer.count();
    const totalSales = await prisma.sale.count();
    const totalPurchases = await prisma.purchase.count();
    const totalTransactions = await prisma.transaction.count();

    console.log('\n📊 Resumen del seed:');
    console.log(`   👤 Usuarios:      1`);
    console.log(`   📦 Productos:     ${totalProducts}`);
    console.log(`   👩 Clientas:      ${totalCustomers}`);
    console.log(`   🛒 Compras:       ${totalPurchases}`);
    console.log(`   💰 Ventas:        ${totalSales}`);
    console.log(`   📝 Transacciones: ${totalTransactions}`);
    console.log('\n🎉 Seed completado exitosamente!');
    console.log('   📧 Login: yo@minegocio.com / Avemaria123!');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
