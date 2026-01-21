// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\EmployeeDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, Divider, Portal, Modal, TextInput, Avatar, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EmployeeDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { employee } = route.params as any;

    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [punishmentModalVisible, setPunishmentModalVisible] = useState(false);
    const [points, setPoints] = useState('');
    const [reason, setReason] = useState('');
    const [punishmentLoading, setPunishmentLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/admin/attendance/${employee.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendanceHistory(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        navigation.setOptions({ title: 'Detail Karyawan' });
    }, []);

    const stats = React.useMemo(() => {
        let onTime = 0;
        let late = 0;
        let permit = 0;
        let alpha = 0;

        attendanceHistory.forEach((item: any) => {
            if (item.type === 'CHECK_IN' || (!['CHECK_OUT', 'PERMIT', 'SICK', 'ALPHA'].includes(item.type))) {
                if (item.isLate) late++;
                else onTime++;
            } else if (item.type === 'ALPHA') {
                alpha++;
            } else if (item.type === 'PERMIT' || item.type === 'SICK') {
                permit++;
            }
        });

        return { onTime, late, permit, alpha };
    }, [attendanceHistory]);

    const handleGivePunishment = async () => {
        if (!points || !reason) {
            Alert.alert('Eror', 'Mohon isi poin dan alasan sanksi.');
            return;
        }

        setPunishmentLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.post(`${API_CONFIG.BASE_URL}/admin/punishment`, {
                userId: employee.id,
                points: parseInt(points),
                reason
            }, { headers: { Authorization: `Bearer ${token}` } });

            Alert.alert('Sukses', 'Sanksi berhasil diberikan.');
            setPunishmentModalVisible(false);
            setPoints('');
            setReason('');
        } catch (error) {
            Alert.alert('Gagal', 'Sistem gagal menyimpan sanksi.');
        } finally {
            setPunishmentLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Profile Header */}
                <Surface style={styles.header} elevation={1}>
                    <Avatar.Text
                        size={80}
                        label={employee.name.substring(0, 2).toUpperCase()}
                        style={{ backgroundColor: colors.primary }}
                    />
                    <Text style={styles.name}>{employee.name}</Text>
                    <Text style={styles.role}>{employee.role}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}><Text style={styles.badgeText}>{employee.Branch?.name || 'Toko Pusat'}</Text></View>
                    </View>
                </Surface>

                {/* Actions */}
                <View style={styles.actionSection}>
                    <Button
                        mode="contained"
                        icon="alert-decagram"
                        onPress={() => setPunishmentModalVisible(true)}
                        style={styles.punishBtn}
                        buttonColor={colors.error}
                    >
                        Beri Poin Sanksi
                    </Button>
                </View>

                {/* Stats Summary */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.success }]}>{stats.onTime}</Text>
                        <Text style={styles.statLabel}>Tepat Waktu</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.warning }]}>{stats.late}</Text>
                        <Text style={styles.statLabel}>Terlambat</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.error }]}>{stats.alpha}</Text>
                        <Text style={styles.statLabel}>Alpha</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.info }]}>{stats.permit}</Text>
                        <Text style={styles.statLabel}>Izin/Sakit</Text>
                    </View>
                </View>

                {/* History List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Riwayat Kehadiran Bulan Ini</Text>
                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
                    ) : (
                        attendanceHistory.map((item: any) => {
                            // Determine type info
                            let typeColor = colors.primary;
                            let typeIcon = 'login';
                            let typeLabel = 'Check In';

                            if (item.type === 'CHECK_OUT') {
                                typeColor = '#64748B';
                                typeIcon = 'logout';
                                typeLabel = 'Check Out';
                            } else if (item.type === 'PERMIT') {
                                typeColor = '#F59E0B';
                                typeIcon = 'file-document-outline';
                                typeLabel = 'Izin';
                            } else if (item.type === 'SICK') {
                                typeColor = '#8B5CF6';
                                typeIcon = 'medical-bag';
                                typeLabel = 'Sakit';
                            } else if (item.type === 'ALPHA') {
                                typeColor = colors.error;
                                typeIcon = 'alert-circle';
                                typeLabel = 'Alpha (Tidak Hadir)';
                            }

                            return (
                                <Surface key={item.id} style={styles.historyCard} elevation={0}>
                                    <View style={styles.historyRow}>
                                        <View style={[styles.typeIndicator, { backgroundColor: typeColor }]}>
                                            <MaterialCommunityIcons name={typeIcon as any} size={16} color="#FFF" />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.historyDate}>{new Date(item.timestamp).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                                            <Text style={styles.historyTime}>
                                                {item.type !== 'ALPHA' ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' : ''}
                                                {typeLabel}
                                            </Text>

                                            {/* Status Tags */}
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                                                {item.isLate && <Text style={styles.warningTag}>🔔 TERLAMBAT</Text>}
                                                {item.isOvertime && <Text style={styles.overtimeTag}>⏰ LEMBUR</Text>}
                                                {item.isHalfDay && <Text style={styles.halfDayTag}>⚠️ SETENGAH HARI</Text>}
                                                {item.type === 'ALPHA' && <Text style={styles.alphaTag}>🚫 AUTO SISTEM (-20 POIN)</Text>}
                                            </View>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                                    </View>

                                    {/* Notes/Description */}
                                    {item.notes && (
                                        <View style={styles.notesBox}>
                                            <MaterialCommunityIcons name="information-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                            <Text style={styles.notesText}>{item.notes}</Text>
                                        </View>
                                    )}

                                    {/* Special Alpha Description */}
                                    {item.type === 'ALPHA' && !item.notes && (
                                        <View style={[styles.notesBox, { backgroundColor: '#FEE2E2' }]}>
                                            <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} style={{ marginRight: 4 }} />
                                            <Text style={[styles.notesText, { color: colors.error }]}>
                                                Karyawan tidak melakukan absensi. Sistem otomatis menandai sebagai Alpha dengan sanksi 20 poin.
                                            </Text>
                                        </View>
                                    )}

                                    <Divider style={{ marginTop: 12 }} />
                                </Surface>
                            );
                        })
                    )}
                    {attendanceHistory.length === 0 && !loading && (
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="calendar-blank" size={40} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Belum ada aktivitas absensi.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Portal>
                <Modal
                    visible={punishmentModalVisible}
                    onDismiss={() => setPunishmentModalVisible(false)}
                    contentContainerStyle={styles.modal}
                >
                    <View style={styles.modalHeader}>
                        <MaterialCommunityIcons name="alert-circle" size={32} color={colors.error} />
                        <Text style={styles.modalTitle}>Berikan Sanksi</Text>
                    </View>
                    <TextInput
                        label="Poin Sanksi (Contoh: 10)"
                        value={points}
                        onChangeText={setPoints}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Alasan Sanksi"
                        value={reason}
                        onChangeText={setReason}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                    />
                    <View style={styles.modalActions}>
                        <Button mode="text" onPress={() => setPunishmentModalVisible(false)} style={{ flex: 1 }}>Batal</Button>
                        <Button
                            mode="contained"
                            onPress={handleGivePunishment}
                            loading={punishmentLoading}
                            style={{ flex: 1, borderRadius: 10 }}
                            buttonColor={colors.error}
                        >
                            Kirim
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.surface, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, ...shadows.sm },
    name: { fontSize: 22, fontWeight: 'bold', marginTop: 12 },
    role: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
    badgeRow: { flexDirection: 'row' },
    badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },
    actionSection: { padding: spacing.xl },
    punishBtn: { borderRadius: 12, elevation: 2 },
    section: { paddingHorizontal: spacing.xl },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 15 },
    historyCard: { backgroundColor: 'transparent', marginBottom: 15 },
    historyRow: { flexDirection: 'row', alignItems: 'center' },
    typeIndicator: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    historyDate: { fontSize: 14, fontWeight: '600' },
    historyTime: { fontSize: 12, color: colors.textSecondary },
    warningTag: { fontSize: 10, fontWeight: 'bold', color: colors.error, backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 6, marginBottom: 4 },
    overtimeTag: { fontSize: 10, fontWeight: 'bold', color: '#059669', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 6, marginBottom: 4 },
    halfDayTag: { fontSize: 10, fontWeight: 'bold', color: colors.warning, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 6, marginBottom: 4 },
    alphaTag: { fontSize: 10, fontWeight: 'bold', color: colors.error, backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 6, marginBottom: 4 },
    lateTag: { fontSize: 10, fontWeight: 'bold', color: colors.error, marginTop: 2 },
    notesBox: { marginTop: 8, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginLeft: 44, flexDirection: 'row', alignItems: 'flex-start' },
    notesText: { fontSize: 12, fontStyle: 'italic', color: colors.textSecondary, flex: 1 },
    emptyBox: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: colors.textMuted, marginTop: 10 },
    modal: { backgroundColor: 'white', padding: 25, margin: 20, borderRadius: 25 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
    input: { marginBottom: 15, backgroundColor: 'white' },
    modalActions: { flexDirection: 'row', marginTop: 10 },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: spacing.xl,
        marginBottom: spacing.lg,
        padding: spacing.md,
        borderRadius: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.sm,
    },
    statCard: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E2E8F0',
    },
});
