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
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

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

    // Export States
    const [exportDialogVisible, setExportDialogVisible] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const downloadReport = async (type: 'excel' | 'pdf') => {
        setExportDialogVisible(false);
        setDownloading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const fileType = type === 'excel' ? 'xlsx' : 'pdf';
            const endpoint = `${API_CONFIG.BASE_URL}/reports/branch/${branchId}/${type}?month=${month}&year=${year}`;

            const fileName = `Rekap_${branchName.replace(/\s+/g, '_')}_${months[month - 1]}_${year}.${fileType}`;
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;

            // Download
            const result = await FileSystem.downloadAsync(
                endpoint,
                fileUri,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (result.status !== 200) {
                throw new Error('Gagal mengunduh laporan. Cek koneksi atau data.');
            }

            // Share/Save
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(result.uri);
            } else {
                Alert.alert('Info', `File tersimpan di: ${result.uri}`);
            }

        } catch (error: any) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Gagal mengunduh laporan.');
        } finally {
            setDownloading(false);
        }
    };

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
                        // Calculate stats
                        let hadir = 0;
                        let telat = 0;
                        let izin = 0;
                        let alpha = 0;

                        attendances.forEach((day: any) => {
                            const hasAlpha = day.events?.some((e: any) => e.type === 'ALPHA');
                            const hasPermit = day.events?.some((e: any) => e.type === 'PERMIT');
                            const hasSick = day.events?.some((e: any) => e.type === 'SICK');
                            const hasCheckIn = !!day.checkIn;
                            const isLate = day.isLate;

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
            <Surface style={styles.card} elevation={3}>
                {/* Header Section: Identity */}
                <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                        {item.profile_picture ? (
                            <Avatar.Image
                                size={46}
                                source={{ uri: item.profile_picture }}
                                style={{ backgroundColor: 'transparent' }}
                            />
                        ) : (
                            <Avatar.Text
                                size={46}
                                label={item.name.substring(0, 2).toUpperCase()}
                                style={{ backgroundColor: colors.primary }}
                                color="#FFF"
                            />
                        )}
                        <View style={styles.badgeContainer}>
                            <MaterialCommunityIcons
                                name={item.role === 'OWNER' ? 'crown' : 'account'}
                                size={10}
                                color="#FFF"
                            />
                        </View>
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.roleText}>{item.role}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                </View>

                {/* Divider Line */}
                <View style={styles.cardDivider} />

                {/* Data Section: Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconContainer, { backgroundColor: '#F0FDF4' }]}>
                            <MaterialCommunityIcons name="check-bold" size={16} color={colors.success} />
                        </View>
                        <Text style={[styles.statCount, { color: colors.success }]}>{item.stats?.hadir || 0}</Text>
                        <Text style={styles.statLabel}>Hadir</Text>
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.statIconContainer, { backgroundColor: '#FFFBEB' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.warning} />
                        </View>
                        <Text style={[styles.statCount, { color: colors.warning }]}>{item.stats?.telat || 0}</Text>
                        <Text style={styles.statLabel}>Telat</Text>
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                            <MaterialCommunityIcons name="file-document-outline" size={16} color={'#2196F3'} />
                        </View>
                        <Text style={[styles.statCount, { color: '#2196F3' }]}>{item.stats?.izin || 0}</Text>
                        <Text style={styles.statLabel}>Izin/Sakit</Text>
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.statIconContainer, { backgroundColor: '#FEF2F2' }]}>
                            <MaterialCommunityIcons name="close-thick" size={16} color={colors.error} />
                        </View>
                        <Text style={[styles.statCount, { color: colors.error }]}>{item.stats?.alpha || 0}</Text>
                        <Text style={styles.statLabel}>Alpha</Text>
                    </View>
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
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() => setExportDialogVisible(true)}
                    disabled={downloading}
                >
                    {downloading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <MaterialCommunityIcons name="file-download-outline" size={22} color="white" />
                    )}
                </TouchableOpacity>
            </Surface>

            {/* Export Dialog */}
            <Portal>
                <Dialog visible={exportDialogVisible} onDismiss={() => setExportDialogVisible(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Export Laporan</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ textAlign: 'center', marginBottom: 20, color: colors.textSecondary }}>
                            Pilih format laporan untuk periode {months[month - 1]} {year}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                            <TouchableOpacity style={styles.fileTypeBtn} onPress={() => downloadReport('excel')}>
                                <MaterialCommunityIcons name="file-excel" size={40} color="#1D6F42" />
                                <Text style={styles.fileTypeLabel}>Excel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.fileTypeBtn} onPress={() => downloadReport('pdf')}>
                                <MaterialCommunityIcons name="file-pdf-box" size={40} color="#F40F02" />
                                <Text style={styles.fileTypeLabel}>PDF</Text>
                            </TouchableOpacity>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setExportDialogVisible(false)}>Batal</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search employee..."
                    placeholderTextColor={colors.textMuted}
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor={colors.primary}
                    rippleColor="rgba(0, 0, 0, 0.1)"
                    elevation={0}
                />
            </View>

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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        height: 54,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchInput: {
        fontSize: 15,
        color: colors.textPrimary,
        alignSelf: 'center',
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    card: {
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        paddingVertical: 16,
        paddingHorizontal: 16, // Reduced padding for compact look
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    badgeContainer: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#F59E0B',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    headerTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        lineHeight: 20,
    },
    roleText: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 14,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statCount: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '500',
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        gap: 8,
    },
    filterChip: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: 20,
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
    exportBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        ...shadows.sm,
    },
    fileTypeBtn: {
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.divider,
        width: 100
    },
    fileTypeLabel: {
        marginTop: 8,
        fontWeight: 'bold',
        color: colors.textPrimary
    }
});
