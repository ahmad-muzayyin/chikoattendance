// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\OwnerRecapDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius } from '../theme/theme';
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
        navigation.setOptions({ title: `Rekap - ${userName}` });
        fetchAttendance();
    }, [month, year]);

    // Calculate stats
    const stats = {
        total: attendances.length / 2, // approximation, better to count unique dates
        hadir: new Set(attendances.filter(a => a.type === 'CHECK_IN' && !a.isLate).map(a => new Date(a.date).toDateString())).size,
        telat: new Set(attendances.filter(a => a.type === 'CHECK_IN' && a.isLate).map(a => new Date(a.date).toDateString())).size,
        // Calculate strictly from data
    };

    // Group by Date
    const groupedData: any = {};
    attendances.forEach(att => {
        const dateKey = new Date(att.timestamp).toLocaleDateString('id-ID');
        if (!groupedData[dateKey]) groupedData[dateKey] = { date: att.timestamp };
        if (att.type === 'CHECK_IN') {
            groupedData[dateKey].checkIn = att.timestamp;
            groupedData[dateKey].isLate = att.isLate;
        } else {
            groupedData[dateKey].checkOut = att.timestamp;
        }
    });

    const items = Object.values(groupedData).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <View style={styles.container}>
            {/* Filter Bar */}
            <View style={styles.filterBar}>
                <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={styles.filterBtn}>
                    <MaterialCommunityIcons name="calendar-month" size={20} color={colors.primary} />
                    <Text style={styles.filterText}>{months[month - 1]} {year}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <Button
                    mode="contained"
                    buttonColor={colors.success}
                    icon="printer"
                    onPress={() => console.log('Print/Export')} // Implement export later
                    compact
                >
                    Export
                </Button>
            </View>

            <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAttendance} />}>
                {items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Tidak ada data absensi bulan ini</Text>
                    </View>
                ) : (
                    items.map((item: any, index) => (
                        <Surface key={index} style={styles.itemCard} elevation={1}>
                            <View style={styles.dateBox}>
                                <Text style={styles.dateDay}>{new Date(item.date).getDate()}</Text>
                                <Text style={styles.dateMonth}>{months[new Date(item.date).getMonth()].substring(0, 3)}</Text>
                            </View>
                            <View style={styles.timeBox}>
                                <View style={styles.timeRow}>
                                    <MaterialCommunityIcons name="login" size={16} color={colors.success} />
                                    <Text style={styles.timeLabel}>Masuk:</Text>
                                    <Text style={styles.timeValue}>
                                        {item.checkIn ? new Date(item.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </Text>
                                    {item.isLate && <Text style={styles.lateBadge}>Telat</Text>}
                                </View>
                                <View style={styles.timeRow}>
                                    <MaterialCommunityIcons name="logout" size={16} color={colors.error} />
                                    <Text style={styles.timeLabel}>Pulang:</Text>
                                    <Text style={styles.timeValue}>
                                        {item.checkOut ? new Date(item.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </Text>
                                </View>
                            </View>
                        </Surface>
                    ))
                )}
            </ScrollView>

            {/* Month Picker Dialog */}
            <Portal>
                <Dialog visible={showMonthPicker} onDismiss={() => setShowMonthPicker(false)}>
                    <Dialog.Title>Pilih Bulan</Dialog.Title>
                    <Dialog.Content>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {months.map((m, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.dialogItem}
                                    onPress={() => {
                                        setMonth(i + 1);
                                        setShowMonthPicker(false);
                                    }}
                                >
                                    <RadioButton
                                        value={(i + 1).toString()}
                                        status={month === i + 1 ? 'checked' : 'unchecked'}
                                        onPress={() => {
                                            setMonth(i + 1);
                                            setShowMonthPicker(false);
                                        }}
                                        color={colors.primary}
                                    />
                                    <Text style={styles.dialogItemText}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowMonthPicker(false)}>Batal</Button>
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
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: borderRadius.md,
    },
    filterText: {
        marginHorizontal: 8,
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    itemCard: {
        flexDirection: 'row',
        marginHorizontal: spacing.md,
        marginTop: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        alignItems: 'center',
    },
    dateBox: {
        alignItems: 'center',
        paddingRight: spacing.md,
        borderRightWidth: 1,
        borderRightColor: colors.divider,
        marginRight: spacing.md,
        minWidth: 50,
    },
    dateDay: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    dateMonth: {
        fontSize: 12,
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    timeBox: {
        flex: 1,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    timeLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: 6,
        marginRight: 4,
        width: 45,
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    lateBadge: {
        fontSize: 10,
        color: colors.error,
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textMuted,
    },
    dialogItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    dialogItemText: {
        fontSize: 16,
        marginLeft: 8,
    }
});
