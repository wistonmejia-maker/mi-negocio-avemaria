// Mi Negocio AVEMARÍA — Auth Zod Schemas

import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    businessName: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token requerido'),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    businessName: z.string().min(2, 'El nombre del negocio debe tener al menos 2 caracteres'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
