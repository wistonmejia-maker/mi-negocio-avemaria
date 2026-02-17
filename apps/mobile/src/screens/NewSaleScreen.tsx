// Mi Negocio AVEMARÍA — New Sale Screen (Mobile)

import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { colors, formatCOP, categoryIcons } from '../theme';
import api from '../api';

interface Product {
    id: string; ref: string; name: string; category: string;
    icon: string | null; wholesalePrice: number; retailPrice: number; stock: number;
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function NewSaleScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/products').then((res) => setProducts(res.data.data)).catch(console.error);
    }, []);

    const addToCart = (p: Product) => {
        const existing = cart.find((c) => c.product.id === p.id);
        if (existing) {
            if (existing.quantity >= p.stock) return;
            setCart(cart.map((c) => c.product.id === p.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            if (p.stock <= 0) return;
            setCart([...cart, { product: p, quantity: 1 }]);
        }
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter((c) => c.product.id !== id));
    };

    const total = cart.reduce((s, c) => s + Number(c.product.retailPrice) * c.quantity, 0);
    const profit = cart.reduce((s, c) => s + (Number(c.product.retailPrice) - Number(c.product.wholesalePrice)) * c.quantity, 0);

    const handleSubmit = async () => {
        if (cart.length === 0) return;
        setSaving(true);
        try {
            await api.post('/sales', {
                channel: 'WHATSAPP',
                paymentMethod: 'NEQUI',
                items: cart.map((c) => ({
                    productId: c.product.id,
                    quantity: c.quantity,
                    unitRevenue: Number(c.product.retailPrice),
                })),
            });
            Alert.alert('✅ Venta registrada', `Total: ${formatCOP(total)}\nGanancia: +${formatCOP(profit)}`);
            setCart([]);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'No se pudo registrar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Cart summary */}
            {cart.length > 0 && (
                <View style={styles.cartBar}>
                    <View>
                        <Text style={styles.cartTotal}>{formatCOP(total)}</Text>
                        <Text style={styles.cartProfit}>+{formatCOP(profit)} ganancia</Text>
                    </View>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                        <Text style={styles.submitText}>{saving ? '...' : `VENDER (${cart.length})`}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Cart items */}
            {cart.length > 0 && (
                <ScrollView horizontal style={styles.cartScroll} showsHorizontalScrollIndicator={false}>
                    {cart.map((c) => (
                        <TouchableOpacity key={c.product.id} style={styles.cartChip} onPress={() => removeFromCart(c.product.id)}>
                            <Text style={styles.cartChipText}>
                                {c.product.icon || '✨'} {c.product.name} ×{c.quantity} ✕
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Product list */}
            <FlatList
                data={products.filter((p) => p.stock > 0)}
                keyExtractor={(p) => p.id}
                renderItem={({ item: p }) => (
                    <TouchableOpacity style={styles.productRow} onPress={() => addToCart(p)}>
                        <Text style={styles.productIcon}>{p.icon || categoryIcons[p.category] || '✨'}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.productName}>{p.name}</Text>
                            <Text style={styles.productMeta}>{p.ref} · Stock: {p.stock}</Text>
                        </View>
                        <Text style={styles.productPrice}>{formatCOP(Number(p.retailPrice))}</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 120 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },

    cartBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        margin: 16, padding: 16, borderRadius: 16,
        backgroundColor: colors.ink,
    },
    cartTotal: { fontSize: 20, fontWeight: '600', color: colors.gold },
    cartProfit: { fontSize: 11, color: colors.green2, marginTop: 2 },
    submitBtn: { backgroundColor: colors.gold, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    submitText: { color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 1 },

    cartScroll: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 40 },
    cartChip: {
        backgroundColor: colors.goldBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
        marginRight: 8, borderWidth: 1, borderColor: colors.gold3,
    },
    cartChipText: { fontSize: 12, color: colors.ink2 },

    productRow: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 16, marginBottom: 4, padding: 14,
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: colors.border,
    },
    productIcon: { fontSize: 22, marginRight: 12 },
    productName: { fontSize: 14, fontWeight: '500', color: colors.ink },
    productMeta: { fontSize: 11, color: colors.ink3, marginTop: 2 },
    productPrice: { fontSize: 14, fontWeight: '600', color: colors.ink },
});
