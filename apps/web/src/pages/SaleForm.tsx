// Mi Negocio AVEMARÍA — Sale Form Page

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { formatCOP } from '../utils/format';
import type { Product, Customer } from '../types';
import './shared.css';

interface CartItem {
    product: Product;
    quantity: number;
    unitRevenue: number;
}

export default function SaleFormPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [channel, setChannel] = useState<string>('WHATSAPP');
    const [paymentMethod, setPaymentMethod] = useState<string>('NEQUI');
    const [notes, setNotes] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const filteredProducts = products.filter((p) => {
        if (p.stock <= 0) return false;
        if (!productSearch) return true;
        const q = productSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q);
    });

    useEffect(() => {
        Promise.all([
            api.get('/products'),
            api.get('/customers'),
        ]).then(([prodRes, custRes]) => {
            setProducts(prodRes.data.data);
            setCustomers(custRes.data.data);
        });
    }, []);

    const addToCart = (product: Product) => {
        const existing = cart.find((c) => c.product.id === product.id);
        if (existing) {
            setCart(cart.map((c) =>
                c.product.id === product.id
                    ? { ...c, quantity: c.quantity + 1 }
                    : c,
            ));
        } else {
            setCart([...cart, { product, quantity: 1, unitRevenue: Number(product.retailPrice) }]);
        }
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter((c) => c.product.id !== productId));
    };

    const updateQuantity = (productId: string, qty: number) => {
        if (qty <= 0) return removeFromCart(productId);
        setCart(cart.map((c) =>
            c.product.id === productId ? { ...c, quantity: qty } : c,
        ));
    };

    const totalRevenue = cart.reduce((sum, c) => sum + c.unitRevenue * c.quantity, 0);
    const totalCost = cart.reduce((sum, c) => sum + Number(c.product.wholesalePrice) * c.quantity, 0);
    const netProfit = totalRevenue - totalCost;

    const handleSubmit = async () => {
        if (cart.length === 0) return;
        setSaving(true);
        setError('');

        try {
            await api.post('/sales', {
                customerId: customerId || undefined,
                channel,
                paymentMethod,
                notes: notes || undefined,
                items: cart.map((c) => ({
                    productId: c.product.id,
                    quantity: c.quantity,
                    unitRevenue: c.unitRevenue,
                })),
            });
            navigate('/historial');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al registrar la venta');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>💰 Registrar Venta</h1>
            </div>

            <div className="grid-2">
                {/* Product picker */}
                <div className="card">
                    <h3>Seleccionar productos</h3>
                    <input
                        className="filter-input"
                        placeholder="Buscar producto..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        style={{ width: '100%', marginBottom: '1rem' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflow: 'auto' }}>
                        {filteredProducts.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => addToCart(p)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.6rem 0.85rem',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(201,169,110,0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '0.85rem',
                                }}
                            >
                                <div>
                                    <span style={{ marginRight: '0.5rem' }}>{p.icon || '✨'}</span>
                                    <strong>{p.name}</strong>
                                    <span style={{ color: '#999', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                                        {p.ref}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatCOP(Number(p.retailPrice))}</span>
                                    <span className={`stock-badge ${p.stock <= p.minStock ? 'low' : 'ok'}`}>{p.stock}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart + sale details */}
                <div>
                    <div className="card">
                        <h3>🛍️ Carrito ({cart.length} items)</h3>
                        {cart.length === 0 ? (
                            <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>Selecciona productos para agregar</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {cart.map((c) => (
                                    <div key={c.product.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.5rem 0', borderBottom: '1px solid rgba(201,169,110,0.06)',
                                    }}>
                                        <span>{c.product.icon || '✨'}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{c.product.name}</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#999' }}>
                                                {formatCOP(c.unitRevenue)} c/u
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <button className="btn btn-sm btn-secondary" onClick={() => updateQuantity(c.product.id, c.quantity - 1)}>−</button>
                                            <span style={{ fontFamily: 'var(--font-mono)', minWidth: '24px', textAlign: 'center' }}>{c.quantity}</span>
                                            <button className="btn btn-sm btn-secondary" onClick={() => updateQuantity(c.product.id, c.quantity + 1)}>+</button>
                                        </div>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, minWidth: '80px', textAlign: 'right' }}>
                                            {formatCOP(c.unitRevenue * c.quantity)}
                                        </span>
                                        <button className="btn btn-sm btn-danger" onClick={() => removeFromCart(c.product.id)}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Totals */}
                        {cart.length > 0 && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid rgba(201,169,110,0.15)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                    <span style={{ color: '#999', fontSize: '0.82rem' }}>Total venta</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '1.1rem' }}>{formatCOP(totalRevenue)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#999', fontSize: '0.82rem' }}>Ganancia</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: '#27ae60' }}>+{formatCOP(netProfit)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sale details */}
                    <div className="card">
                        <h3>Detalles de la venta</h3>
                        <div className="page-form">
                            <div className="form-group">
                                <label>Clienta</label>
                                <select className="filter-select" value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ width: '100%' }}>
                                    <option value="">Sin asignar</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Canal</label>
                                    <select className="filter-select" value={channel} onChange={(e) => setChannel(e.target.value)} style={{ width: '100%' }}>
                                        <option value="WHATSAPP">💬 WhatsApp</option>
                                        <option value="INSTAGRAM">📸 Instagram</option>
                                        <option value="PRESENCIAL">🏬 Presencial</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Método de pago</label>
                                    <select className="filter-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%' }}>
                                        <option value="NEQUI">Nequi</option>
                                        <option value="DAVIPLATA">Daviplata</option>
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="EFECTIVO">Efectivo</option>
                                        <option value="CONTRA_ENTREGA">Contra entrega</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notas (opcional)</label>
                                <textarea className="filter-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ width: '100%', resize: 'vertical' }} />
                            </div>
                        </div>

                        {error && <div style={{ color: '#c0392b', fontSize: '0.85rem', marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(231,76,60,0.06)', borderRadius: '8px' }}>{error}</div>}

                        <div style={{ marginTop: '1.25rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={saving || cart.length === 0}
                                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                            >
                                {saving ? 'Registrando...' : `Registrar Venta — ${formatCOP(totalRevenue)}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
