// Mi Negocio AVEMARÍA — Customer Routes (Mis Clientas)

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

const router = Router();
router.use(authMiddleware);

const createCustomerSchema = z.object({
    name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    phone: z.string().optional(),
    instagram: z.string().optional(),
    notes: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

// REGLA 5: Nivel de clienta (calculado dinámicamente)
function getCustomerLevel(totalSpent: number, totalPurchases: number) {
    if (totalSpent >= 2000000) return 'VIP';
    if (totalSpent >= 800000 || totalPurchases >= 8) return 'Frecuente';
    return 'Regular';
}

// GET /api/customers — lista con totales agregados
router.get('/', async (_req, res, next) => {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                sales: { where: { status: 'COMPLETED' }, select: { totalRevenue: true, soldAt: true } },
            },
            orderBy: { name: 'asc' },
        });

        const data = customers.map((c) => {
            const totalSpent = c.sales.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
            const totalPurchases = c.sales.length;
            const lastPurchase = c.sales.length > 0
                ? c.sales.sort((a, b) => b.soldAt.getTime() - a.soldAt.getTime())[0].soldAt
                : null;

            return {
                id: c.id,
                name: c.name,
                phone: c.phone,
                instagram: c.instagram,
                notes: c.notes,
                createdAt: c.createdAt,
                totalSpent,
                totalPurchases,
                lastPurchase,
                level: getCustomerLevel(totalSpent, totalPurchases),
            };
        });

        sendSuccess(res, { data, meta: { total: data.length } });
    } catch (error) {
        next(error);
    }
});

// POST /api/customers
router.post('/', validateBody(createCustomerSchema), async (req, res, next) => {
    try {
        const customer = await prisma.customer.create({ data: req.body });
        sendCreated(res, customer);
    } catch (error) {
        next(error);
    }
});

// GET /api/customers/:id — detalle con historial
router.get('/:id', async (req, res, next) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.params.id },
            include: {
                sales: {
                    include: { items: { include: { product: true } } },
                    orderBy: { soldAt: 'desc' },
                },
            },
        });
        if (!customer) throw new NotFoundError('Clienta no encontrada');

        const totalSpent = customer.sales
            .filter((s) => s.status === 'COMPLETED')
            .reduce((sum, s) => sum + Number(s.totalRevenue), 0);
        const totalPurchases = customer.sales.filter((s) => s.status === 'COMPLETED').length;

        sendSuccess(res, {
            data: {
                ...customer,
                totalSpent,
                totalPurchases,
                level: getCustomerLevel(totalSpent, totalPurchases),
            },
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/customers/:id
router.patch('/:id', validateBody(updateCustomerSchema), async (req, res, next) => {
    try {
        const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
        if (!existing) throw new NotFoundError('Clienta no encontrada');

        const customer = await prisma.customer.update({
            where: { id: req.params.id },
            data: req.body,
        });
        sendSuccess(res, { data: customer });
    } catch (error) {
        next(error);
    }
});

export default router;
