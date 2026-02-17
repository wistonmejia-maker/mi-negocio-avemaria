// Mi Negocio AVEMARÍA — Auth Service
// JWT token generation and user authentication logic

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from '../../middleware/errorHandler.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// DECISIÓN: Refresh tokens se almacenan en memoria (Map) para esta versión.
// En producción, se usaría Redis o una tabla en BD.
const refreshTokenStore = new Map<string, string>(); // token -> userId

function generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign(
        { id: userId, email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
    );

    const refreshToken = jwt.sign(
        { id: userId, email },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN },
    );

    // Guardar refresh token
    refreshTokenStore.set(refreshToken, userId);

    return { accessToken, refreshToken };
}

function sanitizeUser(user: { id: string; email: string; name: string; businessName: string; createdAt: Date }) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        businessName: user.businessName,
        createdAt: user.createdAt,
    };
}

export async function registerUser(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
        throw new ConflictError('Ya existe una cuenta con ese email');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
        data: {
            email: input.email,
            passwordHash,
            name: input.name,
            businessName: input.businessName || 'Mi Negocio AVEMARÍA',
        },
    });

    const tokens = generateTokens(user.id, user.email);

    return {
        user: sanitizeUser(user),
        ...tokens,
    };
}

export async function loginUser(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
        throw new UnauthorizedError('Email o contraseña incorrectos');
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
        throw new UnauthorizedError('Email o contraseña incorrectos');
    }

    const tokens = generateTokens(user.id, user.email);

    return {
        user: sanitizeUser(user),
        ...tokens,
    };
}

export async function refreshAccessToken(refreshToken: string) {
    const storedUserId = refreshTokenStore.get(refreshToken);
    if (!storedUserId) {
        throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    try {
        const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string; email: string };

        const accessToken = jwt.sign(
            { id: payload.id, email: payload.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN },
        );

        return { accessToken };
    } catch {
        refreshTokenStore.delete(refreshToken);
        throw new UnauthorizedError('Refresh token inválido o expirado');
    }
}

export async function logoutUser(refreshToken: string) {
    refreshTokenStore.delete(refreshToken);
}

export async function getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new NotFoundError('Usuario no encontrado');
    }
    return sanitizeUser(user);
}

export async function updateProfile(userId: string, data: { name: string; businessName: string }) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            name: data.name,
            businessName: data.businessName,
        },
    });

    return sanitizeUser(user);
}
