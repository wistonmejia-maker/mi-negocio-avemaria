// Mi Negocio AVEMARÍA — Inventory Page (with Add/Edit/Delete)

import { useEffect, useState } from 'react';
import api from '../lib/api';
import { formatCOP, calcMargin, categoryIcons, categoryLabels } from '../utils/format';
import type { Product } from '../types';
import './shared.css';

const emptyForm = {
    ref: '', name: '', category: 'CANDONGAS', icon: '',
    wholesalePrice: '', retailPrice: '', stock: '', minStock: '3',
};

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchProducts = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category) params.set('category', category);

        api.get(`/products?${params}`)
            .then((res) => setProducts(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProducts(); }, [search, category]);

    const stockBadge = (p: Product) => {
        if (p.stock <= 0) return 'critical';
        if (p.stock <= p.minStock) return 'low';
        return 'ok';
    };

    // ── Modal handlers ──
    const openAdd = () => {
        setEditId(null);
        setForm(emptyForm);
        setError('');
        setShowModal(true);
    };

    const openEdit = (p: Product) => {
        setEditId(p.id);
        setForm({
            ref: p.ref, name: p.name, category: p.category,
            icon: p.icon || '',
            wholesalePrice: String(p.wholesalePrice),
            retailPrice: String(p.retailPrice),
            stock: String(p.stock),
            minStock: String(p.minStock),
        });
        setError('');
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditId(null); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!form.ref || !form.name || !form.wholesalePrice || !form.retailPrice) {
            setError('Completa los campos obligatorios');
            return;
        }
        setSaving(true);
        setError('');
        const body = {
            ref: form.ref,
            name: form.name,
            category: form.category,
            icon: form.icon || null,
            wholesalePrice: Number(form.wholesalePrice),
            retailPrice: Number(form.retailPrice),
            stock: Number(form.stock || 0),
            minStock: Number(form.minStock || 3),
        };
        try {
            if (editId) {
                await api.patch(`/products/${editId}`, body);
            } else {
                await api.post('/products', body);
            }
            closeModal();
            fetchProducts();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`¿Eliminar "${name}"?`)) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (err: any) {
            alert(err.response?.data?.error || 'No se pudo eliminar');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>📦 Inventario</h1>
                <button className="btn btn-primary" onClick={openAdd}>+ Agregar Producto</button>
            </div>

            <div className="filter-bar">
                <input
                    className="filter-input"
                    placeholder="Buscar por nombre o ref..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="filter-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="">Todas las categorías</option>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                        <option key={k} value={k}>{categoryIcons[k]} {v}</option>
                    ))}
                </select>
            </div>

            <div className="card">
                {loading ? (
                    <div className="empty-state"><p>Cargando...</p></div>
                ) : products.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📦</div>
                        <p>No se encontraron productos</p>
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>+ Agregar Producto</button>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Ref</th>
                                <th>Categoría</th>
                                <th>Costo</th>
                                <th>Precio</th>
                                <th>Margen</th>
                                <th>Stock</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <span style={{ marginRight: '0.5rem' }}>{p.icon || categoryIcons[p.category]}</span>
                                        <strong>{p.name}</strong>
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{p.ref}</td>
                                    <td>{categoryLabels[p.category]}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCOP(Number(p.wholesalePrice))}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatCOP(Number(p.retailPrice))}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', color: '#27ae60' }}>
                                        {calcMargin(Number(p.retailPrice), Number(p.wholesalePrice)).toFixed(1)}%
                                    </td>
                                    <td>
                                        <span className={`stock-badge ${stockBadge(p)}`}>
                                            {p.stock} / {p.minStock}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️</button>
                                        {' '}
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.name)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Add/Edit Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editId ? '✏️ Editar Producto' : '✨ Nuevo Producto'}</h2>

                        <div className="page-form">
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>REFERENCIA *</label>
                                    <input name="ref" value={form.ref} onChange={handleChange} placeholder="CAN-001" />
                                </div>
                                <div className="form-group">
                                    <label>CATEGORÍA *</label>
                                    <select name="category" value={form.category} onChange={handleChange}>
                                        {Object.entries(categoryLabels).map(([k, v]) => (
                                            <option key={k} value={k}>{categoryIcons[k]} {v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>NOMBRE DEL PRODUCTO *</label>
                                <input name="name" value={form.name} onChange={handleChange} placeholder="Candongas Mariposa" />
                            </div>

                            <div className="form-group">
                                <label>ÍCONO (emoji)</label>
                                <input name="icon" value={form.icon} onChange={handleChange} placeholder="🦋" style={{ maxWidth: '8rem' }} />
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>COSTO MAYORISTA * (COP)</label>
                                    <input name="wholesalePrice" type="number" value={form.wholesalePrice} onChange={handleChange} placeholder="22000" />
                                </div>
                                <div className="form-group">
                                    <label>PRECIO DE VENTA * (COP)</label>
                                    <input name="retailPrice" type="number" value={form.retailPrice} onChange={handleChange} placeholder="60000" />
                                </div>
                            </div>

                            {form.wholesalePrice && form.retailPrice && (
                                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(39,174,96,0.06)', borderRadius: 8, fontSize: '0.82rem', color: '#27ae60' }}>
                                    💎 Ganancia: {formatCOP(Number(form.retailPrice) - Number(form.wholesalePrice))} por unidad
                                    ({calcMargin(Number(form.retailPrice), Number(form.wholesalePrice)).toFixed(1)}% margen)
                                </div>
                            )}

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>STOCK ACTUAL</label>
                                    <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="0" />
                                </div>
                                <div className="form-group">
                                    <label>STOCK MÍNIMO</label>
                                    <input name="minStock" type="number" value={form.minStock} onChange={handleChange} placeholder="3" />
                                </div>
                            </div>

                            {error && (
                                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(231,76,60,0.08)', borderRadius: 8, fontSize: '0.82rem', color: '#c0392b' }}>
                                    ⚠️ {error}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando...' : (editId ? 'Guardar Cambios' : 'Agregar Producto')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
