// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\RecapScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Recap = {
    month: string;
    monthCode: string; // Add monthCode
    onTime: number;
    late: number;
    off: number;
    holiday: number;
};

type MonthCardProps = {
    data: Recap;
    isFirst: boolean;
    onPress: () => void;
};

const MonthCard = ({ data, isFirst, onPress }: MonthCardProps) => {
    const total = data.onTime + data.late + data.off + data.holiday || 1;
    const attendanceRate = ((data.onTime / total) * 100).toFixed(1);

    return (
        <TouchableOpacity
            style={[styles.monthCard, isFirst && styles.monthCardHighlight]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {isFirst && (
                <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Bulan Ini</Text>
                </View>
            )}

            <View style={styles.monthHeader}>
                <View style={styles.monthInfo}>
                    <MaterialCommunityIcons
                        name="calendar-month"
                        size={24}
                        color={isFirst ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.monthTitle, isFirst && styles.monthTitleHighlight]}>
                        {data.month}
                    </Text>
                </View>
                <View style={styles.rateWrapper}>
                    <Text style={[styles.rateValue, isFirst && styles.rateValueHighlight]}>
                        {attendanceRate}%
                    </Text>
                    <Text style={styles.rateLabel}>Kehadiran</Text>
                </View>
            </View>

            <View style={styles.progressWrapper}>
                <ProgressBar
                    progress={data.onTime / total}
                    color={colors.success}
                    style={styles.progressBar}
                />
            </View>

            <View style={styles.statsGrid}>
                <StatItem
                    label="Tepat Waktu"
                    value={data.onTime}
                    color={colors.success}
                    icon="check-circle"
                />
                <StatItem
                    label="Terlambat"
                    value={data.late}
                    color={colors.warning}
                    icon="clock-alert"
                />
                <StatItem
                    label="Cuti/Libur"
                    value={data.off}
                    color={colors.textMuted}
                    icon="beach"
                />
                <StatItem
                    label="Hari Libur"
                    value={data.holiday}
                    color={colors.error}
                    icon="calendar-remove"
                />
            </View>
        </TouchableOpacity>
    );
};

type StatItemProps = {
    label: string;
    value: number;
    color: string;
    icon: string;
};

const StatItem = ({ label, value, color, icon }: StatItemProps) => (
    <View style={styles.statItem}>
        <View style={[styles.statIconWrapper, { backgroundColor: `${color}15` }]}>
            <MaterialCommunityIcons name={icon as any} size={18} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

export default function RecapScreen() {
    const navigation = useNavigation();
    const [data, setData] = useState<Recap[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRecap = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const { data: resp } = await axios.get(
                `${API_CONFIG.BASE_URL}${ENDPOINTS.RECAP}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setData(resp);
        } catch (e) {
            console.warn('Recap fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRecap();
    }, [fetchRecap]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRecap();
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Memuat rekap kehadiran...</Text>
            </View>
        );
    }

    // Calculate total stats
    const totalStats = data.reduce(
        (acc, curr) => ({
            onTime: acc.onTime + curr.onTime,
            late: acc.late + curr.late,
            off: acc.off + curr.off,
            holiday: acc.holiday + curr.holiday,
        }),
        { onTime: 0, late: 0, off: 0, holiday: 0 }
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rekap Kehadiran</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <MaterialCommunityIcons name="chart-arc" size={28} color={colors.primary} />
                        <Text style={styles.summaryTitle}>Total 6 Bulan Terakhir</Text>
                    </View>
                    <View style={styles.summaryStats}>
                        <View style={styles.summaryStatItem}>
                            <Text style={[styles.summaryValue, { color: colors.success }]}>
                                {totalStats.onTime}
                            </Text>
                            <Text style={styles.summaryLabel}>Tepat Waktu</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryStatItem}>
                            <Text style={[styles.summaryValue, { color: colors.warning }]}>
                                {totalStats.late}
                            </Text>
                            <Text style={styles.summaryLabel}>Terlambat</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryStatItem}>
                            <Text style={[styles.summaryValue, { color: colors.textMuted }]}>
                                {totalStats.off + totalStats.holiday}
                            </Text>
                            <Text style={styles.summaryLabel}>Libur</Text>
                        </View>
                    </View>
                </View>

                {/* Monthly Data */}
                <Text style={styles.sectionTitle}>Riwayat Bulanan</Text>

                {data.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="calendar-blank" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Belum ada data rekap</Text>
                    </View>
                ) : (
                    data.map((item, index) => (
                        <MonthCard
                            key={item.month}
                            data={item}
                            isFirst={index === 0}
                            onPress={() => navigation.navigate('RecapDetail', { month: item.month, monthCode: item.monthCode } as any)}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.textSecondary,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    placeholder: {
        width: 40,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.md,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    summaryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: '700',
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: colors.divider,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    monthCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    monthCardHighlight: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    currentBadge: {
        position: 'absolute',
        top: -10,
        right: spacing.md,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    currentBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    monthInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    monthTitleHighlight: {
        color: colors.primary,
    },
    rateWrapper: {
        alignItems: 'flex-end',
    },
    rateValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.success,
    },
    rateValueHighlight: {
        color: colors.primary,
    },
    rateLabel: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    progressWrapper: {
        marginBottom: spacing.md,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.divider,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    statLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyText: {
        marginTop: spacing.md,
        fontSize: 14,
        color: colors.textMuted,
    },
});