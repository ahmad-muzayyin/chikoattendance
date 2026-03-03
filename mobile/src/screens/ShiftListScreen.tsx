import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity, Keyboard } from 'react-native';
import { Text, FAB, IconButton, ActivityIndicator, Surface, Searchbar, Dialog, Portal, TextInput, Button } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomAlert } from '../components';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ShiftListScreen() {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog State
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingShift, setEditingShift] = useState<any>(null);
    const [shiftName, setShiftName] = useState('');
    const [startHour, setStartHour] = useState('08:00');
    const [endHour, setEndHour] = useState('17:00');
    const [saving, setSaving] = useState(false);

    // Time Picker States
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<any>({ visible: false, title: '', message: '', type: 'info' });

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}${ENDPOINTS.SHIFTS}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShifts(res.data);
        } catch (error) {
            console.error('Fetch shifts error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) fetchShifts();
    }, [isFocused]);

    const handleSave = async () => {
        if (!shiftName.trim()) {
            setAlertConfig({ visible: true, title: 'Error', message: 'Nama shift tidak boleh kosong', type: 'error' });
            return;
        }

        setSaving(true);
        Keyboard.dismiss();
        try {
            const token = await SecureStore.getItemAsync('authToken');

            const payload = {
                name: shiftName,
                startHour,
                endHour
            };

            if (editingShift) {
                // Update
                await axios.put(`${API_CONFIG.BASE_URL}${ENDPOINTS.SHIFTS}/${editingShift.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAlertConfig({ visible: true, title: 'Sukses', message: 'Shift berhasil diperbarui', type: 'success' });
            } else {
                // Create
                await axios.post(`${API_CONFIG.BASE_URL}${ENDPOINTS.SHIFTS}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAlertConfig({ visible: true, title: 'Sukses', message: 'Shift berhasil ditambahkan', type: 'success' });
            }

            setDialogVisible(false);
            fetchShifts();
        } catch (error: any) {
            setAlertConfig({
                visible: true,
                title: 'Gagal',
                message: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: number, name: string) => {
        Alert.alert(
            'Hapus Shift',
            `Apakah Anda yakin ingin menghapus "${name}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await SecureStore.getItemAsync('authToken');
                            await axios.delete(`${API_CONFIG.BASE_URL}${ENDPOINTS.SHIFTS}/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            fetchShifts();
                        } catch (e) {
                            Alert.alert('Error', 'Gagal menghapus shift');
                        }
                    }
                }
            ]
        );
    };

    const openDialog = (shift?: any) => {
        if (shift) {
            setEditingShift(shift);
            setShiftName(shift.name);
            setStartHour(shift.startHour);
            setEndHour(shift.endHour);
        } else {
            setEditingShift(null);
            setShiftName('');
            setStartHour('08:00');
            setEndHour('17:00');
        }
        setDialogVisible(true);
    };

    const onTimeChange = (event: any, selectedDate: Date | undefined, type: 'start' | 'end') => {
        if (type === 'start') setShowStartPicker(false);
        else setShowEndPicker(false);

        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;

            if (type === 'start') setStartHour(timeStr);
            else setEndHour(timeStr);
        }
    };

    const getTimeDate = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(h);
        d.setMinutes(m);
        return d;
    };

    const filteredShifts = shifts.filter((s: any) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <Surface style={styles.card} elevation={1}>
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="clock-time-four-outline" size={24} color={colors.primary} />
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.shiftName}>{item.name}</Text>
                    <Text style={styles.shiftTime}>{item.startHour} - {item.endHour}</Text>
                </View>

                <View style={styles.actions}>
                    <IconButton
                        icon="pencil-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => openDialog(item)}
                    />
                    <IconButton
                        icon="trash-can-outline"
                        size={20}
                        iconColor={colors.error}
                        onPress={() => handleDelete(item.id, item.name)}
                    />
                </View>
            </View>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Manajemen Shift</Text>
                    <Text style={styles.headerSubtitle}>{shifts.length} Shift Terdaftar</Text>
                </View>
                <Searchbar
                    placeholder="Cari shift..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor={colors.primary}
                    elevation={0}
                />
            </View>

            <FlatList
                data={filteredShifts}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchShifts} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="clock-alert-outline" size={80} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Tidak ada shift ditemukan</Text>
                            <Text style={styles.emptySubText}>Tambahkan shift kerja baru untuk sistem cerdas Anda.</Text>
                        </View>
                    ) : (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    )
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => openDialog()}
                color="#FFFFFF"
                label="Tambah Shift"
            />

            {/* Add/Edit Dialog */}
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
                    <Dialog.Title>{editingShift ? 'Edit Shift' : 'Tambah Shift'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Nama Shift"
                            value={shiftName}
                            onChangeText={setShiftName}
                            mode="outlined"
                            style={styles.dialogInput}
                            placeholder="Contoh: Pagi Baru 09:00"
                        />

                        <View style={styles.timeSelectRow}>
                            <TouchableOpacity style={styles.timePickerBtn} onPress={() => setShowStartPicker(true)}>
                                <Text style={styles.timePickerLabel}>Jam Masuk</Text>
                                <View style={styles.timeValueDisplay}>
                                    <MaterialCommunityIcons name="login" size={18} color={colors.success} />
                                    <Text style={styles.timeValueText}>{startHour}</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.timePickerBtn} onPress={() => setShowEndPicker(true)}>
                                <Text style={styles.timePickerLabel}>Jam Pulang</Text>
                                <View style={styles.timeValueDisplay}>
                                    <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
                                    <Text style={styles.timeValueText}>{endHour}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {showStartPicker && (
                            <DateTimePicker
                                value={getTimeDate(startHour)}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={(e, d) => onTimeChange(e, d, 'start')}
                            />
                        )}

                        {showEndPicker && (
                            <DateTimePicker
                                value={getTimeDate(endHour)}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={(e, d) => onTimeChange(e, d, 'end')}
                            />
                        )}

                        <View style={styles.infoBox}>
                            <MaterialCommunityIcons name="information-outline" size={16} color={colors.textMuted} />
                            <Text style={styles.infoText}>Sistem akan secara otomatis mendeteksi shift terdekat saat karyawan absen.</Text>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)} textColor={colors.textSecondary}>Batal</Button>
                        <Button onPress={handleSave} loading={saving} disabled={saving}>Simpan</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <CustomAlert
                visible={alertConfig.visible}
                onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.sm,
    },
    headerInfo: {
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    searchBar: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        height: 45,
    },
    searchInput: {
        fontSize: 14,
        minHeight: 0,
    },
    list: {
        padding: spacing.lg,
        paddingBottom: 100
    },
    card: {
        marginBottom: spacing.sm,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        padding: spacing.md,
        alignItems: 'center'
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${colors.primary}10`,
        alignItems: 'center',
        justifyContent: 'center'
    },
    infoContainer: {
        flex: 1,
        marginLeft: spacing.md
    },
    shiftName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    shiftTime: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    actions: {
        flexDirection: 'row',
    },
    fab: {
        position: 'absolute',
        margin: 20,
        right: 0,
        bottom: 20,
        backgroundColor: colors.primary,
        borderRadius: 20,
        elevation: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    emptySubText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 8,
    },
    loader: {
        marginTop: 100,
    },
    dialog: {
        backgroundColor: 'white',
        borderRadius: borderRadius.xl
    },
    dialogInput: {
        backgroundColor: 'white',
        marginBottom: 16
    },
    timeSelectRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16
    },
    timePickerBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.divider,
        backgroundColor: '#F9FAFB'
    },
    timePickerLabel: {
        fontSize: 11,
        color: colors.textMuted,
        marginBottom: 4,
        fontWeight: '600'
    },
    timeValueDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    timeValueText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 10,
        borderRadius: 8,
        gap: 8
    },
    infoText: {
        fontSize: 11,
        color: colors.textSecondary,
        flex: 1,
        fontStyle: 'italic'
    }
});
