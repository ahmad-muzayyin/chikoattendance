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

    const RankItem = ({ item, rank, type }: { item: EmployeeStats, rank: number, type: 'best' | 'worst' }) => {
        const isBest = type === 'best';
        const medalColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';

        return (
            <View style={styles.rankItem}>
                <View style={styles.rankBadgeContainer}>
                    {isBest && rank <= 3 ? (
                        <MaterialCommunityIcons name="medal" size={24} color={medalColor} />
                    ) : (
                        <Text style={[styles.rankNumber, { color: isBest ? colors.success : colors.error }]}>#{rank}</Text>
                    )}
                </View>

                <Avatar.Image
                    size={40}
                    source={item.photo ? { uri: item.photo } : require('../../assets/logo.png')}
                    style={{ backgroundColor: '#f0f0f0', marginRight: 12 }}
                />

                <View style={{ flex: 1 }}>
                    <Text style={styles.rankName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.rankSub}>
                        {isBest
                            ? `${item.present} Hadir • ${item.late} Telat`
                            : `${item.late}x Terlambat`
                        }
                    </Text>
                </View>

                <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreValue, { color: isBest ? colors.primary : colors.error }]}>
                        {isBest ? item.score : item.late}
                    </Text>
                    <Text style={styles.scoreLabel}>{isBest ? 'Poin' : 'Telat'}</Text>
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
                >
                    {data.map((outlet, index) => (
                        <Surface key={index} style={styles.outletCard}>
                            <View style={styles.outletHeader}>
                                <MaterialCommunityIcons name="store" size={20} color={colors.primary} />
                                <Text style={styles.outletName}>{outlet.branchName}</Text>
                            </View>

                            {/* BEST SECTION */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <MaterialCommunityIcons name="star-circle" size={20} color="#EAB308" />
                                    <Text style={styles.sectionTitle}>Karyawan Terrajin</Text>
                                </View>
                                {outlet.best.length > 0 ? (
                                    outlet.best.map((emp, i) => (
                                        <RankItem key={emp.id} item={emp} rank={i + 1} type="best" />
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>Belum ada data.</Text>
                                )}
                            </View>

                            {/* WORST SECTION */}
                            {outlet.worst.length > 0 && (
                                <View style={[styles.section, { marginTop: 16 }]}>
                                    <View style={styles.sectionHeader}>
                                        <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                                        <Text style={[styles.sectionTitle, { color: colors.error }]}>Perlu Pembinaan</Text>
                                    </View>
                                    {outlet.worst.map((emp, i) => (
                                        <RankItem key={emp.id} item={emp} rank={i + 1} type="worst" />
                                    ))}
                                </View>
                            )}
                        </Surface>
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
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 24, paddingTop: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    headerSubtitle: { color: 'rgba(255,255,255,0.9)', marginTop: 4 },
    scrollContent: { padding: 20 },
    outletCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 20, ...shadows.sm },
    outletHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
    outletName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginLeft: 8 },
    section: {},
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', letterSpacing: 0.5 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, fontStyle: 'italic', marginVertical: 8 },
    rankItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 12 },
    rankBadgeContainer: { width: 32, alignItems: 'center', marginRight: 4 },
    rankNumber: { fontWeight: 'bold', fontSize: 16 },
    rankName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
    rankSub: { fontSize: 11, color: '#6B7280' },
    scoreContainer: { alignItems: 'flex-end', marginLeft: 8 },
    scoreValue: { fontSize: 16, fontWeight: 'bold' },
    scoreLabel: { fontSize: 10, color: '#9CA3AF' }
});
