// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\EmployeeListScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { Avatar, Text, Surface, Searchbar, useTheme } from 'react-native-paper';
import axios from 'axios';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

export default function EmployeeListScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const isFocused = useIsFocused();
    const theme = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMonitoring = useCallback(async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/admin/monitoring`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isFocused) fetchMonitoring();
    }, [isFocused, fetchMonitoring]);

    const filteredData = data.filter((item: any) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.branch && item.branch.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const stats = {
        total: data.length,
        hadir: data.filter((i: any) => i.status === 'Hadir').length,
        telat: data.filter((i: any) => i.status === 'Telat').length,
        absent: data.filter((i: any) => i.status === 'Belum Hadir').length,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hadir': return colors.success;
            case 'Telat': return colors.error;
            default: return colors.textMuted;
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'Hadir': return '#DCFCE7'; // Light Green
            case 'Telat': return '#FEE2E2'; // Light Red
            default: return '#F1F5F9'; // Light Grey
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('EmployeeDetail', { employee: { id: item.userId, name: item.name, role: item.role } })}
        >
            <Surface style={styles.card} elevation={2}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                        <Avatar.Text
                            size={50}
                            label={item.name.substring(0, 2).toUpperCase()}
                            style={{ backgroundColor: item.status === 'Belum Hadir' ? colors.textMuted : colors.primary }}
                            color="#FFF"
                        />
                        {item.status !== 'Belum Hadir' && (
                            <View style={styles.onlineBadge} />
                        )}
                    </View>

                    <View style={styles.cardInfo}>
                        <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>

                        {/* Role / Level */}
                        <View style={[styles.roleContainer, { marginBottom: 4 }]}>
                            <MaterialCommunityIcons name="shield-account" size={14} color={colors.primary} />
                            <Text style={[styles.roleText, { color: colors.primary, fontWeight: '700' }]}>{item.role || 'Karyawan'}</Text>
                        </View>

                        {/* Branch */}
                        <View style={styles.roleContainer}>
                            <MaterialCommunityIcons name="store-marker-outline" size={14} color={colors.textSecondary} />
                            <Text style={styles.roleText}>{item.branch || 'No Branch'}</Text>
                        </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            {/* Overtime Badge */}
                            {item.isOvertime && (
                                <View style={[styles.statusBadge, { backgroundColor: '#F3E8FF' }]}>
                                    <Text style={[styles.statusText, { color: '#9333EA' }]}>
                                        Lembur
                                    </Text>
                                </View>
                            )}

                            {/* Standard Status Badge */}
                            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>

                        {item.isHighRisk && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#FEF2F2', padding: 4, borderRadius: 8 }}>
                                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                                <Text style={{ fontSize: 10, color: colors.error, fontWeight: 'bold', marginLeft: 2 }}>
                                    Warning
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.timeContainer}>
                    <View style={styles.timeBox}>
                        <Text style={styles.timeLabel}>Check In</Text>
                        <Text style={[styles.timeValue, { color: item.checkInTime ? colors.textPrimary : colors.textMuted }]}>
                            {item.checkInTimeFormatted || (item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                        </Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.timeBox}>
                        <Text style={styles.timeLabel}>Check Out</Text>
                        <Text style={[styles.timeValue, { color: item.checkOutTime ? colors.textPrimary : colors.textMuted }]}>
                            {item.checkOutTimeFormatted || (item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                        </Text>
                    </View>
                </View>
            </Surface>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Header Area */}
            <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Monitoring Karyawan</Text>
                        <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                    </View>
                    <TouchableOpacity onPress={fetchMonitoring} style={styles.refreshBtn}>
                        <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <Searchbar
                    placeholder="Cari nama atau cabang..."
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor="#FFF"
                    elevation={0}
                />

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <StatBox label="Total" count={stats.total} icon="account-group" />
                    <StatBox label="Hadir" count={stats.hadir} icon="check-circle" color="#4ADE80" />
                    <StatBox label="Telat" count={stats.telat} icon="clock-alert" color="#F87171" />
                    <StatBox label="Absen" count={stats.absent} icon="account-off" color="#94A3B8" />
                </View>
            </View>

            {/* List Content */}
            <FlatList
                data={filteredData}
                keyExtractor={(item: any) => item.userId.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchMonitoring} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    loading ? null : (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="account-search" size={60} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Tidak ada data karyawan ditemukan</Text>
                        </View>
                    )
                }
            />
        </View>
    );
}

const StatBox = ({ label, count, icon, color = "#FFF" }: any) => (
    <View style={styles.statItem}>
        <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statCount}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerContainer: {
        backgroundColor: colors.primary,
        paddingTop: 50,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 1,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    refreshBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    searchBar: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 15,
        marginBottom: spacing.lg,
        height: 45,
    },
    searchInput: {
        color: '#FFF',
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    statCount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
    },
    listContent: {
        padding: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.success,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 12,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    timeBox: {
        alignItems: 'center',
        flex: 1,
    },
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.divider,
    },
    timeLabel: {
        fontSize: 11,
        color: colors.textMuted,
        marginBottom: 2,
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        color: colors.textMuted,
    },
});
