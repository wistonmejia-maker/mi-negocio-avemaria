// Mi Negocio AVEMARÍA — Profits (Ganancias) Page

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../lib/api';
import { formatCOP, formatPercent, expenseCategoryLabels } from '../utils/format';
import './shared.css';

interface PerPesoItem {
    category: string;
    amount: number;
    per100: number;
}

interface Summary {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    margin: number;
}

export default function ProfitsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [perPeso, setPerPeso] = useState<PerPesoItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/accounting/summary'),
            api.get('/accounting/per-peso'),
        ]).then(([sumRes, perRes]) => {
            setSummary(sumRes.data.data);
            setPerPeso(perRes.data.data.perHundred || []);
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

    const colors = ['#C9A96E', '#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#27ae60'];
    const profitItem = perPeso.find((p) => p.category === 'GANANCIA');
    const expenseItems = perPeso.filter((p) => p.category !== 'GANANCIA');

    return (
        <div>
            <div className="page-header">
                <h1>💎 Ganancias</h1>
            </div>

            {/* Main Profit Banner */}
            {summary && (
                <div className="profit-banner" style={{ marginBottom: '1.5rem' }}>
                    <div className="profit-main">
                        <div className="profit-label">Ganancia total acumulada</div>
                        <div className="profit-amount">{formatCOP(summary.netProfit)}</div>
                    </div>
                    <div className="profit-stats">
                        <div className="profit-stat">
                            <div className="stat-value">{formatPercent(summary.margin)}</div>
                            <div className="stat-label">Margen de ganancia</div>
                        </div>
                        <div className="profit-stat">
                            <div className="stat-value">{formatCOP(summary.totalIncome)}</div>
                            <div className="stat-label">Ingresos totales</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid-2">
                {/* Per-peso chart */}
                <div className="card">
                    <h3>💰 De cada $100 que cobras</h3>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={perPeso}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="per100"
                                    nameKey="category"
                                >
                                    {perPeso.map((_, i) => (
                                        <Cell key={i} fill={colors[i % colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v: number, name: string) => [`$${v} de cada $100`, expenseCategoryLabels[name] || name]}
                                    contentStyle={{ fontFamily: 'Jost', fontSize: '0.82rem', borderRadius: '10px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Breakdown list */}
                <div className="card">
                    <h3>📊 Distribución de cada $100</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {expenseItems.map((item, i) => (
                            <div key={item.category} style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.6rem 0', borderBottom: '1px solid rgba(201,169,110,0.06)',
                            }}>
                                <div style={{ width: 12, height: 12, borderRadius: '3px', background: colors[i % colors.length], flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: '0.85rem' }}>{expenseCategoryLabels[item.category] || item.category}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: '#e74c3c', fontWeight: 500 }}>
                                    ${item.per100.toFixed(1)}
                                </span>
                            </div>
                        ))}
                        {profitItem && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.85rem 0.75rem',
                                background: 'rgba(39,174,96,0.06)', borderRadius: '10px', marginTop: '0.5rem',
                            }}>
                                <div style={{ width: 12, height: 12, borderRadius: '3px', background: '#27ae60', flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: '#27ae60' }}>Tu ganancia</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: '#27ae60', fontWeight: 600, fontSize: '1.1rem' }}>
                                    ${profitItem.per100.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
