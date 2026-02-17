// Mi Negocio AVEMARÍA — Auth Middleware
// Verifica JWT en Authorization: Bearer <token>

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errorHandler.js';

export interface AuthPayload {
    id: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Token de acceso requerido');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new UnauthorizedError('Token de acceso requerido');
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET no configurado');
        }

        const payload = jwt.verify(token, secret) as AuthPayload;
        req.user = { id: payload.id, email: payload.email };
        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            next(error);
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError('Token inválido'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new UnauthorizedError('Token expirado'));
        } else {
            next(error);
        }
    }
}
