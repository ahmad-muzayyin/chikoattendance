// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\OwnerRecapEmployeesScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar, ScrollView } from 'react-native';
import { Text, Surface, Avatar, ActivityIndicator, Searchbar, Button, Portal, Dialog, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';

const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

type AttendanceFilter = 'ALL' | 'HADIR' | 'TELAT' | 'IZIN' | 'ALPHA';

export default function OwnerRecapEmployeesScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { branchId, branchName } = route.params;

    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<AttendanceFilter>('ALL');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [tempMonth, setTempMonth] = useState(month);
    const [tempYear, setTempYear] = useState(year);
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            // Get all employees
            const res = await axios.get(`${API_CONFIG.BASE_URL}/admin/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter by branchId
            const filtered = res.data.filter((u: any) => {
                const uBranchId = u.Branch?.id || u.branchId;
                return uBranchId == branchId;
            });

            // Fetch attendance stats for each employee (current month)
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            const employeesWithStats = await Promise.all(
                filtered.map(async (employee: any) => {
                    try {
                        // Fetch attendance for selected month
                        const attendanceRes = await axios.get(
                            `${API_CONFIG.BASE_URL}/admin/attendance/${employee.id}`,
                            {
                                params: { month, year },
                                headers: { Authorization: `Bearer ${token}` }
                            }
                        );

                        const attendances = attendanceRes.data || [];

                        // Calculate stats
                        let hadir = 0;
                        let telat = 0;
                        let izin = 0;
                        let alpha = 0;

                        // Group by date to count unique days
                        const dateMap: any = {};
                        attendances.forEach((att: any) => {
                            const date = new Date(att.timestamp).toDateString();
                            if (!dateMap[date]) dateMap[date] = [];
                            dateMap[date].push(att);
                        });

                        // Analyze each day
                        Object.values(dateMap).forEach((dayAttendances: any) => {
                            const hasCheckIn = dayAttendances.some((a: any) => a.type === 'CHECK_IN');
                            const hasAlpha = dayAttendances.some((a: any) => a.type === 'ALPHA');
                            const hasPermit = dayAttendances.some((a: any) => a.type === 'PERMIT');
                            const hasSick = dayAttendances.some((a: any) => a.type === 'SICK');
                            const isLate = dayAttendances.some((a: any) => a.isLate === true);

                            if (hasAlpha) {
                                alpha++;
                            } else if (hasPermit || hasSick) {
                                izin++;
                            } else if (hasCheckIn) {
                                hadir++;
                                if (isLate) telat++;
                            }
                        });

                        return {
                            ...employee,
                            stats: { hadir, telat, izin, alpha }
                        };
                    } catch (error) {
                        console.error(`Error fetching stats for ${employee.name}:`, error);
                        return {
                            ...employee,
                            stats: { hadir: 0, telat: 0, izin: 0, alpha: 0 }
                        };
                    }
                })
            );

            setEmployees(employeesWithStats);
        } catch (error) {
            console.error('Fetch employees error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        navigation.setOptions({ title: `Karyawan - ${branchName}` });
        fetchEmployees();
    }, [branchId, month, year]);

    const filteredList = employees
        .filter((u: any) => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter((u: any) => {
            if (selectedFilter === 'ALL') return true;
            if (selectedFilter === 'HADIR') return (u.stats?.hadir || 0) > 0 && (u.stats?.telat || 0) === 0;
            if (selectedFilter === 'TELAT') return (u.stats?.telat || 0) > 0;
            if (selectedFilter === 'IZIN') return (u.stats?.izin || 0) > 0;
            if (selectedFilter === 'ALPHA') return (u.stats?.alpha || 0) > 0;
            return true;
        });

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('OwnerRecapDetail', { userId: item.id, userName: item.name })}
        >
            <Surface style={styles.card} elevation={2}>
                <View style={styles.avatarContainer}>
                    {item.profile_picture ? (
                        <Avatar.Image
                            size={50}
                            source={{ uri: item.profile_picture }}
                            style={{ backgroundColor: 'transparent' }}
                        />
                    ) : (
                        <Avatar.Text
                            size={50}
                            label={item.name.substring(0, 2).toUpperCase()}
                            style={{ backgroundColor: colors.primary }}
                            color="#FFF"
                        />
                    )}
                    {/* Role Badge */}
                    <View style={styles.badgeContainer}>
                        <MaterialCommunityIcons
                            name={item.role === 'OWNER' ? 'crown' : 'account'}
                            size={10}
                            color="#FFF"
                        />
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.row}>
                        <View style={styles.roleTag}>
                            <Text style={styles.roleText}>{item.role}</Text>
                        </View>
                        {/* Stats Summary Badges */}
                        <View style={styles.statsRow}>
                            <View style={[styles.statBadge, { backgroundColor: '#E8F5E9' }]}>
                                <Text style={[styles.statLabel, { color: colors.success }]}>H: {item.stats?.hadir || 0}</Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: '#FFF3E0' }]}>
                                <Text style={[styles.statLabel, { color: colors.warning }]}>T: {item.stats?.telat || 0}</Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: '#E3F2FD' }]}>
                                <Text style={[styles.statLabel, { color: '#2196F3' }]}>I: {item.stats?.izin || 0}</Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: '#FFEBEE' }]}>
                                <Text style={[styles.statLabel, { color: colors.error }]}>A: {item.stats?.alpha || 0}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.arrowContainer}>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                </View>
            </Surface>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Modern Filter Header */}
            <Surface style={styles.headerSurface} elevation={2}>
                <TouchableOpacity
                    onPress={() => {
                        setTempMonth(month);
                        setTempYear(year);
                        setShowMonthPicker(true);
                    }}
                    style={styles.pickerTrigger}
                >
                    <View style={styles.pickerIcon}>
                        <MaterialCommunityIcons name="calendar-range" size={24} color={colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.pickerLabel}>Periode Absensi</Text>
                        <Text style={styles.pickerValue}>{months[month - 1]} {year}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            </Surface>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Cari Karyawan..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={{ fontSize: 14 }}
                    iconColor={colors.primary}
                />
            </View>

            {/* Filter Chips */}
            {/* <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsContainer}
            >
                <Chip
                    selected={selectedFilter === 'ALL'}
                    onPress={() => setSelectedFilter('ALL')}
                    style={[styles.filterChip, selectedFilter === 'ALL' && styles.filterChipActive]}
                    textStyle={[styles.filterChipText, selectedFilter === 'ALL' && styles.filterChipTextActive]}
                    icon="filter-variant"
                >
                    Semua
                </Chip>
                <Chip
                    selected={selectedFilter === 'HADIR'}
                    onPress={() => setSelectedFilter('HADIR')}
                    style={[styles.filterChip, selectedFilter === 'HADIR' && { backgroundColor: colors.success }]}
                    textStyle={[styles.filterChipText, selectedFilter === 'HADIR' && { color: '#FFF' }]}
                    icon="check-circle"
                >
                    Hadir
                </Chip>
                <Chip
                    selected={selectedFilter === 'TELAT'}
                    onPress={() => setSelectedFilter('TELAT')}
                    style={[styles.filterChip, selectedFilter === 'TELAT' && { backgroundColor: colors.warning }]}
                    textStyle={[styles.filterChipText, selectedFilter === 'TELAT' && { color: '#FFF' }]}
                    icon="clock-alert"
                >
                    Terlambat
                </Chip>
                <Chip
                    selected={selectedFilter === 'IZIN'}
                    onPress={() => setSelectedFilter('IZIN')}
                    style={[styles.filterChip, selectedFilter === 'IZIN' && { backgroundColor: '#2196F3' }]}
                    textStyle={[styles.filterChipText, selectedFilter === 'IZIN' && { color: '#FFF' }]}
                    icon="file-document"
                >
                    Izin
                </Chip>
                <Chip
                    selected={selectedFilter === 'ALPHA'}
                    onPress={() => setSelectedFilter('ALPHA')}
                    style={[styles.filterChip, selectedFilter === 'ALPHA' && { backgroundColor: colors.error }]}
                    textStyle={[styles.filterChipText, selectedFilter === 'ALPHA' && { color: '#FFF' }]}
                    icon="close-circle"
                >
                    Alpha
                </Chip>
            </ScrollView> */}

            <FlatList
                data={filteredList}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchEmployees} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="account-search-outline" size={60} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Tidak ada karyawan ditemukan</Text>
                            <Text style={styles.emptySubText}>Di outlet {branchName}</Text>
                        </View>
                    ) : null
                }
            />

            {/* Month/Year Picker Dialog */}
            <Portal>
                <Dialog visible={showMonthPicker} onDismiss={() => setShowMonthPicker(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Pilih Periode</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogLabel}>Tahun</Text>
                        <View style={styles.yearGrid}>
                            {years.map(y => (
                                <TouchableOpacity
                                    key={y}
                                    style={[styles.yearItem, tempYear === y && styles.yearItemActive]}
                                    onPress={() => setTempYear(y)}
                                >
                                    <Text style={[styles.yearText, tempYear === y && styles.yearTextActive]}>{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.dialogLabel, { marginTop: 20 }]}>Bulan</Text>
                        <View style={styles.monthGrid}>
                            {months.map((m, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.monthItem, tempMonth === i + 1 && styles.monthItemActive]}
                                    onPress={() => setTempMonth(i + 1)}
                                >
                                    <Text style={[styles.monthText, tempMonth === i + 1 && styles.monthTextActive]}>{m.substring(0, 3)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button onPress={() => setShowMonthPicker(false)} textColor={colors.textMuted}>Batal</Button>
                        <Button
                            mode="contained"
                            onPress={() => {
                                setMonth(tempMonth);
                                setYear(tempYear);
                                setShowMonthPicker(false);
                            }}
                            style={styles.applyBtn}
                        >
                            Terapkan
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerContainer: {
        padding: spacing.lg,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + spacing.md : 20,
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    searchBar: {
        elevation: 0,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.md,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: spacing.md,
    },
    badgeContainer: {
        position: 'absolute',
        bottom: 0,
        right: -4,
        backgroundColor: colors.warning,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 8,
    },
    roleTag: {
        backgroundColor: `${colors.primary}15`,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    roleText: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        minWidth: 28,
        alignItems: 'center',
        marginRight: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
    },
    arrowContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        opacity: 0.7,
    },
    emptyText: {
        marginTop: spacing.md,
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    emptySubText: {
        marginTop: 4,
        fontSize: 14,
        color: colors.textSecondary,
    },
    // New Filter Styles
    headerSurface: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + spacing.sm : 20,
        backgroundColor: 'white',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginHorizontal: 2,
        marginBottom: spacing.sm,
    },
    pickerTrigger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerIcon: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: `${colors.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pickerLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    pickerValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    filterChipsContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        gap: 8,
    },
    filterChip: {
        marginRight: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    filterChipTextActive: {
        color: '#FFF',
    },
    // Dialog Styles
    dialog: {
        borderRadius: 25,
        backgroundColor: 'white',
    },
    dialogTitle: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
    },
    dialogLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: 10,
        marginLeft: 5,
    },
    yearGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    yearItem: {
        width: '31%',
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.divider,
        alignItems: 'center',
        marginBottom: 10,
    },
    yearItemActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    yearText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    yearTextActive: {
        color: 'white',
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    monthItem: {
        width: '23%',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.divider,
        alignItems: 'center',
        marginBottom: 10,
    },
    monthItemActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    monthText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    monthTextActive: {
        color: 'white',
    },
    dialogActions: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    applyBtn: {
        borderRadius: 12,
        paddingHorizontal: 20,
    },
});
