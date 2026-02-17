// Mi Negocio AVEMARÍA — Customers (Clientas) Page (with Add/Edit)

import { useEffect, useState } from 'react';
import api from '../lib/api';
import { formatCOP } from '../utils/format';
import type { Customer } from '../types';
import './shared.css';

const emptyForm = { name: '', phone: '', instagram: '', city: '', notes: '' };

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchCustomers = () => {
        api.get('/customers')
            .then((res) => setCustomers(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchCustomers(); }, []);

    const levelClass = (level: string) => {
        switch (level) {
            case 'VIP': return 'vip';
            case 'Frecuente': return 'frecuente';
            default: return 'regular';
        }
    };

    const levelEmoji = (level: string) => {
        switch (level) {
            case 'VIP': return '👑';
            case 'Frecuente': return '💜';
            default: return '🌸';
        }
    };

    const openAdd = () => {
        setEditId(null);
        setForm(emptyForm);
        setError('');
        setShowModal(true);
    };

    const openEdit = (c: Customer) => {
        setEditId(c.id);
        setForm({
            name: c.name,
            phone: c.phone || '',
            instagram: c.instagram || '',
            city: c.city || '',
            notes: c.notes || '',
        });
        setError('');
        setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }
        setSaving(true);
        setError('');
        const body = {
            name: form.name.trim(),
            phone: form.phone || null,
            instagram: form.instagram || null,
            city: form.city || null,
            notes: form.notes || null,
        };
        try {
            if (editId) {
                await api.patch(`/customers/${editId}`, body);
            } else {
                await api.post('/customers', body);
            }
            setShowModal(false);
            fetchCustomers();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>👩 Mis Clientas</h1>
                <button className="btn btn-primary" onClick={openAdd}>+ Agregar Clienta</button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="empty-state"><p>Cargando...</p></div>
                ) : customers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👩</div>
                        <p>No hay clientas registradas</p>
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>+ Agregar Clienta</button>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Clienta</th>
                                <th>Nivel</th>
                                <th>Teléfono</th>
                                <th>Instagram</th>
                                <th>Compras</th>
                                <th>Total gastado</th>
                                <th>Última compra</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <strong>{c.name}</strong>
                                        {c.notes && <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.15rem' }}>{c.notes}</div>}
                                    </td>
                                    <td>
                                        <span className={`level-badge ${levelClass(c.level)}`}>
                                            {levelEmoji(c.level)} {c.level}
                                        </span>
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{c.phone || '—'}</td>
                                    <td style={{ fontSize: '0.82rem' }}>{c.instagram ? `@${c.instagram}` : '—'}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{c.totalPurchases}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatCOP(c.totalSpent)}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#999' }}>
                                        {c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString('es-CO') : '—'}
                                    </td>
                                    <td>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editId ? '✏️ Editar Clienta' : '🌸 Nueva Clienta'}</h2>
                        <div className="page-form">
                            <div className="form-group">
                                <label>NOMBRE *</label>
                                <input name="name" value={form.name} onChange={handleChange} placeholder="María García" />
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>TELÉFONO</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="300 123 4567" />
                                </div>
                                <div className="form-group">
                                    <label>INSTAGRAM</label>
                                    <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="mariagarcia" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>CIUDAD</label>
                                <input name="city" value={form.city} onChange={handleChange} placeholder="Bogotá" />
                            </div>
                            <div className="form-group">
                                <label>NOTAS</label>
                                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Preferencias, tallas..." rows={2} style={{ resize: 'vertical' }} />
                            </div>
                            {error && (
                                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(231,76,60,0.08)', borderRadius: 8, fontSize: '0.82rem', color: '#c0392b' }}>
                                    ⚠️ {error}
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando...' : (editId ? 'Guardar Cambios' : 'Agregar Clienta')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
