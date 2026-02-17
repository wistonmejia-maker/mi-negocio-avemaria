// Mi Negocio AVEMARÍA — Purchase Routes (Compras a AVEMARÍA)

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

const router = Router();
router.use(authMiddleware);

// ── Schemas ──
const purchaseItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive('La cantidad debe ser positiva'),
    unitCost: z.number().positive('El costo unitario debe ser positivo'),
});

const createPurchaseSchema = z.object({
    orderNumber: z.string().optional(),
    items: z.array(purchaseItemSchema).min(1, 'Debe incluir al menos un producto'),
    shippingCost: z.number().min(0).default(0),
    paymentMethod: z.enum(['TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'EFECTIVO']),
    notes: z.string().optional(),
});

// GET /api/purchases — lista paginada
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { userId: req.user!.id };

        if (req.query.startDate || req.query.endDate) {
            where.purchasedAt = {
                ...(req.query.startDate ? { gte: new Date(String(req.query.startDate)) } : {}),
                ...(req.query.endDate ? { lte: new Date(String(req.query.endDate)) } : {}),
            };
        }

        const [purchases, total] = await Promise.all([
            prisma.purchase.findMany({
                where: where as any,
                include: { items: { include: { product: true } } },
                orderBy: { purchasedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.purchase.count({ where: where as any }),
        ]);

        sendSuccess(res, { data: purchases, meta: { total, page, limit } });
    } catch (error) {
        next(error);
    }
});

// GET /api/purchases/summary
router.get('/summary', async (req, res, next) => {
    try {
        const purchases = await prisma.purchase.findMany({
            where: { userId: req.user!.id },
            include: { items: true },
        });

        const totalInvested = purchases.reduce((sum, p) => sum + Number(p.totalCost), 0);
        const totalUnits = purchases.reduce(
            (sum, p) => sum + p.items.reduce((s, i) => s + i.quantity, 0),
            0,
        );
        const lastPurchaseDate = purchases.length > 0
            ? purchases.sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())[0].purchasedAt
            : null;

        sendSuccess(res, { data: { totalInvested, totalUnits, lastPurchaseDate } });
    } catch (error) {
        next(error);
    }
});

// POST /api/purchases — REGLA 2: transacción atómica
router.post('/', validateBody(createPurchaseSchema), async (req, res, next) => {
    try {
        const { items, shippingCost, paymentMethod, orderNumber, notes } = req.body;
        const userId = req.user!.id;

        // Calcular total
        const itemsCost = items.reduce(
            (sum: number, item: { quantity: number; unitCost: number }) => sum + item.quantity * item.unitCost,
            0,
        );
        const totalCost = itemsCost + shippingCost;

        // REGLA 2: Transacción atómica — sumar stock + crear purchase + crear transaction
        const purchase = await prisma.$transaction(async (tx) => {
            // Sumar stock a cada producto
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }

            // Crear compra con items
            const newPurchase = await tx.purchase.create({
                data: {
                    orderNumber,
                    userId,
                    shippingCost,
                    totalCost,
                    paymentMethod,
                    notes,
                    items: {
                        create: items.map((item: { productId: string; quantity: number; unitCost: number }) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitCost: item.unitCost,
                        })),
                    },
                },
                include: { items: { include: { product: true } } },
            });

            // Crear Transaction EXPENSE automática
            await tx.transaction.create({
                data: {
                    type: 'EXPENSE',
                    amount: totalCost,
                    category: 'COMPRA_AVEMARIA',
                    description: `Compra a AVEMARÍA${orderNumber ? ` — Pedido ${orderNumber}` : ''}`,
                    userId,
                    purchaseId: newPurchase.id,
                },
            });

            return newPurchase;
        });

        sendCreated(res, purchase);
    } catch (error) {
        next(error);
    }
});

// GET /api/purchases/:id
router.get('/:id', async (req, res, next) => {
    try {
        const purchase = await prisma.purchase.findUnique({
            where: { id: req.params.id },
            include: { items: { include: { product: true } }, transaction: true },
        });
        if (!purchase) {
            throw new NotFoundError('Compra no encontrada');
        }
        sendSuccess(res, { data: purchase });
    } catch (error) {
        next(error);
    }
});

export default router;
