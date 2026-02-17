// Mi Negocio AVEMARÍA — Integration Tests

import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const API = 'http://localhost:3000/api';
let accessToken = '';

describe('Auth Integration', () => {
    it('should login with valid credentials', async () => {
        const res = await axios.post(`${API}/auth/login`, {
            email: 'yo@minegocio.com',
            password: 'Avemaria123!',
        });

        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data.accessToken).toBeDefined();
        expect(res.data.data.refreshToken).toBeDefined();
        expect(res.data.data.user.email).toBe('yo@minegocio.com');

        accessToken = res.data.data.accessToken;
    });

    it('should reject invalid credentials', async () => {
        try {
            await axios.post(`${API}/auth/login`, {
                email: 'yo@minegocio.com',
                password: 'wrong',
            });
            expect(true).toBe(false); // Should not reach here
        } catch (err: any) {
            expect(err.response.status).toBe(401);
        }
    });

    it('should get profile with valid token', async () => {
        const res = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(res.status).toBe(200);
        expect(res.data.data.email).toBe('yo@minegocio.com');
    });
});

describe('Products Integration', () => {
    it('should list products', async () => {
        const res = await axios.get(`${API}/products`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.data.data)).toBe(true);
        expect(res.data.data.length).toBeGreaterThan(0);
    });

    it('should get low stock products', async () => {
        const res = await axios.get(`${API}/products/low-stock`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.data.data)).toBe(true);
    });
});

describe('Sales Integration', () => {
    it('should list sales', async () => {
        const res = await axios.get(`${API}/sales`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.data.data)).toBe(true);
        expect(res.data.data.length).toBeGreaterThan(0);
    });
});

describe('Dashboard Integration', () => {
    it('should return dashboard data', async () => {
        const res = await axios.get(`${API}/dashboard`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(res.status).toBe(200);
        const d = res.data.data;
        expect(d.totalRevenue).toBeGreaterThan(0);
        expect(d.totalProfit).toBeGreaterThan(0);
        expect(d.profitMargin).toBeGreaterThan(0);
        expect(d.unitsSold).toBeGreaterThan(0);
        expect(Array.isArray(d.topProducts)).toBe(true);
        expect(Array.isArray(d.recentActivity)).toBe(true);
        expect(Array.isArray(d.monthlyRevenue)).toBe(true);
    });
});

describe('Accounting Integration', () => {
    it('should return accounting summary', async () => {
        const res = await axios.get(`${API}/accounting/summary`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(res.status).toBe(200);
        expect(res.data.data.totalIncome).toBeGreaterThan(0);
        expect(res.data.data.netProfit).toBeDefined();
        expect(res.data.data.margin).toBeDefined();
    });
});
