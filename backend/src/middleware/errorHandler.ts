// Mi Negocio AVEMARÍA — Error Handler Middleware
// Captura global de errores con respuesta consistente

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public details?: unknown,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(400, message, details);
        this.name = 'ValidationError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'No autorizado') {
        super(401, message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Acceso denegado') {
        super(403, message);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(404, message);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(409, message);
        this.name = 'ConflictError';
    }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    // Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: 'Error de validación',
            details: err.errors,
        });
        return;
    }

    // Application errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
            ...(err.details ? { details: err.details } : {}),
        });
        return;
    }

    // Unknown errors
    console.error('❌ Error no manejado en la API:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: _req.path,
        method: _req.method,
    });

    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : err.message || 'Error interno del servidor',
    });
}
