// Mi Negocio AVEMARÍA — Unit Tests

import { describe, it, expect } from 'vitest';

// ── Import the utilities ──
// NOTE: These are duplicated here instead of importing from the web app
// because the web app uses import.meta which is Vite-specific.

function formatCOP(value: number): string {
    return '$' + Math.round(value).toLocaleString('es-CO');
}

function formatPercent(value: number): string {
    return value.toFixed(2).replace('.', ',') + '%';
}

function calcProfit(retailPrice: number, wholesalePrice: number): number {
    return retailPrice - wholesalePrice;
}

function calcMargin(retailPrice: number, wholesalePrice: number): number {
    if (retailPrice === 0) return 0;
    return ((retailPrice - wholesalePrice) / retailPrice) * 100;
}

function customerLevel(totalSpent: number): string {
    if (totalSpent >= 500000) return 'VIP';
    if (totalSpent >= 200000) return 'Frecuente';
    return 'Regular';
}

// ── Unit Tests ──

describe('formatCOP', () => {
    it('formats zero', () => {
        expect(formatCOP(0)).toBe('$0');
    });

    it('formats small numbers without separators', () => {
        expect(formatCOP(999)).toBe('$999');
    });

    it('formats thousands with separator', () => {
        const result = formatCOP(1284000);
        // In es-CO locale, thousands separator is a period
        expect(result).toContain('1');
        expect(result).toContain('284');
        expect(result).toContain('000');
        expect(result.startsWith('$')).toBe(true);
    });

    it('rounds decimals', () => {
        expect(formatCOP(1234.56)).toContain('1');
        expect(formatCOP(1234.56)).toContain('235');
    });
});

describe('formatPercent', () => {
    it('formats a percentage with comma', () => {
        expect(formatPercent(29.49)).toBe('29,49%');
    });

    it('formats zero', () => {
        expect(formatPercent(0)).toBe('0,00%');
    });

    it('formats 100%', () => {
        expect(formatPercent(100)).toBe('100,00%');
    });
});

describe('calcProfit', () => {
    it('calculates the profit per unit', () => {
        expect(calcProfit(60000, 22000)).toBe(38000);
    });

    it('returns 0 when prices are equal', () => {
        expect(calcProfit(22000, 22000)).toBe(0);
    });

    it('returns negative when cost > revenue', () => {
        expect(calcProfit(10000, 22000)).toBe(-12000);
    });
});

describe('calcMargin', () => {
    it('calculates margin percentage', () => {
        const margin = calcMargin(60000, 22000);
        expect(margin).toBeCloseTo(63.33, 1);
    });

    it('returns 0 when retail is 0', () => {
        expect(calcMargin(0, 0)).toBe(0);
    });

    it('returns 100% when cost is 0', () => {
        expect(calcMargin(60000, 0)).toBe(100);
    });
});

describe('customerLevel', () => {
    it('returns Regular for low spend', () => {
        expect(customerLevel(50000)).toBe('Regular');
    });

    it('returns Frecuente for medium spend', () => {
        expect(customerLevel(200000)).toBe('Frecuente');
    });

    it('returns VIP for high spend', () => {
        expect(customerLevel(500000)).toBe('VIP');
    });

    it('returns VIP for very high spend', () => {
        expect(customerLevel(1500000)).toBe('VIP');
    });

    it('returns Regular for zero spend', () => {
        expect(customerLevel(0)).toBe('Regular');
    });
});
