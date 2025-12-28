// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\PointsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type PunishmentItem = {
    reason: string;
    pointsDeducted: number;
    date?: string;
};

type PointsInfo = {
    totalPoints: number;
    punishments: PunishmentItem[];
};

type PunishmentCardProps = {
    item: PunishmentItem;
    index: number;
};

const PunishmentCard = ({ item, index }: PunishmentCardProps) => {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <View style={styles.punishmentCard}>
            <View style={styles.punishmentIndex}>
                <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.punishmentContent}>
                <Text style={styles.punishmentReason}>{item.reason}</Text>
                {item.date && (
                    <Text style={styles.punishmentDate}>{formatDate(item.date)}</Text>
                )}
            </View>
            <View style={styles.pointsBadge}>
                <MaterialCommunityIcons name="minus" size={14} color={colors.error} />
                <Text style={styles.pointsValue}>{item.pointsDeducted}</Text>
            </View>
        </View>
    );
};

export default function PointsScreen() {
    const navigation = useNavigation();
    const [info, setInfo] = useState<PointsInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPoints = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const { data } = await axios.get(
                `${API_CONFIG.BASE_URL}${ENDPOINTS.POINTS}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setInfo(data);
        } catch (e) {
            console.warn('Points fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPoints();
    }, [fetchPoints]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPoints();
    };

    const getStatusLevel = (points: number) => {
        if (points === 0) return { level: 'Excellent', color: colors.success, icon: 'star-circle' };
        if (points <= 10) return { level: 'Baik', color: colors.info, icon: 'check-circle' };
        if (points <= 25) return { level: 'Perhatian', color: colors.warning, icon: 'alert-circle' };
        return { level: 'Warning', color: colors.error, icon: 'close-circle' };
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Memuat data poin...</Text>
            </View>
        );
    }

    const status = getStatusLevel(info?.totalPoints || 0);

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
                <Text style={styles.headerTitle}>Poin & Punishment</Text>
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
                {/* Points Summary Card */}
                <View style={[styles.summaryCard, { borderColor: status.color }]}>
                    <View style={styles.summaryContent}>
                        <View style={[styles.statusIconWrapper, { backgroundColor: `${status.color}15` }]}>
                            <MaterialCommunityIcons
                                name={status.icon as any}
                                size={40}
                                color={status.color}
                            />
                        </View>
                        <View style={styles.pointsInfo}>
                            <Text style={styles.totalPointsLabel}>Total Poin Punishment</Text>
                            <Text style={[styles.totalPointsValue, { color: status.color }]}>
                                {info?.totalPoints || 0}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
                                <Text style={[styles.statusText, { color: status.color }]}>
                                    {status.level}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <MaterialCommunityIcons name="information" size={16} color={colors.info} />
                        <Text style={styles.infoText}>
                            Semakin rendah poin punishment, semakin baik kinerja Anda
                        </Text>
                    </View>
                </View>

                {/* Points Breakdown */}
                <View style={styles.breakdownCard}>
                    <View style={styles.breakdownHeader}>
                        <MaterialCommunityIcons name="scale-balance" size={20} color={colors.textPrimary} />
                        <Text style={styles.sectionTitle}>Aturan Poin</Text>
                    </View>
                    <View style={styles.rulesList}>
                        <View style={styles.ruleItem}>
                            <View style={[styles.ruleIcon, { backgroundColor: `${colors.warning}15` }]}>
                                <MaterialCommunityIcons name="clock-alert" size={16} color={colors.warning} />
                            </View>
                            <Text style={styles.ruleText}>Terlambat check-in: <Text style={styles.rulePoints}>+5 poin</Text></Text>
                        </View>
                        <View style={styles.ruleItem}>
                            <View style={[styles.ruleIcon, { backgroundColor: `${colors.error}15` }]}>
                                <MaterialCommunityIcons name="close-circle" size={16} color={colors.error} />
                            </View>
                            <Text style={styles.ruleText}>Tidak hadir tanpa izin: <Text style={styles.rulePoints}>+10 poin</Text></Text>
                        </View>
                        <View style={styles.ruleItem}>
                            <View style={[styles.ruleIcon, { backgroundColor: `${colors.error}15` }]}>
                                <MaterialCommunityIcons name="location-exit" size={16} color={colors.error} />
                            </View>
                            <Text style={styles.ruleText}>Pulang lebih awal: <Text style={styles.rulePoints}>+3 poin</Text></Text>
                        </View>
                    </View>
                </View>

                {/* Punishment History */}
                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.sectionTitle}>Riwayat Punishment</Text>
                        <Text style={styles.historyCount}>
                            {info?.punishments.length || 0} catatan
                        </Text>
                    </View>

                    {!info || info.punishments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrapper}>
                                <MaterialCommunityIcons name="trophy" size={48} color={colors.success} />
                            </View>
                            <Text style={styles.emptyTitle}>Keren! 🎉</Text>
                            <Text style={styles.emptyText}>
                                Anda tidak memiliki catatan punishment. Pertahankan kedisiplinan Anda!
                            </Text>
                        </View>
                    ) : (
                        info.punishments.map((p, i) => (
                            <PunishmentCard key={i} item={p} index={i} />
                        ))
                    )}
                </View>
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
        borderWidth: 2,
        ...shadows.md,
    },
    summaryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    statusIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.lg,
    },
    pointsInfo: {
        flex: 1,
    },
    totalPointsLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    totalPointsValue: {
        fontSize: 42,
        fontWeight: '700',
        lineHeight: 48,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginTop: spacing.xs,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: `${colors.info}10`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    breakdownCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    breakdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    rulesList: {
        // Items have marginBottom
    },
    ruleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    ruleIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ruleText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    rulePoints: {
        fontWeight: '600',
        color: colors.textPrimary,
    },
    historySection: {
        marginTop: spacing.sm,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    historyCount: {
        fontSize: 13,
        color: colors.textMuted,
    },
    emptyState: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        ...shadows.sm,
    },
    emptyIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${colors.success}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    punishmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    punishmentIndex: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.divider,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    indexText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    punishmentContent: {
        flex: 1,
    },
    punishmentReason: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    punishmentDate: {
        fontSize: 12,
        color: colors.textMuted,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.error}15`,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    pointsValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.error,
    },
});