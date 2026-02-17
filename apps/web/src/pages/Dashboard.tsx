// Mi Negocio AVEMARÍA — Dashboard Page

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { formatCOP, formatPercent, channelConfig } from '../utils/format';
import type { DashboardData } from '../types';
import './Dashboard.css';

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ success: true; data: DashboardData }>('/dashboard')
            .then((res) => setData(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="dashboard-loading">Cargando dashboard...</div>;
    }

    if (!data) return null;

    const chartData = data.monthlyRevenue.map((m, i) => ({
        name: m.label,
        ingresos: m.value,
        ganancia: data.monthlyProfit[i]?.value || 0,
    }));

    return (
        <div>
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Tu resumen del mes actual</p>
            </div>

            {/* ── Profit Banner ── */}
            <div className="profit-banner">
                <div className="profit-main">
                    <div className="profit-label">Ganancia neta del mes</div>
                    <div className="profit-amount">{formatCOP(data.totalProfit)}</div>
                </div>
                <div className="profit-stats">
                    <div className="profit-stat">
                        <div className="stat-value">{formatCOP(data.totalRevenue)}</div>
                        <div className="stat-label">Ingresos</div>
                    </div>
                    <div className="profit-stat">
                        <div className="stat-value">{formatPercent(data.profitMargin)}</div>
                        <div className="stat-label">Margen</div>
                    </div>
                    <div className="profit-stat">
                        <div className="stat-value">{data.unitsSold}</div>
                        <div className="stat-label">Unidades</div>
                    </div>
                </div>
            </div>

            {/* ── Low Stock Alert ── */}
            {data.lowStockProducts.length > 0 && (
                <div className="low-stock-alert">
                    <h4>⚠️ Stock bajo — {data.lowStockProducts.length} productos</h4>
                    <div className="low-stock-pills">
                        {data.lowStockProducts.map((p) => (
                            <span key={p.id} className="low-stock-pill">
                                {p.icon || '📦'} {p.ref} — {p.stock}/{p.minStock}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── KPI Cards ── */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon">💰</div>
                    <div className="kpi-value">{formatCOP(data.totalRevenue)}</div>
                    <div className="kpi-label">Ventas del mes</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon">📈</div>
                    <div className="kpi-value">{formatPercent(data.profitMargin)}</div>
                    <div className="kpi-label">Margen de ganancia</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon">📦</div>
                    <div className="kpi-value">{data.unitsSold}</div>
                    <div className="kpi-label">Unidades vendidas</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon">🛒</div>
                    <div className="kpi-value">{formatCOP(data.totalPaidToAvemaria)}</div>
                    <div className="kpi-label">Pagado a AVEMARÍA</div>
                </div>
            </div>

            {/* ── Charts + Side Panel ── */}
            <div className="dashboard-grid">
                {/* Monthly Chart */}
                <div className="dashboard-card">
                    <h3>📊 Tendencia de ingresos (6 meses)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#C9A96E" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#27ae60" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#27ae60" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fontFamily: 'DM Mono', fill: '#999' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis hide />
                                <Tooltip
                                    formatter={(value: number) => formatCOP(value)}
                                    contentStyle={{
                                        fontFamily: 'Jost',
                                        fontSize: '0.82rem',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(201,169,110,0.2)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="ingresos"
                                    stroke="#C9A96E"
                                    strokeWidth={2}
                                    fill="url(#goldGrad)"
                                    name="Ingresos"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="ganancia"
                                    stroke="#27ae60"
                                    strokeWidth={2}
                                    fill="url(#greenGrad)"
                                    name="Ganancia"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue by Channel */}
                <div className="dashboard-card">
                    <h3>📱 Ventas por canal</h3>
                    <div className="channel-list">
                        {Object.entries(data.revenueByChannel).map(([key, value]) => {
                            const config = channelConfig[key.toUpperCase()];
                            return (
                                <div key={key} className="channel-item">
                                    <div className="channel-dot" style={{ background: config?.color || '#ccc' }} />
                                    <span className="channel-name">{config?.label || key}</span>
                                    <span className="channel-value">{formatCOP(value)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Top Products + Activity ── */}
            <div className="dashboard-grid">
                <div className="dashboard-card">
                    <h3>🏆 Top 5 productos (por ganancia)</h3>
                    <div className="top-product-list">
                        {data.topProducts.map((p, i) => (
                            <div key={p.product.id} className="top-product-item">
                                <span className="top-product-rank">#{i + 1}</span>
                                <span className="top-product-icon">{p.product.icon || '✨'}</span>
                                <div className="top-product-info">
                                    <div className="name">{p.product.name}</div>
                                    <div className="qty">{p.totalQuantity} unidades</div>
                                </div>
                                <span className="top-product-profit">+{formatCOP(p.totalProfit)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-card">
                    <h3>🕐 Actividad reciente</h3>
                    <div className="activity-list">
                        {data.recentActivity.map((a) => (
                            <div key={a.id} className="activity-item">
                                <div className={`activity-icon ${a.type}`}>
                                    {a.type === 'sale' ? '💰' : '🛒'}
                                </div>
                                <div className="activity-info">
                                    <div className="desc">{a.description}</div>
                                    <div className="date">
                                        {new Date(a.date).toLocaleDateString('es-CO', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                                <div className={`activity-amount ${a.type === 'sale' ? 'income' : 'expense'}`}>
                                    {a.type === 'sale' ? '+' : '-'}{formatCOP(a.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
