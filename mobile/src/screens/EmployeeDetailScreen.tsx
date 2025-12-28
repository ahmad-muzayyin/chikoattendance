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

                {/* History List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Riwayat Kehadiran Bulan Ini</Text>
                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
                    ) : (
                        attendanceHistory.map((item: any) => (
                            <Surface key={item.id} style={styles.historyCard} elevation={0}>
                                <View style={styles.historyRow}>
                                    <View style={[styles.typeIndicator, { backgroundColor: item.type === 'CHECK_IN' ? colors.primary : '#64748B' }]}>
                                        <MaterialCommunityIcons name={item.type === 'CHECK_IN' ? 'login' : 'logout'} size={16} color="#FFF" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.historyDate}>{new Date(item.timestamp).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                                        <Text style={styles.historyTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.type}</Text>
                                        {item.isLate && <Text style={styles.lateTag}>TERLAMBAT</Text>}
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                                </View>
                                {item.notes && (
                                    <View style={styles.notesBox}>
                                        <Text style={styles.notesText}>{item.notes}</Text>
                                    </View>
                                )}
                                <Divider style={{ marginTop: 12 }} />
                            </Surface>
                        ))
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
    lateTag: { fontSize: 10, fontWeight: 'bold', color: colors.error, marginTop: 2 },
    notesBox: { marginTop: 8, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginLeft: 44 },
    notesText: { fontSize: 12, fontStyle: 'italic', color: colors.textSecondary },
    emptyBox: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: colors.textMuted, marginTop: 10 },
    modal: { backgroundColor: 'white', padding: 25, margin: 20, borderRadius: 25 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
    input: { marginBottom: 15, backgroundColor: 'white' },
    modalActions: { flexDirection: 'row', marginTop: 10 }
});
