// Mi Negocio AVEMARÍA — Auth Routes

import { Router } from 'express';
import { validateBody } from '../../middleware/validate.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { registerSchema, loginSchema, refreshSchema, updateProfileSchema } from './auth.schemas.js';
import { registerUser, loginUser, refreshAccessToken, logoutUser, getProfile, updateProfile } from './auth.service.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validateBody(registerSchema), async (req, res, next) => {
    try {
        const result = await registerUser(req.body);
        sendCreated(res, result);
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
    try {
        const result = await loginUser(req.body);
        sendSuccess(res, { data: result });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/refresh
router.post('/refresh', validateBody(refreshSchema), async (req, res, next) => {
    try {
        const result = await refreshAccessToken(req.body.refreshToken);
        sendSuccess(res, { data: result });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await logoutUser(refreshToken);
        }
        sendSuccess(res, { data: { message: 'Sesión cerrada exitosamente' } });
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const user = await getProfile(req.user!.id);
        sendSuccess(res, { data: user });
    } catch (error) {
        next(error);
    }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, validateBody(updateProfileSchema), async (req, res, next) => {
    try {
        const user = await updateProfile(req.user!.id, req.body);
        sendSuccess(res, { data: user });
    } catch (error) {
        next(error);
    }
});

export default router;
