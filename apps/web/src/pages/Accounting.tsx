// Mi Negocio AVEMARÍA — Accounting Page (with Add Transaction)

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { formatCOP, formatPercent, expenseCategoryLabels } from '../utils/format';
import type { Transaction } from '../types';
import './shared.css';

interface Summary {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    margin: number;
    expenseBreakdown: Array<{ category: string; amount: number }>;
}

interface MonthlyData {
    month: string;
    label: string;
    income: number;
    expense: number;
    profit: number;
}

const txCategories = [
    { value: 'COMPRA_AVEMARIA', label: 'Compras AVEMARÍA' },
    { value: 'ENVIOS', label: 'Envíos' },
    { value: 'EMPAQUES', label: 'Empaques' },
    { value: 'PUBLICIDAD', label: 'Publicidad' },
    { value: 'VENTA', label: 'Venta' },
    { value: 'OTRO', label: 'Otro' },
];

export default function AccountingPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [monthly, setMonthly] = useState<MonthlyData[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // New Transaction Modal
    const [showModal, setShowModal] = useState(false);
    const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [txAmount, setTxAmount] = useState('');
    const [txCategory, setTxCategory] = useState('ENVIOS');
    const [txDescription, setTxDescription] = useState('');
    const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchAll = () => {
        Promise.all([
            api.get('/accounting/summary'),
            api.get('/accounting/by-month'),
            api.get('/accounting/transactions'),
        ]).then(([sumRes, monthRes, txRes]) => {
            setSummary(sumRes.data.data);
            setMonthly(monthRes.data.data);
            setTransactions(txRes.data.data);
        }).catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchAll(); }, []);

    const openNew = (type: 'INCOME' | 'EXPENSE') => {
        setTxType(type);
        setTxAmount('');
        setTxCategory(type === 'EXPENSE' ? 'ENVIOS' : 'VENTA');
        setTxDescription('');
        setTxDate(new Date().toISOString().split('T')[0]);
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!txAmount || Number(txAmount) <= 0) { setError('El monto es obligatorio'); return; }
        if (!txDescription.trim()) { setError('La descripción es obligatoria'); return; }
        setSaving(true);
        setError('');
        try {
            await api.post('/accounting/transactions', {
                type: txType,
                amount: Number(txAmount),
                category: txCategory,
                description: txDescription.trim(),
                date: txDate,
            });
            setShowModal(false);
            fetchAll();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al registrar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

    const expenseColors = ['#C9A96E', '#e74c3c', '#3498db', '#f39c12', '#95a5a6'];

    return (
        <div>
            <div className="page-header">
                <h1>📝 Contabilidad</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => openNew('EXPENSE')}>+ Registrar Gasto</button>
                    <button className="btn btn-secondary" onClick={() => openNew('INCOME')}>+ Registrar Ingreso</button>
                </div>
            </div>

            {/* Summary KPIs */}
            {summary && (
                <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="kpi-card">
                        <div className="kpi-icon">📈</div>
                        <div className="kpi-value" style={{ color: '#27ae60' }}>{formatCOP(summary.totalIncome)}</div>
                        <div className="kpi-label">Total ingresos</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon">📉</div>
                        <div className="kpi-value" style={{ color: '#e74c3c' }}>{formatCOP(summary.totalExpense)}</div>
                        <div className="kpi-label">Total gastos</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon">💎</div>
                        <div className="kpi-value">{formatCOP(summary.netProfit)}</div>
                        <div className="kpi-label">Ganancia neta</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon">📊</div>
                        <div className="kpi-value">{formatPercent(summary.margin)}</div>
                        <div className="kpi-label">Margen</div>
                    </div>
                </div>
            )}

            <div className="grid-2">
                {/* Monthly Chart */}
                <div className="card">
                    <h3>📊 Ingresos vs Gastos (12 meses)</h3>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthly}>
                                <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip formatter={(v: number) => formatCOP(v)} contentStyle={{ fontFamily: 'Jost', fontSize: '0.82rem', borderRadius: '10px' }} />
                                <Bar dataKey="income" fill="#C9A96E" radius={[4, 4, 0, 0]} name="Ingresos" />
                                <Bar dataKey="expense" fill="#e74c3c" radius={[4, 4, 0, 0]} name="Gastos" opacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="card">
                    <h3>💸 Desglose de gastos</h3>
                    {summary?.expenseBreakdown.map((item, i) => (
                        <div key={item.category} style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.6rem 0', borderBottom: '1px solid rgba(201,169,110,0.06)',
                        }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: expenseColors[i % expenseColors.length], flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: '0.85rem' }}>{expenseCategoryLabels[item.category] || item.category}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatCOP(item.amount)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3>📋 Últimas transacciones</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.slice(0, 20).map((t) => (
                            <tr key={t.id}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                    {new Date(t.date).toLocaleDateString('es-CO')}
                                </td>
                                <td>
                                    <span className={`status-badge ${t.type === 'INCOME' ? 'completed' : 'cancelled'}`}>
                                        {t.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>{t.description}</td>
                                <td style={{ fontSize: '0.82rem', color: '#999' }}>{expenseCategoryLabels[t.category] || t.category}</td>
                                <td style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 500,
                                    color: t.type === 'INCOME' ? '#27ae60' : '#e74c3c',
                                }}>
                                    {t.type === 'INCOME' ? '+' : '-'}{formatCOP(Number(t.amount))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* New Transaction Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{txType === 'EXPENSE' ? '💸 Registrar Gasto' : '💰 Registrar Ingreso'}</h2>
                        <div className="page-form">
                            <div className="form-group">
                                <label>TIPO</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className={`btn ${txType === 'EXPENSE' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => { setTxType('EXPENSE'); setTxCategory('ENVIOS'); }}
                                        style={{ flex: 1 }}
                                    >📉 Gasto</button>
                                    <button
                                        className={`btn ${txType === 'INCOME' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => { setTxType('INCOME'); setTxCategory('VENTA'); }}
                                        style={{ flex: 1 }}
                                    >📈 Ingreso</button>
                                </div>
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>MONTO (COP) *</label>
                                    <input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="15000" />
                                </div>
                                <div className="form-group">
                                    <label>CATEGORÍA</label>
                                    <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)}>
                                        {txCategories.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>DESCRIPCIÓN *</label>
                                <input value={txDescription} onChange={(e) => setTxDescription(e.target.value)} placeholder="Envío pedido #ORD-005" />
                            </div>
                            <div className="form-group">
                                <label>FECHA</label>
                                <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
                            </div>
                            {error && (
                                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(231,76,60,0.08)', borderRadius: 8, fontSize: '0.82rem', color: '#c0392b' }}>
                                    ⚠️ {error}
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                                {saving ? 'Guardando...' : `Registrar ${txType === 'EXPENSE' ? 'Gasto' : 'Ingreso'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
