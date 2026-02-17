// Mi Negocio AVEMARÍA — Inventory/Product Routes

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../../middleware/validate.middleware.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

const router = Router();
router.use(authMiddleware);

// ── Schemas ──
const createProductSchema = z.object({
    ref: z.string().min(1, 'Referencia requerida'),
    name: z.string().min(1, 'Nombre requerido'),
    category: z.enum(['CANDONGAS', 'TOPOS', 'GRANDES', 'SETS', 'EARCUFFS', 'COLLARES', 'PULSERAS', 'OTRO']),
    icon: z.string().optional(),
    wholesalePrice: z.number().positive('El precio mayorista debe ser positivo'),
    retailPrice: z.number().positive('El precio de venta debe ser positivo'),
    stock: z.number().int().min(0).default(0),
    minStock: z.number().int().min(0).default(10),
});

const updateProductSchema = createProductSchema.partial();

// GET /api/products — lista con filtros
router.get('/', async (req, res, next) => {
    try {
        const { search, category, lowStock } = req.query;

        const where: Record<string, unknown> = { isActive: true };

        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { ref: { contains: String(search), mode: 'insensitive' } },
            ];
        }

        if (category) {
            where.category = String(category);
        }

        const products = await prisma.product.findMany({
            where: where as any,
            orderBy: { name: 'asc' },
        });

        // Filtrar low stock en JS para evitar raw query
        const filtered = lowStock === 'true'
            ? products.filter((p) => p.stock <= p.minStock)
            : products;

        sendSuccess(res, { data: filtered, meta: { total: filtered.length } });
    } catch (error) {
        next(error);
    }
});

// GET /api/products/low-stock
router.get('/low-stock', async (_req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
        });
        const lowStock = products.filter((p) => p.stock <= p.minStock);
        sendSuccess(res, { data: lowStock });
    } catch (error) {
        next(error);
    }
});

// GET /api/products/stats
router.get('/stats', async (_req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
        });

        const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
        const totalCostValue = products.reduce((sum, p) => sum + p.stock * Number(p.wholesalePrice), 0);
        const totalRetailValue = products.reduce((sum, p) => sum + p.stock * Number(p.retailPrice), 0);

        sendSuccess(res, {
            data: { totalUnits, totalCostValue, totalRetailValue },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/products
router.post('/', validateBody(createProductSchema), async (req, res, next) => {
    try {
        const product = await prisma.product.create({ data: req.body });
        sendCreated(res, product);
    } catch (error) {
        next(error);
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                purchaseItems: { include: { purchase: true }, take: 10, orderBy: { purchase: { purchasedAt: 'desc' } } },
                saleItems: { include: { sale: true }, take: 10, orderBy: { sale: { soldAt: 'desc' } } },
            },
        });
        if (!product || !product.isActive) {
            throw new NotFoundError('Producto no encontrado');
        }
        sendSuccess(res, { data: product });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/products/:id
router.patch('/:id', validateBody(updateProductSchema), async (req, res, next) => {
    try {
        const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!existing || !existing.isActive) {
            throw new NotFoundError('Producto no encontrado');
        }
        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: req.body,
        });
        sendSuccess(res, { data: product });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/products/:id (soft delete)
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            throw new NotFoundError('Producto no encontrado');
        }
        await prisma.product.update({
            where: { id: req.params.id },
            data: { isActive: false },
        });
        sendSuccess(res, { data: { message: 'Producto eliminado' } });
    } catch (error) {
        next(error);
    }
});

export default router;
