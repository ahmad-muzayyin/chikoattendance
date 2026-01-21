// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\EmployeeListScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Avatar, Text, Surface, Searchbar, useTheme } from 'react-native-paper';
import axios from 'axios';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-gifted-charts';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type StatusFilter = 'ALL' | 'Hadir' | 'Telat' | 'Belum Hadir';

export default function EmployeeListScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const isFocused = useIsFocused();
    const theme = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

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

    const filteredData = data
        .filter((item: any) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.branch && item.branch.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .filter((item: any) => {
            if (statusFilter === 'ALL') return true;
            return item.status === statusFilter;
        });

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

    const renderItem = ({ item }: { item: any }) => {
        const formatTime = (time: any, formatted: any) => {
            if (formatted) return formatted;
            if (!time) return '--:--';
            return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('EmployeeDetail', { employee: { id: item.userId, name: item.name, role: item.role } })}
                style={{ marginBottom: 10 }}
            >
                <View style={styles.card}>
                    <View style={styles.cardMain}>
                        <View style={styles.cardLeft}>
                            <Avatar.Text
                                size={40}
                                label={item.name.substring(0, 2).toUpperCase()}
                                style={{ backgroundColor: item.status === 'Belum Hadir' ? '#F3F4F6' : colors.primary }}
                                color={item.status === 'Belum Hadir' ? '#9CA3AF' : '#FFF'}
                                labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
                            />
                            <View style={styles.cardTexts}>
                                <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.roleText} numberOfLines={1}>
                                    {item.role || 'Karyawan'} • {item.branch || '-'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.cardRight}>
                            <View style={[styles.statusPill, { backgroundColor: getStatusBg(item.status) }]}>
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                    {item.status}
                                </Text>
                            </View>
                            {item.isOvertime && (
                                <Text style={styles.overtimeText}>+ Lembur</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.timeBox}>
                            <MaterialCommunityIcons name="login-variant" size={14} color={item.checkInTime ? colors.success : colors.textMuted} />
                            <Text style={styles.timeLabel}>Masuk</Text>
                            <Text style={[styles.timeValue, { color: item.checkInTime ? colors.textPrimary : colors.textMuted }]}>
                                {formatTime(item.checkInTime, item.checkInTimeFormatted)}
                            </Text>
                        </View>
                        <View style={styles.timeDivider} />
                        <View style={styles.timeBox}>
                            <MaterialCommunityIcons name="logout-variant" size={14} color={item.checkOutTime ? colors.error : colors.textMuted} />
                            <Text style={styles.timeLabel}>Keluar</Text>
                            <Text style={[styles.timeValue, { color: item.checkOutTime ? colors.textPrimary : colors.textMuted }]}>
                                {formatTime(item.checkOutTime, item.checkOutTimeFormatted)}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Header Area */}
            <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Monitoring Karyawan</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Text style={styles.headerSubtitle}>
                                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                            {statusFilter !== 'ALL' && (
                                <View style={styles.filterBadge}>
                                    <MaterialCommunityIcons name="filter" size={9} color="#FFF" />
                                    <Text style={styles.filterBadgeText}>{statusFilter}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity onPress={fetchMonitoring} style={styles.refreshBtn}>
                        <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar - Compact */}
                <Searchbar
                    placeholder="Cari nama atau cabang..."
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor="#FFF"
                    elevation={0}
                />

                {/* Circle Chart for Monitoring Summary */}
                <Surface style={styles.chartSurface} elevation={0}>
                    <View style={styles.chartRow}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                                // Cycle through filters when clicking the chart
                                if (statusFilter === 'ALL') setStatusFilter('Hadir');
                                else if (statusFilter === 'Hadir') setStatusFilter('Telat');
                                else if (statusFilter === 'Telat') setStatusFilter('Belum Hadir');
                                else setStatusFilter('ALL');
                            }}
                        >
                            <PieChart
                                data={[
                                    { value: stats.hadir || 0.1, color: '#4ADE80', gradientCenterColor: '#4ADE80' },
                                    { value: stats.telat || 0, color: '#F87171', gradientCenterColor: '#F87171' },
                                    { value: stats.absent || 0, color: 'rgba(255,255,255,0.4)', gradientCenterColor: 'rgba(255,255,255,0.4)' },
                                ]}
                                donut
                                radius={38}
                                innerRadius={30}
                                innerCircleColor={colors.primary}
                                centerLabelComponent={() => {
                                    const total = stats.total;
                                    return (
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFF' }}>{total}</Text>
                                        </View>
                                    );
                                }}
                            />
                        </TouchableOpacity>
                        <View style={styles.chartLegend}>
                            <TouchableOpacity
                                style={[
                                    styles.legendItem,
                                    statusFilter === 'Hadir' && styles.legendItemActive
                                ]}
                                onPress={() => setStatusFilter(statusFilter === 'Hadir' ? 'ALL' : 'Hadir')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.legendDot, { backgroundColor: '#4ADE80' }]} />
                                <Text style={styles.legendLabel}>Hadir: {stats.hadir}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.legendItem,
                                    statusFilter === 'Telat' && styles.legendItemActive
                                ]}
                                onPress={() => setStatusFilter(statusFilter === 'Telat' ? 'ALL' : 'Telat')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.legendDot, { backgroundColor: '#F87171' }]} />
                                <Text style={styles.legendLabel}>Telat: {stats.telat}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.legendItem,
                                    statusFilter === 'Belum Hadir' && styles.legendItemActive
                                ]}
                                onPress={() => setStatusFilter(statusFilter === 'Belum Hadir' ? 'ALL' : 'Belum Hadir')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.legendDot, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
                                <Text style={styles.legendLabel}>Belum: {stats.absent}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Surface>

                {/* Hint Text - Compact */}
                <View style={styles.hintContainer}>
                    <MaterialCommunityIcons name="gesture-tap" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.hintText}>Ketuk untuk filter</Text>
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
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },
    refreshBtn: {
        padding: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
    },
    filterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    filterBadgeText: {
        fontSize: 9,
        color: '#FFF',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    searchBar: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        marginBottom: spacing.sm,
        height: 40,
    },
    searchInput: {
        color: '#FFF',
        fontSize: 13,
        minHeight: 0,
    },
    // Monitoring Chart Styles
    chartSurface: {
        backgroundColor: 'transparent',
        marginTop: 4,
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    chartLegend: {
        gap: 4,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 6,
    },
    legendItemActive: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    legendLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    hintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        gap: 6,
        alignSelf: 'center',
    },
    hintText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
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
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9', // Very subtle border
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, // Very soft shadow
        shadowRadius: 2,
        elevation: 1,
    },
    cardMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardTexts: {
        marginLeft: 12,
        flex: 1,
    },
    cardRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    nameText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    roleText: {
        fontSize: 11, // Smaller for minimalist look
        color: colors.textSecondary,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 100, // Fully rounded
        marginBottom: 2,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    overtimeText: {
        fontSize: 9,
        color: '#9333EA',
        fontWeight: '600',
        marginTop: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC', // Light blue-grey bg
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
    },
    timeBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    timeLabel: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    timeValue: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    timeDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#E2E8F0',
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
