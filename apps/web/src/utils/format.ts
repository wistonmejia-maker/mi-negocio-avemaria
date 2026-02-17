// Mi Negocio AVEMARÍA — COP Formatter + Utilities

/**
 * Formatea un número como peso colombiano.
 * Ejemplo: 1284000 → "$1.284.000"
 * REGLA 6: COP con separador de miles como punto
 */
export function formatCOP(value: number): string {
    return '$' + Math.round(value).toLocaleString('es-CO');
}

/**
 * Formatea un porcentaje
 * Ejemplo: 29.49 → "29,49%"
 */
export function formatPercent(value: number): string {
    return value.toFixed(2).replace('.', ',') + '%';
}

/**
 * Calcula la ganancia por unidad
 */
export function calcProfit(retailPrice: number, wholesalePrice: number): number {
    return retailPrice - wholesalePrice;
}

/**
 * Calcula el margen de ganancia en porcentaje
 */
export function calcMargin(retailPrice: number, wholesalePrice: number): number {
    if (retailPrice === 0) return 0;
    return ((retailPrice - wholesalePrice) / retailPrice) * 100;
}

/**
 * Emoji por categoría de producto
 */
export const categoryIcons: Record<string, string> = {
    CANDONGAS: '✨',
    TOPOS: '🌸',
    GRANDES: '👑',
    SETS: '💎',
    EARCUFFS: '🌙',
    COLLARES: '📿',
    PULSERAS: '💫',
    OTRO: '🎀',
};

/**
 * Nombre legible de categoría
 */
export const categoryLabels: Record<string, string> = {
    CANDONGAS: 'Candongas',
    TOPOS: 'Topos',
    GRANDES: 'Grandes',
    SETS: 'Sets',
    EARCUFFS: 'Earcuffs',
    COLLARES: 'Collares',
    PULSERAS: 'Pulseras',
    OTRO: 'Otro',
};

/**
 * Colores por canal de venta
 */
export const channelConfig: Record<string, { label: string; color: string; icon: string }> = {
    WHATSAPP: { label: 'WhatsApp', color: '#25D366', icon: '💬' },
    INSTAGRAM: { label: 'Instagram', color: '#E1306C', icon: '📸' },
    PRESENCIAL: { label: 'Presencial', color: '#C9A96E', icon: '🏬' },
};

/**
 * Nombres de métodos de pago
 */
export const paymentLabels: Record<string, string> = {
    NEQUI: 'Nequi',
    DAVIPLATA: 'Daviplata',
    TRANSFERENCIA: 'Transferencia',
    EFECTIVO: 'Efectivo',
    CONTRA_ENTREGA: 'Contra entrega',
};

/**
 * Nombres de categorías de gasto
 */
export const expenseCategoryLabels: Record<string, string> = {
    COMPRA_AVEMARIA: 'Compras AVEMARÍA',
    ENVIOS: 'Envíos',
    EMPAQUES: 'Empaques',
    PUBLICIDAD: 'Publicidad',
    OTRO: 'Otro',
};
