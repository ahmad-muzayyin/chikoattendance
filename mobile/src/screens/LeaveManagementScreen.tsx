import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, Portal, Dialog, TextInput, Chip } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LeaveManagementScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED

    // Modal
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}${ENDPOINTS.LEAVES}/admin`, {
                params: { status: statusFilter },
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaves(res.data);
        } catch (error) {
            console.log('Fetch admin leaves error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) fetchLeaves();
    }, [isFocused, statusFilter]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLeaves();
        setRefreshing(false);
    };

    const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !rejectionReason.trim()) {
            Alert.alert('Eror', 'Silakan masukkan alasan penolakan.');
            return;
        }

        setSubmitting(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.put(`${API_CONFIG.BASE_URL}${ENDPOINTS.LEAVES}/admin/${selectedLeave.id}`, {
                status,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Sukses', `Pengajuan berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}.`);
            setDialogVisible(false);
            setRejectionReason('');
            fetchLeaves();
        } catch (error: any) {
            Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan sistem.');
        } finally {
            setSubmitting(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        let color = '#F59E0B'; // Pending
        if (status === 'APPROVED') color = '#10B981';
        if (status === 'REJECTED') color = '#EF4444';

        return (
            <View style={[styles.badge, { backgroundColor: `${color}15` }]}>
                <Text style={[styles.badgeText, { color }]}>{status}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manajemen Cuti / Izin</Text>
                <View style={styles.filterRow}>
                    {['PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterBtn, statusFilter === f && styles.filterBtnActive]}
                            onPress={() => setStatusFilter(f)}
                        >
                            <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
                                {f === 'PENDING' ? 'Perlu Diproses' : (f === 'APPROVED' ? 'Disetujui' : 'Ditolak')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} />
                ) : leaves.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="clipboard-check-outline" size={64} color={colors.textMuted} />
                        <Text style={{ color: colors.textMuted, marginTop: 15, fontSize: 16 }}>Tidak ada pengajuan</Text>
                    </View>
                ) : (
                    leaves.map((item) => (
                        <Surface key={item.id} style={styles.card} elevation={1}>
                            <View style={styles.cardHeader}>
                                <View style={styles.userSection}>
                                    <View style={styles.userAvatar}>
                                        <Text style={styles.avatarLabel}>{item.User?.name?.substring(0, 2).toUpperCase()}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.userName}>{item.User?.name}</Text>
                                        <Text style={styles.userRole}>{item.User?.role}</Text>
                                    </View>
                                </View>
                                <StatusBadge status={item.status} />
                            </View>

                            <View style={styles.detailsBox}>
                                <View style={styles.detailItem}>
                                    <MaterialCommunityIcons name="calendar-range" size={16} color={colors.textSecondary} />
                                    <Text style={styles.detailText}>
                                        {new Date(item.startDate).toLocaleDateString('id-ID')} - {new Date(item.endDate).toLocaleDateString('id-ID')}
                                    </Text>
                                    <Chip style={styles.daysChip} textStyle={styles.daysChipText}>{item.daysCount} Hari</Chip>
                                </View>
                                <View style={styles.detailItem}>
                                    <MaterialCommunityIcons name="tag-outline" size={16} color={colors.textSecondary} />
                                    <Text style={styles.detailText}>{item.type}</Text>
                                </View>

                                <View style={styles.usageContainer}>
                                    <Text style={styles.usageLabel}>Pemakaian Bulan Ini:</Text>
                                    <Text style={[styles.usageValue, item.monthUsage >= 3 ? { color: colors.error } : { color: colors.success }]}>
                                        {item.monthUsage} / 3 Hari (Dispensasi)
                                    </Text>
                                </View>

                                <View style={[styles.detailItem, { alignItems: 'flex-start' }]}>
                                    <MaterialCommunityIcons name="format-quote-close" size={16} color={colors.textSecondary} />
                                    <Text style={styles.reasonText}>{item.reason}</Text>
                                </View>
                            </View>

                            {item.status === 'PENDING' && (
                                <View style={styles.actions}>
                                    <Button
                                        mode="contained"
                                        buttonColor={colors.success}
                                        onPress={() => { setSelectedLeave(item); handleUpdateStatus('APPROVED'); }}
                                        style={styles.actionBtn}
                                        labelStyle={{ fontWeight: 'bold' }}
                                    >
                                        Setujui
                                    </Button>
                                    <Button
                                        mode="outlined"
                                        textColor={colors.error}
                                        onPress={() => { setSelectedLeave(item); setDialogVisible(true); }}
                                        style={[styles.actionBtn, { borderColor: colors.error }]}
                                    >
                                        Tolak
                                    </Button>
                                </View>
                            )}
                        </Surface>
                    ))
                )}
            </ScrollView>

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
                    <Dialog.Title>Tolak Pengajuan</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ marginBottom: 10, color: colors.textSecondary }}>Masukkan alasan penolakan untuk karyawan:</Text>
                        <TextInput
                            label="Alasan Penolakan"
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            mode="outlined"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Batal</Button>
                        <Button onPress={() => handleUpdateStatus('REJECTED')} loading={submitting} textColor={colors.error}>Tolak Sekarang</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: spacing.lg, backgroundColor: 'white', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
    title: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 15 },
    filterRow: { flexDirection: 'row', gap: 8 },
    filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center' },
    filterBtnActive: { backgroundColor: colors.primary },
    filterText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
    filterTextActive: { color: 'white' },
    scrollContent: { padding: spacing.lg },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    userSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center' },
    avatarLabel: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
    userName: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
    userRole: { fontSize: 11, color: colors.textSecondary },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    detailsBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, gap: 8 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
    daysChip: { height: 24, backgroundColor: '#E0F2FE' },
    daysChipText: { fontSize: 10, color: '#0369A1', fontWeight: 'bold' },
    usageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        marginVertical: 4
    },
    usageLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
    usageValue: { fontSize: 12, fontWeight: 'bold' },
    reasonText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', flex: 1 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 15 },
    actionBtn: { flex: 1, borderRadius: 12 },
    emptyState: { alignItems: 'center', marginTop: 80 },
    dialog: { backgroundColor: 'white', borderRadius: 20 },
});
