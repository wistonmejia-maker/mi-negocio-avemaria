// Mi Negocio AVEMARÍA — Express App Entry Point

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';

// ── Route Imports ──
import authRoutes from './modules/auth/auth.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import purchaseRoutes from './modules/purchases/purchases.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import customerRoutes from './modules/customers/customers.routes.js';
import accountingRoutes from './modules/accounting/accounting.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security ──
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? true // Reflect origin or use a whitelist of your Vercel domains
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));

// ── Rate Limiting ──
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiadas solicitudes, intenta de nuevo en un minuto' },
});

const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiados intentos de login, espera un minuto' },
});

app.use(generalLimiter);

// ── Body Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            name: 'Mi Negocio AVEMARÍA API',
            timestamp: new Date().toISOString(),
        },
    });
});

// ── API Routes ──
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', inventoryRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Error Handler (debe ir último) ──
app.use(errorHandler);

// ── Start Server (only if not in Vercel) ──
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Mi Negocio AVEMARÍA API corriendo en http://localhost:${PORT}`);
        console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
}

export { app, authLimiter };
