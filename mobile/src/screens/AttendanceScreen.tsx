// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\AttendanceScreen.tsx
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
import { Text, Card, Portal, Dialog, TextInput, RadioButton, Button } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import axios from 'axios';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type MarkedDates = {
    [date: string]: {
        marked?: boolean;
        dotColor?: string;
        selected?: boolean;
        selectedColor?: string;
        customStyles?: any;
    };
};

type AttendanceDetail = {
    date: string;
    status: string;
    time?: string;
    isHalfDay?: boolean;
    isLate?: boolean;
    notes?: string;
    checkInTime?: string;
    checkOutTime?: string;
};

type LegendItemProps = {
    color: string;
    label: string;
    count: number;
};

const LegendItem = ({ color, label, count }: LegendItemProps) => (
    <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <View style={styles.legendTextWrapper}>
            <Text style={styles.legendLabel}>{label}</Text>
            <Text style={styles.legendCount}>{count} hari</Text>
        </View>
    </View>
);

export const AttendanceScreen = () => {
    const navigation = useNavigation();
    const [markedDates, setMarkedDates] = useState<MarkedDates>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [attendanceData, setAttendanceData] = useState<AttendanceDetail[]>([]);
    const [stats, setStats] = useState({ onTime: 0, late: 0, off: 0, holiday: 0 });

    const statusColors: Record<string, string> = {
        onTime: colors.success,
        late: colors.warning,
        off: colors.textMuted,
        holiday: colors.error,
    };

    const fetchAttendance = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const { data } = await axios.get(
                `${API_CONFIG.BASE_URL}${ENDPOINTS.CALENDAR}?deviceId=${Device.osVersion}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const marks: MarkedDates = {};
            const statsCount = { onTime: 0, late: 0, off: 0, holiday: 0 };

            data.forEach((item: any) => {
                marks[item.date] = {
                    marked: true,
                    dotColor: statusColors[item.status] || colors.primary,
                };
                if (item.status in statsCount) {
                    statsCount[item.status as keyof typeof statsCount]++;
                }
            });

            setMarkedDates(marks);
            setAttendanceData(data);
            setStats(statsCount);
        } catch (e) {
            console.warn('Attendance fetch error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const [permitDialogVisible, setPermitDialogVisible] = useState(false);
    const [permitType, setPermitType] = useState('PERMIT'); // 'PERMIT' | 'SICK'
    const [permitReason, setPermitReason] = useState('');
    const [submittingPermit, setSubmittingPermit] = useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendance();
    };

    const submitPermit = async () => {
        if (!selectedDate || !permitReason) return;
        setSubmittingPermit(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.post(
                `${API_CONFIG.BASE_URL}/attendance/permit`,
                {
                    date: selectedDate,
                    type: permitType,
                    reason: permitReason
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Success
            setPermitDialogVisible(false);
            setPermitReason('');
            fetchAttendance(); // Refresh calendar
            alert('Pengajuan izin berhasil dikirim.');

        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal mengajukan izin');
        } finally {
            setSubmittingPermit(false);
        }
    };

    const cancelPermit = async () => {
        if (!selectedDate) return;

        // Alert confirmation
        // In React Native logic usually we use Alert.alert but here let's valid first

        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.delete(
                `${API_CONFIG.BASE_URL}/attendance/permit/${selectedDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            fetchAttendance();
            alert('Pengajuan izin berhasil dibatalkan.');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal membatalkan izin');
        }
    };

    const onDayPress = (day: DateData) => {
        setSelectedDate(day.dateString);
    };

    const getSelectedDateInfo = () => {
        if (!selectedDate) return null;
        return attendanceData.find(item => item.date === selectedDate);
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Memuat data kehadiran...</Text>
            </View>
        );
    }

    const selectedInfo = getSelectedDateInfo();

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
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Kalender Absensi</Text>
                    <Text style={styles.headerSubtitle}>Riwayat Kehadiran</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Calendar */}
                <View style={styles.calendarCard}>
                    <Calendar
                        markingType="dot"
                        markedDates={{
                            ...markedDates,
                            ...(selectedDate && {
                                [selectedDate]: {
                                    ...markedDates[selectedDate],
                                    selected: true,
                                    selectedColor: colors.primary,
                                }
                            })
                        }}
                        onDayPress={onDayPress}
                        theme={{
                            backgroundColor: colors.surface,
                            calendarBackground: colors.surface,
                            textSectionTitleColor: colors.textSecondary,
                            selectedDayBackgroundColor: colors.primary,
                            selectedDayTextColor: '#FFFFFF',
                            todayTextColor: colors.primary,
                            todayBackgroundColor: `${colors.primary}15`,
                            dayTextColor: colors.textPrimary,
                            textDisabledColor: colors.textMuted,
                            dotColor: colors.primary,
                            arrowColor: colors.primary,
                            monthTextColor: colors.textPrimary,
                            textDayFontWeight: '500',
                            textMonthFontWeight: '700',
                            textDayHeaderFontWeight: '600',
                            textDayFontSize: 15,
                            textMonthFontSize: 18,
                            textDayHeaderFontSize: 13,
                        }}
                        style={styles.calendar}
                    />
                </View>

                {/* Selected Date Detail */}
                {selectedDate && (
                    <View style={styles.detailCard}>
                        <Text style={styles.detailTitle}>
                            {new Date(selectedDate).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </Text>
                        {selectedInfo ? (
                            <View style={styles.detailContent}>
                                <View style={styles.statusRow}>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: `${statusColors[selectedInfo.status]}20` }
                                    ]}>
                                        <View style={[
                                            styles.statusDot,
                                            { backgroundColor: statusColors[selectedInfo.status] }
                                        ]} />
                                        <Text style={[
                                            styles.statusText,
                                            { color: statusColors[selectedInfo.status] }
                                        ]}>
                                            {selectedInfo.status === 'onTime' ? 'Tepat Waktu' :
                                                selectedInfo.status === 'late' ? 'Terlambat' :
                                                    selectedInfo.status === 'off' ? 'Cuti/Libur' : 'Tidak Hadir'}
                                        </Text>
                                    </View>

                                    {selectedInfo.isHalfDay && (
                                        <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0', marginLeft: 8 }]}>
                                            <Text style={[styles.statusText, { color: colors.warning }]}>Setengah Hari</Text>
                                        </View>
                                    )}
                                </View>

                                {(selectedInfo.time || selectedInfo.checkInTime) && (
                                    <View style={styles.timeRow}>
                                        <MaterialCommunityIcons name="clock-time-four-outline" size={20} color={colors.primary} />
                                        <Text style={styles.timeLabel}>Jam Kehadiran:</Text>
                                        <Text style={styles.timeValue}>{selectedInfo.time || selectedInfo.checkInTime}</Text>
                                    </View>
                                )}

                                {selectedInfo.notes && (
                                    <View style={styles.notesContainer}>
                                        <Text style={styles.notesLabel}>Keterangan:</Text>
                                        <Text style={styles.notesValue}>{selectedInfo.notes}</Text>
                                    </View>
                                )}

                                {(selectedInfo.status === 'off') &&
                                    (new Date(selectedDate) >= new Date(new Date().setHours(0, 0, 0, 0))) && (
                                        <Button
                                            mode="outlined"
                                            onPress={cancelPermit}
                                            style={{ marginTop: 12, borderRadius: 8, borderColor: colors.error }}
                                            textColor={colors.error}
                                        >
                                            Batalkan Izin
                                        </Button>
                                    )}
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.noDataText}>Tidak ada data kehadiran.</Text>
                                {(selectedDate && new Date(selectedDate) >= new Date(new Date().setHours(0, 0, 0, 0))) && (
                                    <Button
                                        mode="contained"
                                        onPress={() => setPermitDialogVisible(true)}
                                        style={{ marginTop: 12, borderRadius: 8 }}
                                        buttonColor={colors.primary}
                                    >
                                        Ajukan Izin
                                    </Button>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* Legend & Stats */}
                <View style={styles.statsCard}>
                    <Text style={styles.sectionTitle}>Ringkasan Bulan Ini</Text>
                    <View style={styles.legendGrid}>
                        <LegendItem
                            color={colors.success}
                            label="Tepat Waktu"
                            count={stats.onTime}
                        />
                        <LegendItem
                            color={colors.warning}
                            label="Terlambat"
                            count={stats.late}
                        />
                        <LegendItem
                            color={colors.textMuted}
                            label="Cuti/Libur"
                            count={stats.off}
                        />
                        <LegendItem
                            color={colors.error}
                            label="Hari Libur"
                            count={stats.holiday}
                        />
                    </View>
                </View>
            </ScrollView>

            <Portal>
                <Dialog visible={permitDialogVisible} onDismiss={() => setPermitDialogVisible(false)} style={styles.dialogCard}>
                    <Dialog.Title style={styles.dialogTitle}>Ajukan Izin</Dialog.Title>
                    <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
                        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 10 }}>
                            <View style={styles.dateContainer}>
                                <MaterialCommunityIcons name="calendar-month" size={20} color={colors.textSecondary} />
                                <Text style={styles.dateText}>
                                    {selectedDate ? new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                </Text>
                            </View>

                            <Text style={styles.inputLabel}>Jenis Izin</Text>
                            <View style={styles.typeContainer}>
                                <TouchableOpacity
                                    style={[styles.typeOption, permitType === 'PERMIT' && styles.typeOptionSelected]}
                                    onPress={() => setPermitType('PERMIT')}
                                    activeOpacity={0.8}
                                >
                                    <MaterialCommunityIcons
                                        name="file-document-outline"
                                        size={24}
                                        color={permitType === 'PERMIT' ? 'white' : colors.textSecondary}
                                    />
                                    <Text style={[styles.typeText, permitType === 'PERMIT' && styles.typeTextSelected]}>Izin</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.typeOption, permitType === 'SICK' && styles.typeOptionSelected]}
                                    onPress={() => setPermitType('SICK')}
                                    activeOpacity={0.8}
                                >
                                    <MaterialCommunityIcons
                                        name="medical-bag"
                                        size={24}
                                        color={permitType === 'SICK' ? 'white' : colors.textSecondary}
                                    />
                                    <Text style={[styles.typeText, permitType === 'SICK' && styles.typeTextSelected]}>Sakit</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>Alasan / Keterangan</Text>
                            <TextInput
                                placeholder="Tulis keterangan..."
                                value={permitReason}
                                onChangeText={text => setPermitReason(text)}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.reasonInput}
                                outlineColor="#E2E8F0"
                                activeOutlineColor={colors.primary}
                                theme={{
                                    roundness: 12,
                                    colors: {
                                        background: '#FFFFFF',
                                        placeholder: colors.textMuted,
                                        text: colors.textPrimary,
                                    }
                                }}
                            />
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button
                            mode="text"
                            onPress={() => setPermitDialogVisible(false)}
                            textColor={colors.textSecondary}
                            style={styles.dialogButton}
                            labelStyle={{ fontWeight: '600' }}
                        >
                            Batal
                        </Button>
                        <Button
                            mode="contained"
                            onPress={submitPermit}
                            loading={submittingPermit}
                            buttonColor={colors.primary}
                            style={[styles.dialogButton, styles.submitButton]}
                            labelStyle={{ fontSize: 14, fontWeight: 'bold' }}
                        >
                            Kirim Pengajuan
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

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
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    calendarCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    calendar: {
        borderRadius: borderRadius.xl,
        paddingBottom: spacing.md,
    },
    detailCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    detailTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    detailContent: {
        // gap replaced with marginBottom on children
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.xs,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    timeLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
        marginRight: spacing.sm,
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    notesContainer: {
        marginTop: spacing.sm,
        padding: spacing.sm,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
    },
    notesLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    notesValue: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    noDataText: {
        color: colors.textMuted,
        fontSize: 14,
        fontStyle: 'italic',
    },
    statsCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
        ...shadows.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    legendGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '45%',
        paddingVertical: spacing.sm,
    },
    legendDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: spacing.sm,
    },
    legendTextWrapper: {
        flex: 1,
    },
    legendLabel: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    legendCount: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    // Dialog Styles
    dialogCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
    },
    dialogTitle: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 10,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    dateText: {
        marginLeft: 8,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: colors.textPrimary,
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    typeOption: {
        flex: 0.48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    typeOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeText: {
        marginLeft: 8,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    typeTextSelected: {
        color: 'white',
    },
    reasonInput: {
        backgroundColor: '#FFFFFF',
        marginBottom: 10,
        textAlignVertical: 'top',
        minHeight: 80,
        fontSize: 14,
        lineHeight: 20,
        paddingTop: 12,
        paddingHorizontal: 10,
    },
    dialogActions: {
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    dialogButton: {
        borderRadius: 8,
        width: '45%',
    },
    submitButton: {
        flex: 1,
        marginLeft: 10,
    },
});

export default AttendanceScreen;