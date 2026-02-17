// Mi Negocio AVEMARÍA — Sales Routes (Ventas a clientas)

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { ConflictError, NotFoundError } from '../../middleware/errorHandler.js';

const router = Router();
router.use(authMiddleware);

// ── Schemas ──
const saleItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive('Cantidad debe ser positiva'),
    unitRevenue: z.number().positive('Precio de venta debe ser positivo'),
});

const createSaleSchema = z.object({
    customerId: z.string().uuid().optional(),
    channel: z.enum(['WHATSAPP', 'INSTAGRAM', 'PRESENCIAL']),
    paymentMethod: z.enum(['NEQUI', 'DAVIPLATA', 'TRANSFERENCIA', 'EFECTIVO', 'CONTRA_ENTREGA']),
    items: z.array(saleItemSchema).min(1, 'Debe incluir al menos un producto'),
    notes: z.string().optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(['COMPLETED', 'PENDING_PAYMENT', 'CANCELLED']),
});

// GET /api/sales — lista paginada
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { userId: req.user!.id };

        if (req.query.channel) where.channel = String(req.query.channel);
        if (req.query.customerId) where.customerId = String(req.query.customerId);
        if (req.query.startDate || req.query.endDate) {
            where.soldAt = {
                ...(req.query.startDate ? { gte: new Date(String(req.query.startDate)) } : {}),
                ...(req.query.endDate ? { lte: new Date(String(req.query.endDate)) } : {}),
            };
        }

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where: where as any,
                include: { items: { include: { product: true } }, customer: true },
                orderBy: { soldAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.sale.count({ where: where as any }),
        ]);

        sendSuccess(res, { data: sales, meta: { total, page, limit } });
    } catch (error) {
        next(error);
    }
});

// GET /api/sales/summary
router.get('/summary', async (req, res, next) => {
    try {
        const where: Record<string, unknown> = { userId: req.user!.id, status: 'COMPLETED' };
        if (req.query.startDate || req.query.endDate) {
            where.soldAt = {
                ...(req.query.startDate ? { gte: new Date(String(req.query.startDate)) } : {}),
                ...(req.query.endDate ? { lte: new Date(String(req.query.endDate)) } : {}),
            };
        }

        const sales = await prisma.sale.findMany({ where: where as any });

        const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
        const totalCost = sales.reduce((sum, s) => sum + Number(s.totalCost), 0);
        const netProfit = sales.reduce((sum, s) => sum + Number(s.netProfit), 0);
        const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        // Por canal
        const byChannel = {
            WHATSAPP: sales.filter((s) => s.channel === 'WHATSAPP').reduce((sum, s) => sum + Number(s.totalRevenue), 0),
            INSTAGRAM: sales.filter((s) => s.channel === 'INSTAGRAM').reduce((sum, s) => sum + Number(s.totalRevenue), 0),
            PRESENCIAL: sales.filter((s) => s.channel === 'PRESENCIAL').reduce((sum, s) => sum + Number(s.totalRevenue), 0),
        };

        sendSuccess(res, { data: { totalRevenue, totalCost, netProfit, margin, byChannel } });
    } catch (error) {
        next(error);
    }
});

// GET /api/sales/by-product — ranking de productos más vendidos
router.get('/by-product', async (req, res, next) => {
    try {
        const saleItems = await prisma.saleItem.findMany({
            where: { sale: { userId: req.user!.id, status: 'COMPLETED' } },
            include: { product: true },
        });

        const productMap = new Map<string, { product: any; totalQuantity: number; totalRevenue: number; totalProfit: number }>();

        for (const item of saleItems) {
            const existing = productMap.get(item.productId);
            if (existing) {
                existing.totalQuantity += item.quantity;
                existing.totalRevenue += Number(item.unitRevenue) * item.quantity;
                existing.totalProfit += Number(item.unitProfit) * item.quantity;
            } else {
                productMap.set(item.productId, {
                    product: item.product,
                    totalQuantity: item.quantity,
                    totalRevenue: Number(item.unitRevenue) * item.quantity,
                    totalProfit: Number(item.unitProfit) * item.quantity,
                });
            }
        }

        const ranked = Array.from(productMap.values()).sort((a, b) => b.totalProfit - a.totalProfit);
        sendSuccess(res, { data: ranked });
    } catch (error) {
        next(error);
    }
});

