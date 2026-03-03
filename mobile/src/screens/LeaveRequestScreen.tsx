import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Surface, ActivityIndicator, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function LeaveRequestScreen() {
    const navigation = useNavigation();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Form State
    const [type, setType] = useState('LEAVE'); // LEAVE, PERMIT, SICK
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [monthUsage, setMonthUsage] = useState(0);

    // Pickers
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const fetchMyLeaves = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}${ENDPOINTS.LEAVES}/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaves(res.data);

            // Calculate current month usage for balance UI
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const usage = res.data
                .filter((l: any) => l.status === 'APPROVED' && l.startDate >= startOfMonth)
                .reduce((acc: number, curr: any) => acc + curr.daysCount, 0);
            setMonthUsage(usage);
        } catch (error) {
            console.log('Fetch leaves error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyLeaves();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyLeaves();
        setRefreshing(false);
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Eror', 'Silakan masukkan alasan pengajuan.');
            return;
        }

        setSubmitting(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            await axios.post(`${API_CONFIG.BASE_URL}${ENDPOINTS.LEAVES}`, {
                type,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                daysCount: diffDays,
                reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Sukses', 'Pengajuan berhasil dikirim.');
            setReason('');
            fetchMyLeaves();
        } catch (error: any) {
            Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan sistem.');
        } finally {
            setSubmitting(false);
        }
    };

    const StatusChip = ({ status }: { status: string }) => {
        let color = colors.warning;
        let label = 'Menunggu';
        if (status === 'APPROVED') { color = colors.success; label = 'Disetujui'; }
        if (status === 'REJECTED') { color = colors.error; label = 'Ditolak'; }

        return (
            <Chip
                textStyle={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}
                style={{ backgroundColor: color, height: 24, justifyContent: 'center' }}
            >
                {label}
            </Chip>
        );
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
            <View style={styles.headerRow}>
                <Text style={styles.title}>Pengajuan Cuti / Izin</Text>
                <Surface style={styles.usageTag} elevation={1}>
                    <Text style={styles.usageTagLabel}>Pakai: </Text>
                    <Text style={[styles.usageTagValue, monthUsage >= 3 && { color: colors.error }]}>{monthUsage}/3 Hari</Text>
                </Surface>
            </View>

            <Surface style={styles.formCard} elevation={2}>
                <Text style={styles.label}>Jenis Pengajuan</Text>
                <View style={styles.typeRow}>
                    <TouchableOpacity
                        style={[styles.typeBtn, type === 'LEAVE' && styles.typeBtnActive]}
                        onPress={() => setType('LEAVE')}
                    >
                        <MaterialCommunityIcons name="calendar-star" size={20} color={type === 'LEAVE' ? 'white' : colors.textMuted} />
                        <Text style={[styles.typeText, type === 'LEAVE' && styles.typeTextActive]}>Cuti</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeBtn, type === 'PERMIT' && styles.typeBtnActive]}
                        onPress={() => setType('PERMIT')}
                    >
                        <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={type === 'PERMIT' ? 'white' : colors.textMuted} />
                        <Text style={[styles.typeText, type === 'PERMIT' && styles.typeTextActive]}>Izin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeBtn, type === 'SICK' && styles.typeBtnActive]}
                        onPress={() => setType('SICK')}
                    >
                        <MaterialCommunityIcons name="medical-bag" size={20} color={type === 'SICK' ? 'white' : colors.textMuted} />
                        <Text style={[styles.typeText, type === 'SICK' && styles.typeTextActive]}>Sakit</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.dateRow}>
                    <View style={styles.dateCol}>
                        <Text style={styles.label}>Dari</Text>
                        <TouchableOpacity style={styles.datePicker} onPress={() => setShowStartPicker(true)}>
                            <Text>{startDate.toLocaleDateString('id-ID')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.dateCol}>
                        <Text style={styles.label}>Sampai</Text>
                        <TouchableOpacity style={styles.datePicker} onPress={() => setShowEndPicker(true)}>
                            <Text>{endDate.toLocaleDateString('id-ID')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showStartPicker && (
                    <DateTimePicker value={startDate} mode="date" onChange={(e, d) => { setShowStartPicker(false); if (d) setStartDate(d); }} />
                )}
                {showEndPicker && (
                    <DateTimePicker value={endDate} mode="date" onChange={(e, d) => { setShowEndPicker(false); if (d) setEndDate(d); }} />
                )}

                <Text style={styles.label}>Alasan</Text>
                <TextInput
                    mode="outlined"
                    placeholder="Contoh: Keperluan keluarga, Sakit demam..."
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                />

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={submitting}
                    disabled={submitting}
                    style={styles.submitBtn}
                >
                    Kirim Pengajuan
                </Button>
            </Surface>

            <Text style={styles.sectionTitle}>Riwayat Pengajuan</Text>
            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
            ) : leaves.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="calendar-blank" size={50} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, marginTop: 10 }}>Belum ada pengajuan</Text>
                </View>
            ) : (
                leaves.map((item) => (
                    <Surface key={item.id} style={styles.historyCard} elevation={1}>
                        <View style={styles.historyHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons
                                    name={item.type === 'SICK' ? "medical-bag" : (item.type === 'PERMIT' ? "clipboard-text-outline" : "calendar-star")}
                                    size={18} color={item.type === 'SICK' ? colors.error : colors.primary}
                                />
                                <Text style={styles.historyType}>{item.type}</Text>
                            </View>
                            <StatusChip status={item.status} />
                        </View>
                        <Text style={styles.historyDate}>
                            {new Date(item.startDate).toLocaleDateString('id-ID')} - {new Date(item.endDate).toLocaleDateString('id-ID')} ({item.daysCount} hari)
                        </Text>
                        <Text style={styles.historyReason} numberOfLines={2}>{item.reason}</Text>
                        {item.rejectionReason && (
                            <Text style={styles.rejectText}>Alasan Tolak: {item.rejectionReason}</Text>
                        )}
                    </Surface>
                ))
            )}
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
    usageTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    usageTagLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
    usageTagValue: { fontSize: 11, color: colors.success, fontWeight: 'bold' },
    formCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 30 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.divider, gap: 6 },
    typeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    typeTextActive: { color: 'white' },
    dateRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    dateCol: { flex: 1 },
    datePicker: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.divider, backgroundColor: '#F9FAFB' },
    input: { backgroundColor: 'white', marginBottom: 20 },
    submitBtn: { borderRadius: 12, paddingVertical: 4 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 15 },
    historyCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    historyType: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginLeft: 6 },
    historyDate: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
    historyReason: { fontSize: 12, color: colors.textMuted },
    rejectText: { fontSize: 11, color: colors.error, marginTop: 8, fontStyle: 'italic' },
    emptyState: { alignItems: 'center', marginTop: 40 },
});
