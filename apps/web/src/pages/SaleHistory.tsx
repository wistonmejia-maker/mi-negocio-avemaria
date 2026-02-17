// Mi Negocio AVEMARÍA — Sale History Page (with Cancel + Detail)

import { useEffect, useState } from 'react';
import api from '../lib/api';
import { formatCOP, channelConfig, paymentLabels } from '../utils/format';
import type { Sale } from '../types';
import './shared.css';

export default function SaleHistoryPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [channel, setChannel] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchSales = () => {
        const params = new URLSearchParams();
        if (channel) params.set('channel', channel);

        api.get(`/sales?${params}`)
            .then((res) => setSales(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSales(); }, [channel]);

    const statusLabels: Record<string, string> = {
        COMPLETED: 'Completada',
        PENDING_PAYMENT: 'Pendiente',
        CANCELLED: 'Cancelada',
    };

    const handleCancel = async (sale: Sale) => {
        if (!window.confirm(`¿Cancelar venta #${sale.folio}? El stock se restaurará automáticamente.`)) return;
        try {
            await api.patch(`/sales/${sale.id}/status`, { status: 'CANCELLED' });
            fetchSales();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al cancelar');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>📋 Historial de Ventas</h1>
            </div>

            <div className="filter-bar">
                <select className="filter-select" value={channel} onChange={(e) => setChannel(e.target.value)}>
                    <option value="">Todos los canales</option>
                    <option value="WHATSAPP">💬 WhatsApp</option>
                    <option value="INSTAGRAM">📸 Instagram</option>
                    <option value="PRESENCIAL">🏬 Presencial</option>
                </select>
            </div>

            <div className="card">
                {loading ? (
                    <div className="empty-state"><p>Cargando...</p></div>
                ) : sales.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p>No hay ventas registradas</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Fecha</th>
                                <th>Clienta</th>
                                <th>Canal</th>
                                <th>Pago</th>
                                <th>Total</th>
                                <th>Ganancia</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((s) => (
                                <>
                                    <tr
                                        key={s.id}
                                        onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>#{s.folio}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                            {new Date(s.soldAt).toLocaleDateString('es-CO')}
                                        </td>
                                        <td>{s.customer?.name || '—'}</td>
                                        <td>
                                            <span style={{ marginRight: '0.35rem' }}>{channelConfig[s.channel]?.icon}</span>
                                            {channelConfig[s.channel]?.label}
                                        </td>
                                        <td>{paymentLabels[s.paymentMethod]}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatCOP(Number(s.totalRevenue))}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', color: '#27ae60' }}>+{formatCOP(Number(s.netProfit))}</td>
                                        <td>
                                            <span className={`status-badge ${s.status === 'COMPLETED' ? 'completed' : s.status === 'CANCELLED' ? 'cancelled' : 'pending'}`}>
                                                {statusLabels[s.status]}
                                            </span>
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            {s.status !== 'CANCELLED' && (
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleCancel(s)}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {/* Expanded detail row */}
                                    {expandedId === s.id && s.items && (
                                        <tr key={`${s.id}-detail`}>
                                            <td colSpan={9} style={{ padding: '0.75rem 1rem', background: 'rgba(201,169,110,0.04)' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gris)', marginBottom: '0.5rem' }}>
                                                    Productos en esta venta
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                    {s.items.map((item) => (
                                                        <div key={item.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', alignItems: 'center' }}>
                                                            <span>{item.product?.icon || '✨'}</span>
                                                            <span style={{ flex: 1 }}>{item.product?.name || 'Producto'}</span>
                                                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gris)' }}>× {item.quantity}</span>
                                                            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCOP(Number(item.unitRevenue))} c/u</span>
                                                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatCOP(Number(item.unitRevenue) * item.quantity)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {s.notes && (
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--gris)', fontStyle: 'italic' }}>
                                                        💬 {s.notes}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
