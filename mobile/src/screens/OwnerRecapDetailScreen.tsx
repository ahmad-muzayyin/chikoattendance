// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\OwnerRecapDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function OwnerRecapDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { userId, userName } = route.params;

    const [attendances, setAttendances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-indexed
    const [year, setYear] = useState(new Date().getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const [tempMonth, setTempMonth] = useState(month);
    const [tempYear, setTempYear] = useState(year);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/admin/attendance/${userId}`, {
                params: { month, year },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(res.data)) {
                setAttendances(res.data);
            } else {
                setAttendances([]);
            }
        } catch (error) {
            console.error('Fetch attendance error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        navigation.setOptions({ title: userName });
        fetchAttendance();
    }, [month, year]);

    // Grouping logic remains similar but I'll optimize
    const groupedData: any = {};
    attendances.forEach(att => {
        const dateKey = new Date(att.timestamp).toLocaleDateString('id-ID');
        if (!groupedData[dateKey]) groupedData[dateKey] = { date: att.timestamp };
        if (att.type === 'CHECK_IN') {
            // For Check-IN: Since data is DESC (latest first), we want the execution to overwrite until the last one (earliest time).
            // So 'always overwrite' is correct for finding the earliest Check-In.
            groupedData[dateKey].checkIn = att.timestamp;
            groupedData[dateKey].checkInFormatted = att.timestampFormatted;
            groupedData[dateKey].isLate = att.isLate;
        } else {
            // For Check-OUT: We want the LATEST time (first one in DESC array).
            // So ONLY set if not already set.
            if (!groupedData[dateKey].checkOut) {
                groupedData[dateKey].checkOut = att.timestamp;
                groupedData[dateKey].checkOutFormatted = att.timestampFormatted;
            }
        }
    });

    const items = Object.values(groupedData).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                        <Text style={styles.pickerLabel}>Periode Rekap</Text>
                        <Text style={styles.pickerValue}>{months[month - 1]} {year}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.exportBtn} onPress={() => console.log('Export')}>
                    <MaterialCommunityIcons name="file-download-outline" size={22} color="white" />
                </TouchableOpacity>
            </Surface>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAttendance} colors={[colors.primary]} />}
            >
                {loading && items.length === 0 ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="calendar-blank-outline" size={80} color={`${colors.primary}20`} />
                        <Text style={styles.emptyTitle}>Data Tidak Ditemukan</Text>
                        <Text style={styles.emptySubtitle}>Tidak ada absensi untuk periode {months[month - 1]} {year}</Text>
                    </View>
                ) : (
                    items.map((item: any, index) => (
                        <Surface key={index} style={styles.itemCard} elevation={1}>
                            <View style={styles.cardHeader}>
                                <View style={styles.dateBadge}>
                                    <Text style={styles.dateDayText}>{new Date(item.date).getDate()}</Text>
                                    <Text style={styles.dateMonthText}>{months[new Date(item.date).getMonth()].substring(0, 3)}</Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.dayText}>
                                        {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long' })}
                                    </Text>
                                    <Text style={styles.fullDateText}>
                                        {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                </View>
                                {item.isLate && <View style={styles.lateStatus}><Text style={styles.lateStatusText}>TERLAMBAT</Text></View>}
                            </View>

                            <View style={styles.cardDivider} />

                            <View style={styles.timeRow}>
                                <View style={[styles.timeSlot, { borderRightWidth: 1, borderRightColor: colors.divider }]}>
                                    <MaterialCommunityIcons name="clock-in" size={18} color={colors.success} />
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={styles.slotLabel}>Masuk</Text>
                                        <Text style={styles.slotValue}>
                                            {item.checkInFormatted || (item.checkIn ? new Date(item.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.timeSlot}>
                                    <MaterialCommunityIcons name="clock-out" size={18} color={colors.error} />
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={styles.slotLabel}>Pulang</Text>
                                        <Text style={styles.slotValue}>
                                            {item.checkOutFormatted || (item.checkOut ? new Date(item.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Surface>
                    ))
                )}
            </ScrollView>

            {/* Modern Selection Modal */}
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
    headerSurface: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: 'white',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginHorizontal: 2,
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
    exportBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        ...shadows.sm,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: spacing.md,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateBadge: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: `${colors.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    dateDayText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        lineHeight: 22,
    },
    dateMonthText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
        textTransform: 'uppercase',
    },
    cardInfo: {
        flex: 1,
    },
    dayText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        textTransform: 'capitalize',
    },
    fullDateText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    lateStatus: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    lateStatusText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.error,
    },
    cardDivider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 12,
    },
    timeRow: {
        flexDirection: 'row',
    },
    timeSlot: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 5,
    },
    slotLabel: {
        fontSize: 10,
        color: colors.textMuted,
        fontWeight: '600',
    },
    slotValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
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
    }
});
