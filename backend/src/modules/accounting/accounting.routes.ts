// Mi Negocio AVEMARÍA — Accounting Routes (Contabilidad)

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { startOfMonth, subMonths, format } from 'date-fns';

const router = Router();
router.use(authMiddleware);

const createExpenseSchema = z.object({
    amount: z.number().positive('El monto debe ser positivo'),
    category: z.enum(['COMPRA_AVEMARIA', 'ENVIOS', 'EMPAQUES', 'PUBLICIDAD', 'OTRO']),
    description: z.string().min(1, 'Descripción requerida'),
});

// GET /api/transactions — lista con filtros
router.get('/transactions', async (req, res, next) => {
    try {
        const where: Record<string, unknown> = { userId: req.user!.id };
        if (req.query.type) where.type = String(req.query.type);
        if (req.query.category) where.category = String(req.query.category);
        if (req.query.startDate || req.query.endDate) {
            where.date = {
                ...(req.query.startDate ? { gte: new Date(String(req.query.startDate)) } : {}),
                ...(req.query.endDate ? { lte: new Date(String(req.query.endDate)) } : {}),
            };
        }

        const transactions = await prisma.transaction.findMany({
            where: where as any,
            include: { sale: true, purchase: true },
            orderBy: { date: 'desc' },
        });

        sendSuccess(res, { data: transactions, meta: { total: transactions.length } });
    } catch (error) {
        next(error);
    }
});

// POST /api/transactions — registrar gasto manual
router.post('/transactions', validateBody(createExpenseSchema), async (req, res, next) => {
    try {
        const transaction = await prisma.transaction.create({
            data: {
                type: 'EXPENSE',
                amount: req.body.amount,
                category: req.body.category,
                description: req.body.description,
                userId: req.user!.id,
            },
        });
        sendCreated(res, transaction);
    } catch (error) {
        next(error);
    }
});

// GET /api/accounting/summary — resumen por período
router.get('/summary', async (req, res, next) => {
    try {
        const where: Record<string, unknown> = { userId: req.user!.id };
        if (req.query.startDate || req.query.endDate) {
            where.date = {
                ...(req.query.startDate ? { gte: new Date(String(req.query.startDate)) } : {}),
                ...(req.query.endDate ? { lte: new Date(String(req.query.endDate)) } : {}),
            };
        }

        const transactions = await prisma.transaction.findMany({ where: where as any });

        const income = transactions.filter((t) => t.type === 'INCOME');
        const expenses = transactions.filter((t) => t.type === 'EXPENSE');

        const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
        const netProfit = totalIncome - totalExpense;
        const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        // Desglose de gastos por categoría
        const expenseBreakdown = Object.entries(
            expenses.reduce((acc, t) => {
                const cat = t.category;
                acc[cat] = (acc[cat] || 0) + Number(t.amount);
                return acc;
            }, {} as Record<string, number>),
        ).map(([category, amount]) => ({ category, amount }));

        sendSuccess(res, {
            data: { totalIncome, totalExpense, netProfit, margin, expenseBreakdown },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/accounting/by-month — últimos 12 meses
router.get('/by-month', async (req, res, next) => {
    try {
        const now = new Date();
        const months = [];

        for (let i = 11; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            const monthEnd = startOfMonth(subMonths(now, i - 1));

            const transactions = await prisma.transaction.findMany({
                where: {
                    userId: req.user!.id,
                    date: { gte: monthStart, lt: monthEnd },
                },
            });

            const income = transactions.filter((t) => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
            const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);

            months.push({
                month: format(monthStart, 'yyyy-MM'),
                label: format(monthStart, 'MMM yyyy'),
                income,
                expense,
                profit: income - expense,
            });
        }

        sendSuccess(res, { data: months });
    } catch (error) {
        next(error);
    }
});

// GET /api/accounting/per-peso — desglose de cada $100 cobrado
router.get('/per-peso', async (req, res, next) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: req.user!.id },
        });

        const totalIncome = transactions.filter((t) => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = transactions.filter((t) => t.type === 'EXPENSE');

        if (totalIncome === 0) {
            sendSuccess(res, { data: { perHundred: [] } });
            return;
        }

        const breakdown = Object.entries(
            expenses.reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
                return acc;
            }, {} as Record<string, number>),
        ).map(([category, amount]) => ({
            category,
            amount,
            per100: Math.round((amount / totalIncome) * 10000) / 100,
        }));

        const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
        const profitPer100 = Math.round(((totalIncome - totalExpense) / totalIncome) * 10000) / 100;

        sendSuccess(res, {
            data: {
                perHundred: [
                    ...breakdown,
                    { category: 'GANANCIA', amount: totalIncome - totalExpense, per100: profitPer100 },
                ],
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
