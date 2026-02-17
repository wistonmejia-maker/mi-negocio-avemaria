// Mi Negocio AVEMARÍA — Dashboard Screen (Mobile)

import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, RefreshControl,
} from 'react-native';
import { colors, formatCOP, formatPercent, channelConfig } from '../theme';
import api from '../api';

interface DashboardData {
    totalRevenue: number;
    totalProfit: number;
    profitMargin: number;
    totalPaidToAvemaria: number;
    unitsSold: number;
    lowStockProducts: Array<{ id: string; ref: string; name: string; icon: string | null; stock: number; minStock: number }>;
    revenueByChannel: { whatsapp: number; instagram: number; presencial: number };
    topProducts: Array<{ product: { id: string; name: string; icon: string | null }; totalProfit: number; totalQuantity: number }>;
}

export default function DashboardScreen() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = () => {
        api.get('/dashboard')
            .then((res) => setData(res.data.data))
            .catch(console.error)
            .finally(() => setRefreshing(false));
    };

    useEffect(() => { load(); }, []);

    if (!data) {
        return (
            <View style={styles.loading}>
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
        >
            {/* Profit Banner */}
            <View style={styles.banner}>
                <Text style={styles.bannerLabel}>GANANCIA DEL MES</Text>
                <Text style={styles.bannerAmount}>{formatCOP(data.totalProfit)}</Text>
                <View style={styles.bannerStats}>
                    <View style={styles.bannerStat}>
                        <Text style={styles.bannerStatValue}>{formatCOP(data.totalRevenue)}</Text>
                        <Text style={styles.bannerStatLabel}>INGRESOS</Text>
                    </View>
                    <View style={styles.bannerStat}>
                        <Text style={styles.bannerStatValue}>{formatPercent(data.profitMargin)}</Text>
                        <Text style={styles.bannerStatLabel}>MARGEN</Text>
                    </View>
                    <View style={styles.bannerStat}>
                        <Text style={styles.bannerStatValue}>{data.unitsSold}</Text>
                        <Text style={styles.bannerStatLabel}>UNIDADES</Text>
                    </View>
                </View>
            </View>

            {/* Low Stock */}
            {data.lowStockProducts.length > 0 && (
                <View style={styles.alertBox}>
                    <Text style={styles.alertTitle}>⚠️ Stock bajo — {data.lowStockProducts.length} productos</Text>
                    <View style={styles.pillRow}>
                        {data.lowStockProducts.map((p) => (
                            <View key={p.id} style={styles.pill}>
                                <Text style={styles.pillText}>{p.icon || '📦'} {p.ref} — {p.stock}/{p.minStock}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* KPI Row */}
            <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiIcon}>💰</Text>
                    <Text style={styles.kpiValue}>{formatCOP(data.totalRevenue)}</Text>
                    <Text style={styles.kpiLabel}>VENTAS</Text>
                </View>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiIcon}>📦</Text>
                    <Text style={styles.kpiValue}>{data.unitsSold}</Text>
                    <Text style={styles.kpiLabel}>VENDIDAS</Text>
                </View>
            </View>

            {/* Channels */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📱 VENTAS POR CANAL</Text>
                {Object.entries(data.revenueByChannel).map(([key, value]) => {
                    const config = channelConfig[key.toUpperCase()];
                    return (
                        <View key={key} style={styles.channelRow}>
                            <View style={[styles.channelDot, { backgroundColor: config?.color }]} />
                            <Text style={styles.channelName}>{config?.label || key}</Text>
                            <Text style={styles.channelValue}>{formatCOP(value)}</Text>
                        </View>
                    );
                })}
            </View>

            {/* Top Products */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>🏆 TOP PRODUCTOS</Text>
                {data.topProducts.map((p, i) => (
                    <View key={p.product.id} style={styles.topRow}>
                        <Text style={styles.topRank}>#{i + 1}</Text>
                        <Text style={styles.topIcon}>{p.product.icon || '✨'}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.topName}>{p.product.name}</Text>
                            <Text style={styles.topQty}>{p.totalQuantity} unidades</Text>
                        </View>
                        <Text style={styles.topProfit}>+{formatCOP(p.totalProfit)}</Text>
                    </View>
                ))}
            </View>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
    loadingText: { color: colors.ink3, fontSize: 14 },

    banner: {
        margin: 16, padding: 24, borderRadius: 20,
        backgroundColor: colors.ink,
    },
    bannerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 6 },
    bannerAmount: { fontSize: 34, fontWeight: '500', color: colors.gold },
    bannerStats: { flexDirection: 'row', marginTop: 20, gap: 24 },
    bannerStat: {},
    bannerStatValue: { fontSize: 16, fontWeight: '500', color: '#fff' },
    bannerStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginTop: 2 },

    alertBox: {
        marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 12,
        backgroundColor: colors.redBg, borderWidth: 1, borderColor: 'rgba(231,76,60,0.12)',
    },
    alertTitle: { fontSize: 13, fontWeight: '600', color: colors.red2, marginBottom: 8 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(231,76,60,0.08)' },
    pillText: { fontSize: 11, color: colors.red2 },

    kpiRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
    kpiCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: colors.border,
    },
    kpiIcon: { fontSize: 22, marginBottom: 8 },
    kpiValue: { fontSize: 18, fontWeight: '600', color: colors.ink },
    kpiLabel: { fontSize: 9, color: colors.ink3, letterSpacing: 1.5, marginTop: 4 },

    card: {
        marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff',
        borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border,
    },
    cardTitle: { fontSize: 11, fontWeight: '600', color: colors.ink3, letterSpacing: 1.5, marginBottom: 14 },

    channelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    channelDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    channelName: { flex: 1, fontSize: 14, color: colors.ink },
    channelValue: { fontSize: 14, fontWeight: '500', color: colors.ink },

    topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    topRank: { fontSize: 12, fontWeight: '600', color: colors.gold, width: 24 },
    topIcon: { fontSize: 18, marginRight: 10 },
    topName: { fontSize: 14, fontWeight: '500', color: colors.ink },
    topQty: { fontSize: 11, color: colors.ink3, marginTop: 2 },
    topProfit: { fontSize: 14, fontWeight: '500', color: colors.green2 },
});
