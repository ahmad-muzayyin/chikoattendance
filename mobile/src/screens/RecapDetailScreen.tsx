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
                        history.map((item, index) => (
                            <Surface key={index} style={styles.card} elevation={1}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="calendar-today" size={20} color={colors.primary} />
                                        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                                    </View>
                                    {item.checkIn?.isLate && (
                                        <View style={styles.lateBadge}>
                                            <Text style={styles.lateText}>Terlambat</Text>
                                        </View>
                                    )}
                                </View>

                                <Divider style={styles.divider} />

                                <View style={styles.timeRow}>
                                    <View style={styles.timeItem}>
                                        <Text style={styles.timeLabel}>Masuk</Text>
                                        <View style={styles.timeValueContainer}>
                                            <MaterialCommunityIcons name="login" size={18} color={colors.success} />
                                            <Text style={styles.timeValue}>
                                                {item.checkIn ? formatTime(item.checkIn.timestamp) : '-'}
                                            </Text>
                                        </View>
                                        {item.checkIn?.notes && (
                                            <Text style={styles.notes} numberOfLines={1}>{item.checkIn.notes}</Text>
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
                        ))
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
