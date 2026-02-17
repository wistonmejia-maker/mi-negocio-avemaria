// Mi Negocio AVEMARÍA — Dashboard Routes (KPIs consolidados)

import { Router } from 'express';
import prisma from '../../lib/prisma.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { sendSuccess } from '../../lib/response.js';
import { startOfMonth, subMonths, format } from 'date-fns';

const router = Router();
router.use(authMiddleware);

// GET /api/dashboard — KPIs consolidados del mes actual
router.get('/', async (req, res, next) => {
    try {
        const now = new Date();
        const userId = req.user!.id;
        const monthStart = startOfMonth(now);

        // Ventas del mes
        const monthlySales = await prisma.sale.findMany({
            where: {
                userId,
                status: 'COMPLETED',
                soldAt: { gte: monthStart },
            },
            include: { items: { include: { product: true } }, customer: true },
        });

        const totalRevenue = monthlySales.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
        const totalProfit = monthlySales.reduce((sum, s) => sum + Number(s.netProfit), 0);
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        // Compras del mes a AVEMARÍA
        const monthlyPurchases = await prisma.purchase.findMany({
            where: { userId, purchasedAt: { gte: monthStart } },
        });
        const totalPaidToAvemaria = monthlyPurchases.reduce((sum, p) => sum + Number(p.totalCost), 0);

        // Unidades vendidas del mes
        const unitsSold = monthlySales.reduce(
            (sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0),
            0,
        );

        // Productos con stock bajo
        const allProducts = await prisma.product.findMany({ where: { isActive: true } });
        const lowStockProducts = allProducts
            .filter((p) => p.stock <= p.minStock)
            .map((p) => ({ id: p.id, ref: p.ref, name: p.name, icon: p.icon, stock: p.stock, minStock: p.minStock }));

        // Ingresos por canal
        const revenueByChannel = {
            whatsapp: monthlySales.filter((s) => s.channel === 'WHATSAPP').reduce((sum, s) => sum + Number(s.totalRevenue), 0),
            instagram: monthlySales.filter((s) => s.channel === 'INSTAGRAM').reduce((sum, s) => sum + Number(s.totalRevenue), 0),
            presencial: monthlySales.filter((s) => s.channel === 'PRESENCIAL').reduce((sum, s) => sum + Number(s.totalRevenue), 0),
        };

        // Top 5 productos por ganancia
        const productProfitMap = new Map<string, { product: any; totalProfit: number; totalQuantity: number }>();
        for (const sale of monthlySales) {
            for (const item of sale.items) {
                const existing = productProfitMap.get(item.productId);
                const itemProfit = Number(item.unitProfit) * item.quantity;
                if (existing) {
                    existing.totalProfit += itemProfit;
                    existing.totalQuantity += item.quantity;
                } else {
                    productProfitMap.set(item.productId, {
                        product: { id: item.product.id, ref: item.product.ref, name: item.product.name, icon: item.product.icon },
                        totalProfit: itemProfit,
                        totalQuantity: item.quantity,
                    });
                }
            }
        }
        const topProducts = Array.from(productProfitMap.values())
            .sort((a, b) => b.totalProfit - a.totalProfit)
            .slice(0, 5);

        // Últimas 8 actividades (ventas y compras)
        const recentSales = await prisma.sale.findMany({
            where: { userId },
            include: { customer: true },
            orderBy: { soldAt: 'desc' },
            take: 8,
        });
        const recentPurchases = await prisma.purchase.findMany({
            where: { userId },
            orderBy: { purchasedAt: 'desc' },
            take: 4,
        });

        const recentActivity = [
            ...recentSales.map((s) => ({
                type: 'sale' as const,
                id: s.id,
                date: s.soldAt,
                description: `Venta #${s.folio}${s.customer ? ` — ${s.customer.name}` : ''}`,
                amount: Number(s.totalRevenue),
                channel: s.channel,
            })),
            ...recentPurchases.map((p) => ({
                type: 'purchase' as const,
                id: p.id,
                date: p.purchasedAt,
                description: `Compra AVEMARÍA${p.orderNumber ? ` ${p.orderNumber}` : ''}`,
                amount: Number(p.totalCost),
                channel: null,
            })),
        ]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 8);

        // Últimos 6 meses para gráficas
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const mStart = startOfMonth(subMonths(now, i));
            const mEnd = startOfMonth(subMonths(now, i - 1));

            const mSales = await prisma.sale.findMany({
                where: { userId, status: 'COMPLETED', soldAt: { gte: mStart, lt: mEnd } },
            });

            monthlyData.push({
                month: format(mStart, 'yyyy-MM'),
                label: format(mStart, 'MMM'),
                revenue: mSales.reduce((sum, s) => sum + Number(s.totalRevenue), 0),
                profit: mSales.reduce((sum, s) => sum + Number(s.netProfit), 0),
            });
        }

        sendSuccess(res, {
            data: {
                totalRevenue,
                totalProfit,
                profitMargin: Math.round(profitMargin * 100) / 100,
                totalPaidToAvemaria,
                unitsSold,
                lowStockProducts,
                revenueByChannel,
                topProducts,
                recentActivity,
                monthlyRevenue: monthlyData.map((m) => ({ month: m.month, label: m.label, value: m.revenue })),
                monthlyProfit: monthlyData.map((m) => ({ month: m.month, label: m.label, value: m.profit })),
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
