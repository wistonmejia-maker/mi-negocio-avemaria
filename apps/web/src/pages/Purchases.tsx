// Mi Negocio AVEMARÍA — Purchases Page (with New Purchase form)

import { useEffect, useState } from 'react';
import api from '../lib/api';
import { formatCOP, paymentLabels, categoryIcons } from '../utils/format';
import type { Purchase, Product } from '../types';
import './shared.css';

interface PurchaseItem {
    productId: string;
    quantity: number;
    unitCost: number;
}

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);

    // New Purchase Modal
    const [showModal, setShowModal] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [shippingCost, setShippingCost] = useState('0');
    const [paymentMethod, setPaymentMethod] = useState('NEQUI');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchPurchases = () => {
        api.get('/purchases')
            .then((res) => setPurchases(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPurchases(); }, []);

    const openNew = () => {
        setItems([]);
        setOrderNumber('');
        setShippingCost('0');
        setPaymentMethod('NEQUI');
        setNotes('');
        setError('');
        api.get('/products').then((res) => setProducts(res.data.data)).catch(console.error);
        setShowModal(true);
    };

    const addItem = () => {
        if (!selectedProduct) return;
        const prod = products.find((p) => p.id === selectedProduct);
        if (!prod) return;
        const existing = items.find((i) => i.productId === selectedProduct);
        if (existing) {
            setItems(items.map((i) => i.productId === selectedProduct ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setItems([...items, { productId: prod.id, quantity: 1, unitCost: Number(prod.wholesalePrice) }]);
        }
        setSelectedProduct('');
    };

    const removeItem = (productId: string) => {
        setItems(items.filter((i) => i.productId !== productId));
    };

    const updateItemQty = (productId: string, qty: number) => {
        if (qty < 1) return;
        setItems(items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
    };

    const updateItemCost = (productId: string, cost: number) => {
        setItems(items.map((i) => i.productId === productId ? { ...i, unitCost: cost } : i));
    };

    const subtotal = items.reduce((s, i) => s + i.unitCost * i.quantity, 0);
    const total = subtotal + Number(shippingCost || 0);
    const totalUnits = items.reduce((s, i) => s + i.quantity, 0);

    const handleSubmit = async () => {
        if (items.length === 0) { setError('Agrega al menos un producto'); return; }
        setSaving(true);
        setError('');
        try {
            await api.post('/purchases', {
                orderNumber: orderNumber || undefined,
                shippingCost: Number(shippingCost || 0),
                paymentMethod,
                notes: notes || undefined,
                items: items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    unitCost: i.unitCost,
                })),
            });
            setShowModal(false);
            fetchPurchases();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al registrar');
        } finally {
            setSaving(false);
        }
    };

    const getProductName = (id: string) => products.find((p) => p.id === id);

    return (
        <div>
            <div className="page-header">
                <h1>🛒 Compras a AVEMARÍA</h1>
                <button className="btn btn-primary" onClick={openNew}>+ Registrar Compra</button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="empty-state"><p>Cargando...</p></div>
                ) : purchases.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🛒</div>
                        <p>No hay compras registradas</p>
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openNew}>+ Registrar Compra</button>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th># Pedido</th>
                                <th>Productos</th>
                                <th>Envío</th>
                                <th>Total</th>
                                <th>Pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                        {new Date(p.purchasedAt).toLocaleDateString('es-CO')}
                                    </td>
                                    <td>{p.orderNumber || '—'}</td>
                                    <td>
                                        {p.items.map((item) => (
                                            <div key={item.id} style={{ fontSize: '0.82rem' }}>
                                                {item.product?.name || 'Producto'} × {item.quantity}
                                            </div>
                                        ))}
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCOP(Number(p.shippingCost))}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatCOP(Number(p.totalCost))}</td>
                                    <td>{paymentLabels[p.paymentMethod] || p.paymentMethod}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── New Purchase Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <h2>📦 Registrar Compra a AVEMARÍA</h2>

                        <div className="page-form">
                            {/* Product picker */}
                            <div className="form-group">
                                <label>AGREGAR PRODUCTO</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <select
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: '0.85rem', padding: '0.6rem', borderRadius: 10, border: '1px solid rgba(201,169,110,0.25)' }}
                                    >
                                        <option value="">Seleccionar producto...</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.icon || categoryIcons[p.category]} {p.name} — {p.ref}
                                            </option>
                                        ))}
                                    </select>
                                    <button className="btn btn-primary" onClick={addItem} disabled={!selectedProduct}>+</button>
                                </div>
                            </div>

                            {/* Items list */}
                            {items.length > 0 && (
                                <div style={{ border: '1px solid rgba(201,169,110,0.15)', borderRadius: 12, overflow: 'hidden' }}>
                                    <table className="data-table" style={{ margin: 0 }}>
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Cant.</th>
                                                <th>Costo unit.</th>
                                                <th>Subtotal</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item) => {
                                                const prod = getProductName(item.productId);
                                                return (
                                                    <tr key={item.productId}>
                                                        <td>
                                                            {prod?.icon || '✨'} {prod?.name || 'Producto'}
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItemQty(item.productId, Number(e.target.value))}
                                                                style={{ width: '60px', textAlign: 'center', padding: '0.3rem', borderRadius: 6, border: '1px solid rgba(201,169,110,0.25)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                                                                min={1}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.unitCost}
                                                                onChange={(e) => updateItemCost(item.productId, Number(e.target.value))}
                                                                style={{ width: '90px', textAlign: 'right', padding: '0.3rem', borderRadius: 6, border: '1px solid rgba(201,169,110,0.25)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                                                            />
                                                        </td>
                                                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                                                            {formatCOP(item.unitCost * item.quantity)}
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.productId)}>✕</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Order details */}
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label># PEDIDO</label>
                                    <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ORD-001 (opcional)" />
                                </div>
                                <div className="form-group">
                                    <label>COSTO DE ENVÍO (COP)</label>
                                    <input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="12000" />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>MEDIO DE PAGO</label>
                                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                        {Object.entries(paymentLabels).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>NOTAS</label>
                                    <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="(opcional)" />
                                </div>
                            </div>

                            {/* Total */}
                            {items.length > 0 && (
                                <div style={{ background: 'rgba(26,23,20,0.04)', borderRadius: 12, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gris)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            {totalUnits} product{totalUnits > 1 ? 'os' : 'o'} + envío
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--ink3)', marginTop: 2 }}>
                                            Subtotal: {formatCOP(subtotal)} + Envío: {formatCOP(Number(shippingCost || 0))}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--negro)' }}>
                                        {formatCOP(total)}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(231,76,60,0.08)', borderRadius: 8, fontSize: '0.82rem', color: '#c0392b' }}>
                                    ⚠️ {error}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || items.length === 0}>
                                {saving ? 'Registrando...' : `Registrar Compra (${formatCOP(total)})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
