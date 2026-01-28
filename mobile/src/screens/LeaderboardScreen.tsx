import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, RefreshControl } from 'react-native';
import { Text, Surface, Avatar, ActivityIndicator, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, shadows, borderRadius } from '../theme/theme';

interface EmployeeStats {
    id: number;
    name: string;
    photo: string | null;
    present: number;
    late: number;
    score: number;
    latePercentage: number;
}

interface OutletLeaderboard {
    branchName: string;
    best: EmployeeStats[];
    worst: EmployeeStats[];
}

export default function LeaderboardScreen() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<OutletLeaderboard[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/attendance/leaderboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error('Fetch leaderboard error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaderboard();
    };

    // Podium Component for Top 3
    const Podium = ({ employees }: { employees: EmployeeStats[] }) => {
        const [first, second, third] = employees;

        const PodiumItem = ({ item, rank, isCenter = false }: { item: EmployeeStats, rank: number, isCenter?: boolean }) => (
            <View style={[styles.podiumItem, isCenter && styles.podiumItemCenter]}>
                <View style={[styles.avatarContainer, isCenter && styles.avatarContainerCenter]}>
                    <Avatar.Image
                        size={isCenter ? 80 : 60}
                        source={item?.photo ? { uri: item.photo } : require('../../assets/logo.png')}
                        style={[
                            styles.podiumAvatar,
                            { borderColor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32' }
                        ]}
                    />
                    <View style={[
                        styles.rankBadge,
                        isCenter && styles.rankBadgeCenter,
                        { backgroundColor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32' }
                    ]}>
                        <Text style={styles.rankBadgeText}>{rank}</Text>
                    </View>
                    {rank === 1 && (
                        <MaterialCommunityIcons name="crown" size={24} color="#FFD700" style={styles.crownIcon} />
                    )}
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{item?.name || '-'}</Text>
                <Text style={styles.podiumScore}>{item?.score || 0} Poin</Text>
            </View>
        );

        return (
            <View style={styles.podiumContainer}>
                <View style={{ marginTop: 20 }}>
                    {second && <PodiumItem item={second} rank={2} />}
                </View>
                <View style={{ zIndex: 1, marginHorizontal: -10 }}>
                    {first && <PodiumItem item={first} rank={1} isCenter />}
                </View>
                <View style={{ marginTop: 20 }}>
                    {third && <PodiumItem item={third} rank={3} />}
                </View>
            </View>
        );
    };

    const RankItem = ({ item, rank, type }: { item: EmployeeStats, rank: number, type: 'best' | 'worst' }) => {
        const isBest = type === 'best';

        return (
            <Surface style={styles.rankItem} elevation={1}>
                {/* Header: Rank Left, Score Right */}
                <View style={styles.rankHeader}>
                    <View style={styles.rankIndex}>
                        <Text style={[styles.rankNumber, { color: isBest ? colors.textSecondary : colors.error }]}>#{rank}</Text>
                    </View>
                    <View style={[styles.scoreBadge, !isBest && { backgroundColor: '#FEF2F2', minWidth: 'auto' }]}>
                        <Text style={[styles.scoreValue, { fontSize: 12, color: isBest ? colors.primary : colors.error }]}>
                            {isBest ? item.score : item.late}
                        </Text>
                    </View>
                </View>

                {/* Center Content */}
                <Avatar.Image
                    size={48}
                    source={item.photo ? { uri: item.photo } : require('../../assets/logo.png')}
                    style={styles.listAvatar}
                />

                <Text style={styles.rankName} numberOfLines={1}>{item.name}</Text>

                {/* Footer Stats */}
                <View style={styles.statsRow}>
                    <Text style={styles.rankSub} numberOfLines={1}>
                        {isBest
                            ? `${item.present}H ${item.late}T`
                            : `${item.late}x (${item.latePercentage}%)`
                        }
                    </Text>
                </View>
            </Surface>
        );
    };


    const RankItemCompact = ({ item, rank, type }: { item: EmployeeStats, rank: number, type: 'best' | 'worst' }) => {
        const isBest = type === 'best';
        return (
            <View style={styles.rankItemCompact}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.rankBadgeSmall, { backgroundColor: isBest ? '#F0F9FF' : '#FEF2F2' }]}>
                        <Text style={[styles.rankTextSmall, { color: isBest ? colors.primary : colors.error }]}>#{rank}</Text>
                    </View>
                    <Avatar.Image
                        size={32}
                        source={item.photo ? { uri: item.photo } : require('../../assets/logo.png')}
                        style={styles.avatarSmall}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.nameSmall} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.scoreSmall}>
                            {isBest ? `${item.score} Poin` : `${item.late}x Telat`}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, '#EF4444', '#F87171']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Leaderboard</Text>
                <Text style={styles.headerSubtitle}>Performa Karyawan Bulan Ini</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    {data.map((outlet, index) => (
                        <View key={index} style={styles.outletSection}>
                            <View style={styles.outletHeader}>
                                <View style={styles.iconBox}>
                                    <MaterialCommunityIcons name="store" size={22} color={colors.primary} />
                                </View>
                                <Text style={styles.outletName}>{outlet.branchName}</Text>
                            </View>

                            {/* Split View Container */}
                            <View style={styles.splitContainer}>
                                {/* LEFT COLUMN: Top Performer */}
                                <View style={styles.leftColumn}>
                                    <Surface style={styles.columnSurface} elevation={2}>
                                        <View style={styles.sectionHeader}>
                                            <MaterialCommunityIcons name="trophy" size={16} color="#EAB308" />
                                            <Text style={styles.sectionTitle}>Top</Text>
                                        </View>

                                        {outlet.best.length > 0 ? (
                                            <>
                                                {/* Mini Podium for Top 3 */}
                                                <Podium employees={outlet.best.slice(0, 3)} />

                                                {/* List for 4+ */}
                                                {outlet.best.length > 3 && (
                                                    <View style={styles.verticalList}>
                                                        {outlet.best.slice(3).map((emp, i) => (
                                                            <RankItemCompact key={emp.id} item={emp} rank={i + 4} type="best" />
                                                        ))}
                                                    </View>
                                                )}
                                            </>
                                        ) : (
                                            <Text style={styles.emptyTextMini}>Belum ada data.</Text>
                                        )}
                                    </Surface>
                                </View>

                                {/* RIGHT COLUMN: Needs Coaching */}
                                <View style={styles.rightColumn}>
                                    <Surface style={[styles.columnSurface, styles.alertCard]} elevation={1}>
                                        <View style={styles.sectionHeader}>
                                            <MaterialCommunityIcons name="alert-rhombus" size={16} color={colors.error} />
                                            <Text style={[styles.sectionTitle, { color: colors.error }]}>Pembinaan</Text>
                                        </View>

                                        {outlet.worst.length > 0 ? (
                                            <View style={styles.verticalList}>
                                                {outlet.worst.map((emp, i) => (
                                                    <RankItemCompact key={emp.id} item={emp} rank={i + 1} type="worst" />
                                                ))}
                                            </View>
                                        ) : (
                                            <View style={styles.emptyStateMini}>
                                                <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.success} />
                                                <Text style={styles.emptyTextMaxi}>Semua Rajin!</Text>
                                            </View>
                                        )}
                                    </Surface>
                                </View>
                            </View>
                        </View>
                    ))}

                    {data.length === 0 && (
                        <Text style={styles.emptyText}>Tidak ada data leaderboard bulan ini.</Text>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' }, // Slate 50
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        marginTop: 6,
        fontSize: 14,
        fontWeight: '500',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    outletSection: {
        marginBottom: 24,
    },
    outletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#DBEAFE', // Blue 100
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    outletName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B', // Slate 800
    },
    cardSurface: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 16,
    },
    alertCard: {
        backgroundColor: '#FEF2F2', // Red 50
        borderWidth: 1,
        borderColor: '#FECACA', // Red 200
        padding: 16,
        shadowOpacity: 0,
        elevation: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
        letterSpacing: 0.3
    },

    // Podium Styles
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    podiumItem: {
        alignItems: 'center',
        width: 45, // Scaled down for split view (was 90)
    },
    podiumItemCenter: {
        width: 55, // Scaled down (was 110)
    },
    avatarContainer: {
        marginBottom: 12,
        alignItems: 'center',
        position: 'relative',
    },
    avatarContainerCenter: {
        marginBottom: 16,
    },
    podiumAvatar: {
        backgroundColor: '#FFF',
        borderWidth: 3,
    },
    crownIcon: {
        position: 'absolute',
        top: -24,
        zIndex: 10,
    },
    rankBadge: {
        position: 'absolute',
        bottom: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    rankBadgeCenter: {
        width: 28,
        height: 28,
        borderRadius: 14,
        bottom: -10,
    },
    rankBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
    },
    podiumName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        textAlign: 'center',
        marginBottom: 4,
    },
    podiumScore: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
    },

    // List Item Styles
    restList: {
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    alertList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    rankItem: {
        width: '48%', // 2 Columns
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    rankHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    rankIndex: {
        // width: 32, // Removed fixed width
    },
    rankNumber: {
        fontWeight: '700',
        fontSize: 12,
        color: '#64748B',
    },
    listAvatar: {
        backgroundColor: '#F8FAFC',
        marginBottom: 8,
    },
    rankName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    rankSub: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
        textAlign: 'center',
    },
    scoreContainer: {
        // Removed
    },
    scoreBadge: {
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 40,
    },
    scoreValue: {
        fontSize: 12,
        fontWeight: '800'
    },
    scoreLabel: {
        fontSize: 9,
        color: '#64748B',
        textTransform: 'uppercase',
        marginTop: 2,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: 30,
        gap: 8,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 13,
    },
    // SPLIT VIEW STYLES
    splitContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    leftColumn: {
        flex: 1,
        marginRight: 6,
    },
    rightColumn: {
        flex: 1,
        marginLeft: 6,
    },
    columnSurface: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        minHeight: 200,
    },
    verticalList: {
        gap: 10,
        marginTop: 8,
    },
    // Compact Rank Item
    rankItemCompact: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    rankBadgeSmall: {
        width: 20,
        height: 20,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    rankTextSmall: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    avatarSmall: {
        backgroundColor: '#F1F5F9',
    },
    nameSmall: {
        fontSize: 11, // Smaller text
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 1,
    },
    scoreSmall: {
        fontSize: 10,
        color: '#64748B',
    },
    emptyStateMini: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 100,
        opacity: 0.5,
    },
    emptyTextMini: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 20,
    },
    emptyTextMaxi: {
        color: colors.success,
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
    },
});
