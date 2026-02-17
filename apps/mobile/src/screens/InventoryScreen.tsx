// Mi Negocio AVEMARÍA — Inventory Screen (Mobile)

import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TextInput, StyleSheet, RefreshControl,
} from 'react-native';
import { colors, formatCOP, categoryIcons } from '../theme';
import api from '../api';

interface Product {
    id: string;
    ref: string;
    name: string;
    category: string;
    icon: string | null;
    wholesalePrice: number;
    retailPrice: number;
    stock: number;
    minStock: number;
}

export default function InventoryScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const load = () => {
        const params = search ? `?search=${search}` : '';
        api.get(`/products${params}`)
            .then((res) => setProducts(res.data.data))
            .catch(console.error)
            .finally(() => setRefreshing(false));
    };

    useEffect(() => { load(); }, [search]);

    const stockColor = (p: Product) => {
        if (p.stock <= 0) return colors.red2;
        if (p.stock <= p.minStock) return '#e67e22';
        return colors.green2;
    };

    const renderProduct = ({ item: p }: { item: Product }) => (
        <View style={styles.row}>
            <Text style={styles.icon}>{p.icon || categoryIcons[p.category] || '✨'}</Text>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.ref}>{p.ref} · {formatCOP(Number(p.retailPrice))}</Text>
            </View>
            <View style={[styles.stockBadge, { backgroundColor: `${stockColor(p)}15` }]}>
                <Text style={[styles.stockText, { color: stockColor(p) }]}>{p.stock}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar producto..."
                placeholderTextColor={colors.ink4}
                value={search}
                onChangeText={setSearch}
            />
            <FlatList
                data={products}
                keyExtractor={(p) => p.id}
                renderItem={renderProduct}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    searchInput: {
        margin: 16, padding: 12, borderRadius: 12,
        backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border,
        fontSize: 14, color: colors.ink,
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 16, marginBottom: 4, padding: 14,
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: colors.border,
    },
    icon: { fontSize: 22, marginRight: 12 },
    name: { fontSize: 14, fontWeight: '500', color: colors.ink },
    ref: { fontSize: 11, color: colors.ink3, marginTop: 2 },
    stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    stockText: { fontSize: 13, fontWeight: '600' },
});
