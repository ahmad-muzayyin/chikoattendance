import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';

type RootStackParamList = {
    RecapDetail: { month: string; monthCode: string };
};

type HistoryItem = {
    date: string;
    checkIn: any;
    checkOut: any;
    events: any[];
};

export default function RecapDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'RecapDetail'>>();
    const { month, monthCode } = route.params;

    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}${ENDPOINTS.HISTORY}`, {
                params: { month: monthCode },
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{month}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {history.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-remove" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Tidak ada data absensi.</Text>
                        </View>
                    ) : (
                        history.map((item, index) => {
                            // Deteksi berbagai status
                            const hasCheckOutOnly = !item.checkIn && item.checkOut;

                            // Cek apakah check-out adalah Alpha marker (jam 23:55)
                            let isAlphaCheckout = false;
                            if (hasCheckOutOnly && item.checkOut) {
                                const checkOutTime = new Date(item.checkOut.timestamp);
                                const hours = checkOutTime.getHours();
                                const minutes = checkOutTime.getMinutes();
                                isAlphaCheckout = (hours === 23 && minutes === 55);
                            }

                            const hasCheckInOnly = item.checkIn && !item.checkOut;
                            const hasOvertime = item.checkOut?.isOvertime;
                            const hasHalfDay = item.checkOut?.isHalfDay;

                            // Cek events untuk ALPHA, PERMIT, SICK
                            const alphaEvent = item.events?.find((e: any) => e.type === 'ALPHA');
                            const permitEvent = item.events?.find((e: any) => e.type === 'PERMIT');
                            const sickEvent = item.events?.find((e: any) => e.type === 'SICK');

                            return (
                                <Surface key={index} style={styles.card} elevation={1}>
                                    <View style={styles.cardHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="calendar-today" size={20} color={colors.primary} />
                                            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {item.checkIn?.isLate && (
                                                <View style={styles.lateBadge}>
                                                    <Text style={styles.lateText}>🔔 Terlambat</Text>
                                                </View>
                                            )}
                                            {hasOvertime && (
                                                <View style={[styles.overtimeBadge, { marginLeft: 6, marginTop: 4 }]}>
                                                    <Text style={styles.overtimeText}>⏰ Lembur</Text>
                                                </View>
                                            )}
                                            {hasHalfDay && (
                                                <View style={[styles.halfDayBadge, { marginLeft: 6, marginTop: 4 }]}>
                                                    <Text style={styles.halfDayText}>⚠️ Pulang Duluan</Text>
                                                </View>
                                            )}
                                            {hasCheckOutOnly && !isAlphaCheckout && (
                                                <View style={[styles.warningBadge, { marginLeft: 6, marginTop: 4 }]}>
                                                    <Text style={styles.warningText}>🚫 Data Tidak Valid</Text>
                                                </View>
                                            )}
                                            {isAlphaCheckout && (
                                                <View style={[styles.alphaBadge, { marginLeft: 6, marginTop: 4 }]}>
                                                    <Text style={styles.alphaText}>🔴 Alpha (Sistem)</Text>
                                                </View>
                                            )}
                                            {alphaEvent && (
                                                <View style={[styles.alphaBadge, { marginLeft: 6, marginTop: 4 }]}>
                                                    <Text style={styles.alphaText}>🔴 Alpha</Text>
                                                </View>
                                            )}
                                            {permitEvent && (
                                                <View style={[styles.permitBadge, { marginLeft: 6, marginTop: 4 }]}>
                                                    <Text style={styles.permitText}>🟡 Izin</Text>
                                                </View>
                                            )}
                                            {sickEvent && (
                                                <View style={[styles.sickBadge, { marginLeft: 6, marginTop: 4 }]}>
                                                    <Text style={styles.sickText}>🟢 Sakit</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    <Divider style={styles.divider} />

                                    {/* Keterangan untuk berbagai status */}
                                    {isAlphaCheckout && (
                                        <View style={[styles.infoBanner, { backgroundColor: '#FEE2E2' }]}>
                                            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                                            <Text style={[styles.infoText, { color: colors.error }]}>
                                                Tidak absen sama sekali dalam sehari. Status ditandai otomatis oleh sistem pada jam 23:55.
                                            </Text>
                                        </View>
                                    )}

                                    {hasCheckOutOnly && !isAlphaCheckout && (
                                        <View style={styles.infoBanner}>
                                            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
                                            <Text style={styles.infoText}>
                                                Data tidak valid: Tercatat absen pulang tanpa absen masuk. Kemungkinan error sistem atau manipulasi data.
                                            </Text>
                                        </View>
                                    )}

                                    {alphaEvent && (
                                        <View style={[styles.infoBanner, { backgroundColor: '#FEE2E2' }]}>
                                            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                                            <Text style={[styles.infoText, { color: colors.error }]}>
                                                Tidak absen sama sekali dalam sehari. Status ditandai otomatis oleh sistem pada jam 23:55.
                                            </Text>
                                        </View>
                                    )}

                                    {permitEvent && (
                                        <View style={[styles.infoBanner, { backgroundColor: '#FEF3C7' }]}>
                                            <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.warning} />
                                            <Text style={[styles.infoText, { color: colors.warning }]}>
                                                Izin disetujui oleh HRD/Owner. {permitEvent.notes ? `Alasan: ${permitEvent.notes}` : ''}
                                            </Text>
                                        </View>
                                    )}

                                    {sickEvent && (
                                        <View style={[styles.infoBanner, { backgroundColor: '#D1FAE5' }]}>
                                            <MaterialCommunityIcons name="medical-bag" size={16} color="#059669" />
                                            <Text style={[styles.infoText, { color: '#059669' }]}>
                                                Sakit disetujui oleh HRD/Owner. {sickEvent.notes ? `Keterangan: ${sickEvent.notes}` : ''}
                                            </Text>
                                        </View>
                                    )}

                                    {hasOvertime && !hasCheckOutOnly && (
                                        <View style={[styles.infoBanner, { backgroundColor: '#D1FAE5' }]}>
                                            <MaterialCommunityIcons name="clock-alert-outline" size={16} color="#059669" />
                                            <Text style={[styles.infoText, { color: '#059669' }]}>
                                                Check-out setelah jam kerja normal selesai. Terhitung lembur.
                                            </Text>
                                        </View>
                                    )}

                                    {hasHalfDay && !hasCheckOutOnly && (
                                        <View style={[styles.infoBanner, { backgroundColor: '#FEF3C7' }]}>
                                            <MaterialCommunityIcons name="clock-alert-outline" size={16} color={colors.warning} />
                                            <Text style={[styles.infoText, { color: colors.warning }]}>
                                                Check-out sebelum jam kerja selesai (durasi kurang dari 8 jam).
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.timeRow}>
                                        <View style={styles.timeItem}>
                                            <Text style={styles.timeLabel}>Masuk</Text>
                                            <View style={styles.timeValueContainer}>
                                                <MaterialCommunityIcons name="login" size={18} color={colors.success} />
                                                <Text style={[styles.timeValue, !item.checkIn && hasCheckOutOnly && styles.missingData]}>
                                                    {item.checkIn ? formatTime(item.checkIn.timestamp) : '-'}
                                                </Text>
                                            </View>
                                            {item.checkIn?.notes && (
                                                <Text style={styles.notes} numberOfLines={1}>{item.checkIn.notes}</Text>
                                            )}
                                            {!item.checkIn && hasCheckOutOnly && (
                                                <Text style={styles.missingNote}>✗ Tidak ada data</Text>
                                            )}
                                        </View>

                                        <View style={styles.verticalDivider} />

                                        <View style={styles.timeItem}>
                                            <Text style={styles.timeLabel}>Pulang</Text>
                                            <View style={styles.timeValueContainer}>
                                                <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
                                                <Text style={styles.timeValue}>
                                                    {item.checkOut ? formatTime(item.checkOut.timestamp) : '-'}
                                                </Text>
                                            </View>
                                            {item.checkOut?.notes && (
                                                <Text style={styles.notes} numberOfLines={1}>{item.checkOut.notes}</Text>
                                            )}
                                        </View>
                                    </View>
                                </Surface>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.surface,
        ...shadows.sm
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: colors.background,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: spacing.lg },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    dateText: {
        marginLeft: spacing.sm,
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    lateBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    lateText: {
        fontSize: 10,
        color: colors.error,
        fontWeight: 'bold',
    },
    warningBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    warningText: {
        fontSize: 10,
        color: colors.warning,
        fontWeight: 'bold',
    },
    overtimeBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    overtimeText: {
        fontSize: 10,
        color: '#059669',
        fontWeight: 'bold',
    },
    halfDayBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    halfDayText: {
        fontSize: 10,
        color: colors.warning,
        fontWeight: 'bold',
    },
    alphaBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    alphaText: {
        fontSize: 10,
        color: colors.error,
        fontWeight: 'bold',
    },
    permitBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    permitText: {
        fontSize: 10,
        color: colors.warning,
        fontWeight: 'bold',
    },
    sickBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sickText: {
        fontSize: 10,
        color: '#059669',
        fontWeight: 'bold',
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        padding: 10,
        borderRadius: 8,
        marginBottom: spacing.sm,
    },
    infoText: {
        fontSize: 12,
        color: colors.error,
        marginLeft: 6,
        flex: 1,
        fontWeight: '600',
    },
    missingData: {
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    missingNote: {
        fontSize: 11,
        color: colors.error,
        marginTop: 4,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    divider: { marginVertical: spacing.sm },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
    timeItem: { flex: 1, alignItems: 'center' },
    timeLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    timeValueContainer: { flexDirection: 'row', alignItems: 'center' },
    timeValue: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginLeft: 4 },
    verticalDivider: { width: 1, backgroundColor: colors.divider, height: '100%' },
    notes: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 10, color: colors.textMuted },
});
