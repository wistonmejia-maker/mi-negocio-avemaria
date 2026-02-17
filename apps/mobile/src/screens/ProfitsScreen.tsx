// Mi Negocio AVEMARÍA — Profits Screen (Mobile)

import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, RefreshControl,
} from 'react-native';
import { colors, formatCOP, formatPercent } from '../theme';
import api from '../api';

interface Summary {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    margin: number;
}

const expenseLabels: Record<string, string> = {
    COMPRA_AVEMARIA: 'Compras AVEMARÍA',
    ENVIOS: 'Envíos',
    EMPAQUES: 'Empaques',
    PUBLICIDAD: 'Publicidad',
    OTRO: 'Otro',
    GANANCIA: 'Tu ganancia',
};

const barColors = ['#C8A96E', '#e74c3c', '#3498db', '#f39c12', '#95a5a6', '#27ae60'];

export default function ProfitsScreen() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [perPeso, setPerPeso] = useState<Array<{ category: string; per100: number }>>([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = () => {
        Promise.all([
            api.get('/accounting/summary'),
            api.get('/accounting/per-peso'),
        ]).then(([sumRes, perRes]) => {
            setSummary(sumRes.data.data);
            setPerPeso(perRes.data.data.perHundred || []);
        }).catch(console.error)
            .finally(() => setRefreshing(false));
    };

    useEffect(() => { load(); }, []);

    if (!summary) {
        return <View style={styles.loading}><Text style={styles.loadingText}>Cargando...</Text></View>;
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
        >
            {/* Profit Banner */}
            <View style={styles.banner}>
                <Text style={styles.bannerLabel}>GANANCIA TOTAL</Text>
                <Text style={styles.bannerAmount}>{formatCOP(summary.netProfit)}</Text>
                <View style={styles.bannerRow}>
                    <View>
                        <Text style={styles.bannerStatValue}>{formatPercent(summary.margin)}</Text>
                        <Text style={styles.bannerStatLabel}>MARGEN</Text>
                    </View>
                    <View>
                        <Text style={styles.bannerStatValue}>{formatCOP(summary.totalIncome)}</Text>
                        <Text style={styles.bannerStatLabel}>INGRESOS</Text>
                    </View>
                </View>
            </View>

            {/* Per $100 Breakdown */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>💰 DE CADA $100 QUE COBRAS</Text>
                {perPeso.map((item, i) => {
                    const isProfit = item.category === 'GANANCIA';
                    return (
                        <View key={item.category} style={[styles.perRow, isProfit && styles.perRowProfit]}>
                            <View style={[styles.dot, { backgroundColor: isProfit ? colors.green2 : barColors[i % barColors.length] }]} />
                            <Text style={[styles.perLabel, isProfit && { color: colors.green2, fontWeight: '600' }]}>
                                {expenseLabels[item.category] || item.category}
                            </Text>
                            <Text style={[styles.perValue, { color: isProfit ? colors.green2 : colors.red2 }]}>
                                ${item.per100.toFixed(1)}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* Summary */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 RESUMEN</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total ingresos</Text>
                    <Text style={[styles.summaryValue, { color: colors.green2 }]}>{formatCOP(summary.totalIncome)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total gastos</Text>
                    <Text style={[styles.summaryValue, { color: colors.red2 }]}>{formatCOP(summary.totalExpense)}</Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingTop: 12 }]}>
                    <Text style={[styles.summaryLabel, { fontWeight: '600', fontSize: 15 }]}>Ganancia neta</Text>
                    <Text style={[styles.summaryValue, { fontWeight: '600', fontSize: 18 }]}>{formatCOP(summary.netProfit)}</Text>
                </View>
            </View>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
    loadingText: { color: colors.ink3, fontSize: 14 },

    banner: { margin: 16, padding: 24, borderRadius: 20, backgroundColor: colors.ink },
    bannerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 2 },
    bannerAmount: { fontSize: 34, fontWeight: '500', color: colors.gold, marginTop: 4 },
    bannerRow: { flexDirection: 'row', gap: 32, marginTop: 20 },
    bannerStatValue: { fontSize: 16, fontWeight: '500', color: '#fff' },
    bannerStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginTop: 2 },

    card: {
        marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff',
        borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border,
    },
    cardTitle: { fontSize: 11, fontWeight: '600', color: colors.ink3, letterSpacing: 1.5, marginBottom: 14 },

    perRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    perRowProfit: { backgroundColor: colors.greenBg, borderRadius: 10, paddingHorizontal: 8, marginTop: 8, borderBottomWidth: 0 },
    dot: { width: 10, height: 10, borderRadius: 3, marginRight: 10 },
    perLabel: { flex: 1, fontSize: 14, color: colors.ink },
    perValue: { fontSize: 14, fontWeight: '600' },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    summaryLabel: { fontSize: 14, color: colors.ink },
    summaryValue: { fontSize: 15, fontWeight: '500', color: colors.ink },
});