// POST /api/sales — REGLA 1: transacción atómica con verificación de stock
router.post('/', validateBody(createSaleSchema), async (req, res, next) => {
    try {
        const { customerId, channel, paymentMethod, items, notes } = req.body;
        const userId = req.user!.id;

        // REGLA 1a: Verificar stock ANTES de procesar
        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product || !product.isActive) {
                throw new NotFoundError(`Producto ${item.productId} no encontrado`);
            }
            if (product.stock < item.quantity) {
                throw new ConflictError(
                    `Stock insuficiente para "${product.name}" (${product.ref}): disponible ${product.stock}, solicitado ${item.quantity}`,
                );
            }
        }

        // REGLA 1b: Transacción atómica
        const sale = await prisma.$transaction(async (tx) => {
            // Preparar items con cálculo de ganancia
            const saleItemsData = [];
            let totalRevenue = 0;
            let totalCost = 0;

            for (const item of items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new NotFoundError(`Producto no encontrado`);

                const unitCost = Number(product.wholesalePrice);
                const unitRevenue = item.unitRevenue;
                const unitProfit = unitRevenue - unitCost;

                // Descontar stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });

                saleItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitRevenue,
                    unitCost,
                    unitProfit,
                });

                totalRevenue += unitRevenue * item.quantity;
                totalCost += unitCost * item.quantity;
            }

            // REGLA 3: netProfit = sum(item.quantity * item.unitProfit)
            const netProfit = totalRevenue - totalCost;

            // Crear venta con items
            const newSale = await tx.sale.create({
                data: {
                    customerId: customerId || null,
                    userId,
                    channel,
                    paymentMethod,
                    totalRevenue,
                    totalCost,
                    netProfit,
                    notes,
                    items: { create: saleItemsData },
                },
                include: { items: { include: { product: true } }, customer: true },
            });

            // Crear Transaction INCOME automática
            await tx.transaction.create({
                data: {
                    type: 'INCOME',
                    amount: totalRevenue,
                    category: 'OTRO',
                    description: `Venta #${newSale.folio}${newSale.customer ? ` — ${newSale.customer.name}` : ''} (${channel})`,
                    userId,
                    saleId: newSale.id,
                },
            });

            return newSale;
        });

        sendCreated(res, sale);
    } catch (error) {
        next(error);
    }
});

// GET /api/sales/:id
router.get('/:id', async (req, res, next) => {
    try {
        const sale = await prisma.sale.findUnique({
            where: { id: req.params.id },
            include: {
                items: { include: { product: true } },
                customer: true,
                transaction: true,
            },
        });
        if (!sale) throw new NotFoundError('Venta no encontrada');
        sendSuccess(res, { data: sale });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/sales/:id/status — REGLA 4: cancelar venta devuelve stock
router.patch('/:id/status', validateBody(updateStatusSchema), async (req, res, next) => {
    try {
        const { status } = req.body;
        const sale = await prisma.sale.findUnique({
            where: { id: req.params.id },
            include: { items: true, transaction: true },
        });

        if (!sale) throw new NotFoundError('Venta no encontrada');

        if (status === 'CANCELLED' && sale.status !== 'CANCELLED') {
            // REGLA 4: Devolver stock y revertir transacción
            await prisma.$transaction(async (tx) => {
                for (const item of sale.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }

                await tx.sale.update({
                    where: { id: sale.id },
                    data: { status: 'CANCELLED' },
                });

                if (sale.transaction) {
                    await tx.transaction.update({
                        where: { id: sale.transaction.id },
                        data: {
                            description: `[CANCELADA] ${sale.transaction.description}`,
                            amount: 0,
                        },
                    });
                }
            });
        } else {
            await prisma.sale.update({
                where: { id: sale.id },
                data: { status },
            });
        }

        const updated = await prisma.sale.findUnique({
            where: { id: req.params.id },
            include: { items: { include: { product: true } }, customer: true },
        });

        sendSuccess(res, { data: updated });
    } catch (error) {
        next(error);
    }
});

export default router;
