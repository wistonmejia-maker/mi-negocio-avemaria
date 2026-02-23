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

// DECISIÓN: Los refresh tokens AHORA se almacenan en la base de datos para persistencia en Vercel.
// Esto evita que se pierda la sesión cuando las funciones serverless se reciclan.

async function generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign(
        { id: userId, email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
    );

    const refreshTokenString = jwt.sign(
        { id: userId, email },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN },
    );

    // Calcular fecha de expiración para la BD (7 días por defecto)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Guardar refresh token en la BD
    await prisma.refreshToken.create({
        data: {
            token: refreshTokenString,
            userId,
            expiresAt,
        },
    });

    return { accessToken, refreshToken: refreshTokenString };
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

    const tokens = await generateTokens(user.id, user.email);

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

    const tokens = await generateTokens(user.id, user.email);

    return {
        user: sanitizeUser(user),
        ...tokens,
    };
}

export async function refreshAccessToken(refreshToken: string) {
    // Buscar el token en la base de datos
    const dbToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
        if (dbToken) {
            await prisma.refreshToken.delete({ where: { id: dbToken.id } });
        }
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
        await prisma.refreshToken.delete({ where: { id: dbToken.id } });
        throw new UnauthorizedError('Refresh token inválido o expirado');
    }
}

export async function logoutUser(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
    });
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
