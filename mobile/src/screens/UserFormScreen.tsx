// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\UserFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, List, Surface, Portal, Dialog, Modal } from 'react-native-paper';
import { CustomRadioButton, CustomAlert } from '../components';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius } from '../theme/theme';
import { useAuth } from '../hooks/useAuth';

export default function UserFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const editingUser = (route.params as any)?.user;

    // Get User Role and Branch (me)
    const { user: currentUser } = useAuth();
    const isHead = currentUser?.role === 'HEAD';

    const [name, setName] = useState(editingUser?.name || '');
    const [email, setEmail] = useState(editingUser?.email || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(editingUser?.role || 'EMPLOYEE');

    // Position Logic
    const [position, setPosition] = useState(editingUser?.position || '');
    const COMMON_POSITIONS = ['Koki', 'Pelayan', 'Kasir', 'Barista', 'Helper', 'Admin', 'Supervisor'];

    // Helper function to get icon for each position
    const getPositionIcon = (position: string) => {
        const iconMap: { [key: string]: string } = {
            'Koki': 'chef-hat',
            'Pelayan': 'room-service',
            'Kasir': 'cash-register',
            'Barista': 'coffee',
            'Helper': 'hand-heart',
            'Admin': 'laptop',
            'Supervisor': 'account-tie',
        };
        return iconMap[position] || 'briefcase';
    };

    const [showPositionDialog, setShowPositionDialog] = useState(false);

    // Initial Branch Logic
    const initialBranchId = editingUser?.branchId?.toString() ||
        editingUser?.Branch?.id?.toString() ||
        (isHead ? currentUser?.branchId?.toString() : '');

    const [branchId, setBranchId] = useState(initialBranchId);

    // Shift Logic
    const [shiftId, setShiftId] = useState(editingUser?.shiftId?.toString() || editingUser?.Shift?.id?.toString() || '');
    const [shifts, setShifts] = useState<any[]>([]);
    const [showShiftDialog, setShowShiftDialog] = useState(false);

    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showBranchDialog, setShowBranchDialog] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    // CustomAlert state
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        title: '',
        message: ''
    });


    useEffect(() => {
        // Fetch branches for display purposes (even for HEAD)
        fetchBranches();
        fetchShifts();
        // HEAD users can only assign to their own branch
        if (isHead && !editingUser) {
            setBranchId(currentUser?.branchId?.toString() || '');
        }
    }, [isHead]);

    // Get selected branch name
    const selectedBranchName = isHead
        ? 'Cabang Saya' // Or fetch real name if needed, but 'Cabang Saya' is clear enough
        : (branches.find((b: any) => b.id.toString() === branchId)?.name || 'Toko Pusat / Semua');

    // Get selected shift name
    const selectedShiftName = shifts.find((s: any) => s.id.toString() === shiftId)?.name || 'Default (Ikut Jam Toko)';

    const fetchBranches = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/branches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
        } catch (e) { }
    };

    const fetchShifts = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/shifts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShifts(res.data);
        } catch (e) { }
    };

    const handleSubmit = async () => {
        if (!name || !email || (!editingUser && !password)) {
            setAlertConfig({
                type: 'warning',
                title: 'Peringatan',
                message: 'Mohon isi semua field wajib (Nama, Email, Password).'
            });
            setAlertVisible(true);
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const url = editingUser
                ? `${API_CONFIG.BASE_URL}/admin/users/${editingUser.id}`
                : `${API_CONFIG.BASE_URL}/admin/users`;

            const method = editingUser ? 'put' : 'post';

            // For HEAD users, ensure branchId is their own branch
            let finalBranchId = branchId ? parseInt(branchId) : null;
            if (isHead) {
                // HEAD must use their own branchId
                finalBranchId = parseInt(currentUser?.branchId?.toString() || '0');
            }

            const payload = {
                name,
                email,
                password: password || undefined,
                role,
                branchId: finalBranchId,
                shiftId: shiftId ? parseInt(shiftId) : null,
                position: role === 'EMPLOYEE' ? position : null
            };

            console.log('=== USER FORM DEBUG ===');
            console.log('Is HEAD:', isHead);
            console.log('Current User Branch:', currentUser?.branchId);
            console.log('Editing User:', editingUser?.id);
            console.log('Editing User Branch:', editingUser?.branchId);
            console.log('Payload:', payload);
            console.log('=====================');

            await axios[method](url, payload, { headers: { Authorization: `Bearer ${token}` } });

            // Show Custom Success Dialog
            setShowSuccessDialog(true);
        } catch (error: any) {
            setAlertConfig({
                type: 'error',
                title: 'Error',
                message: error?.response?.data?.message || 'Gagal menyimpan data user.'
            });
            setAlertVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessDialog(false);
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Surface style={styles.formCard} elevation={1}>
                {/* Header Info */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <Surface style={styles.avatarContainer} elevation={3}>
                        <Text style={styles.avatarText}>{name ? name.substring(0, 2).toUpperCase() : '??'}</Text>
                    </Surface>
                </View>

                <Text style={styles.label}>Informasi Dasar</Text>
                <TextInput
                    label="Nama Lengkap"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                    placeholder="Contoh: John Doe"
                    left={<TextInput.Icon icon="account" />}
                />

                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="user@chiko.com"
                    left={<TextInput.Icon icon="email" />}
                />

                <TextInput
                    label={editingUser ? "Password Baru (Opsional)" : "Password"}
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry
                    placeholder="Minimal 6 karakter"
                    left={<TextInput.Icon icon="lock" />}
                />

                <Text style={styles.sectionTitle}>Role / Jabatan</Text>
                <View style={styles.roleContainer}>
                    {!isHead && (
                        <TouchableOpacity
                            style={[styles.roleCard, role === 'OWNER' && styles.roleCardSelected]}
                            onPress={() => setRole('OWNER')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.roleIconContainer, role === 'OWNER' && styles.roleIconSelected]}>
                                <MaterialCommunityIcons name="crown" size={24} color={role === 'OWNER' ? colors.primary : '#6B7280'} />
                            </View>
                            <Text style={[styles.roleLabel, role === 'OWNER' && styles.roleLabelSelected]}>Owner</Text>
                            <Text style={styles.roleDescription}>Akses penuh</Text>
                            {role === 'OWNER' && <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} style={styles.roleCheck} />}
                        </TouchableOpacity>
                    )}
                    {!isHead && (
                        <TouchableOpacity
                            style={[styles.roleCard, role === 'HEAD' && styles.roleCardSelected]}
                            onPress={() => setRole('HEAD')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.roleIconContainer, role === 'HEAD' && styles.roleIconSelected]}>
                                <MaterialCommunityIcons name="account-tie" size={24} color={role === 'HEAD' ? colors.primary : '#6B7280'} />
                            </View>
                            <Text style={[styles.roleLabel, role === 'HEAD' && styles.roleLabelSelected]}>Kepala Toko</Text>
                            <Text style={styles.roleDescription}>Kelola cabang</Text>
                            {role === 'HEAD' && <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} style={styles.roleCheck} />}
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.roleCard, role === 'EMPLOYEE' && styles.roleCardSelected]}
                        onPress={() => setRole('EMPLOYEE')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.roleIconContainer, role === 'EMPLOYEE' && styles.roleIconSelected]}>
                            <MaterialCommunityIcons name="account" size={24} color={role === 'EMPLOYEE' ? colors.primary : '#6B7280'} />
                        </View>
                        <Text style={[styles.roleLabel, role === 'EMPLOYEE' && styles.roleLabelSelected]}>Karyawan</Text>
                        <Text style={styles.roleDescription}>Fitur dasar</Text>
                        {role === 'EMPLOYEE' && <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} style={styles.roleCheck} />}
                    </TouchableOpacity>
                </View>

                {role === 'EMPLOYEE' && (
                    <>
                        <Text style={styles.label}>Posisi / Pekerjaan</Text>
                        <Surface style={styles.branchSelectCard} elevation={0}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.branchSelectLabel}>Pilih Posisi</Text>
                                <Text style={styles.branchSelectValue}>{position || 'Belum dipilih'}</Text>
                            </View>
                            <Button mode="contained-tonal" onPress={() => setShowPositionDialog(true)}>
                                Pilih
                            </Button>
                        </Surface>
                    </>
                )}

                {role === 'EMPLOYEE' && (
                    <>
                        <Text style={styles.label}>Jadwal Shift</Text>
                        <Surface style={styles.branchSelectCard} elevation={0}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.branchSelectLabel}>Pilih Shift</Text>
                                <Text style={styles.branchSelectValue}>{selectedShiftName}</Text>
                            </View>
                            <Button mode="contained-tonal" onPress={() => setShowShiftDialog(true)}>
                                Ubah
                            </Button>
                        </Surface>
                    </>
                )}

                {!isHead && (
                    <>
                        <Text style={styles.label}>Penempatan Outlet</Text>
                        <Surface style={styles.branchSelectCard} elevation={0}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.branchSelectLabel}>Lokasi Outlet</Text>
                                <Text style={styles.branchSelectValue}>{selectedBranchName}</Text>
                            </View>
                            <Button mode="contained-tonal" onPress={() => setShowBranchDialog(true)}>
                                Ubah
                            </Button>
                        </Surface>
                    </>
                )}

                {isHead && (
                    <>
                        <Text style={styles.label}>Penempatan Outlet</Text>
                        <Surface style={[styles.branchSelectCard, styles.branchInfoCard]} elevation={0}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.branchSelectLabel}>Outlet</Text>
                                <Text style={styles.branchSelectValue}>{selectedBranchName}</Text>
                                <Text style={styles.branchInfoText}>Otomatis sesuai cabang Anda</Text>
                            </View>
                            <MaterialCommunityIcons name="information" size={24} color={colors.primary} />
                        </Surface>
                    </>
                )}

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.submitBtn}
                    contentStyle={{ height: 50 }}
                    icon="content-save"
                >
                    {editingUser ? 'Perbarui Data' : 'Simpan User Baru'}
                </Button>
            </Surface>

            {/* Position Selection Modal - Modern Design */}
            <Portal>
                <Modal
                    visible={showPositionDialog}
                    onDismiss={() => setShowPositionDialog(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Surface style={styles.modalSurface} elevation={5}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconContainer}>
                                <MaterialCommunityIcons name="briefcase" size={28} color={colors.primary} />
                            </View>
                            <Text style={styles.modalTitle}>Pilih Posisi</Text>
                            <Text style={styles.modalSubtitle}>Tentukan posisi pekerjaan karyawan</Text>
                        </View>

                        {/* Custom Input for Other Position */}
                        <View style={styles.modalContent}>
                            {!COMMON_POSITIONS.includes(position) && (
                                <View style={styles.customInputContainer}>
                                    <TextInput
                                        label="Posisi Kustom"
                                        value={position}
                                        onChangeText={setPosition}
                                        mode="outlined"
                                        style={styles.customPositionInput}
                                        placeholder="Ketik posisi kustom"
                                        left={<TextInput.Icon icon="pencil" />}
                                        right={<TextInput.Icon icon="close" onPress={() => setPosition('')} />}
                                    />
                                </View>
                            )}

                            <Text style={styles.sectionLabel}>Pilih posisi:</Text>

                            {/* CustomRadioButton */}
                            <ScrollView style={styles.radioScrollView} showsVerticalScrollIndicator={false}>
                                <CustomRadioButton
                                    options={[
                                        ...COMMON_POSITIONS.map(pos => ({
                                            label: pos,
                                            value: pos,
                                            icon: getPositionIcon(pos),
                                        })),
                                        { label: 'Lainnya / Custom', value: 'OTHER', icon: 'pencil-plus', description: 'Ketik posisi baru manual' }
                                    ]}
                                    value={COMMON_POSITIONS.includes(position) ? position : 'OTHER'}
                                    onSelect={(value) => {
                                        if (value === 'OTHER') {
                                            setPosition(''); // Clear to show input
                                            // Don't close dialog, let them type
                                        } else {
                                            setPosition(value);
                                            setTimeout(() => {
                                                setShowPositionDialog(false);
                                            }, 200);
                                        }
                                    }}
                                />
                            </ScrollView>
                        </View>

                        {/* Modal Actions */}
                        <View style={styles.modalActions}>
                            <Button
                                mode="outlined"
                                onPress={() => setShowPositionDialog(false)}
                                style={styles.modalCancelButton}
                                labelStyle={styles.modalCancelButtonLabel}
                            >
                                Batal
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => setShowPositionDialog(false)}
                                style={styles.modalConfirmButton}
                                labelStyle={styles.modalConfirmButtonLabel}
                                disabled={!position}
                            >
                                Selesai
                            </Button>
                        </View>
                    </Surface>
                </Modal>
            </Portal>


            {/* Branch Selection Modal - Modern Design */}
            <Portal>
                <Modal
                    visible={showBranchDialog}
                    onDismiss={() => setShowBranchDialog(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Surface style={styles.modalSurface} elevation={5}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconContainer}>
                                <MaterialCommunityIcons name="store" size={28} color={colors.primary} />
                            </View>
                            <Text style={styles.modalTitle}>Pilih Outlet</Text>
                            <Text style={styles.modalSubtitle}>Tentukan penempatan outlet karyawan</Text>
                        </View>

                        {/* Modal Content */}
                        <View style={styles.modalContent}>
                            <ScrollView style={styles.radioScrollView} showsVerticalScrollIndicator={false}>
                                <CustomRadioButton
                                    options={[
                                        { label: 'Toko Pusat / Semua', value: '', icon: 'home-city' },
                                        ...branches.map((b: any) => ({
                                            label: b.name,
                                            value: b.id.toString(),
                                            icon: 'store-marker',
                                            description: b.address || 'Outlet cabang'
                                        }))
                                    ]}
                                    value={branchId}
                                    onSelect={(value) => {
                                        setBranchId(value);
                                        // Smooth close with animation
                                        setTimeout(() => {
                                            setShowBranchDialog(false);
                                        }, 200);
                                    }}
                                />
                            </ScrollView>
                        </View>

                        {/* Modal Actions */}
                        <View style={styles.modalActions}>
                            <Button
                                mode="outlined"
                                onPress={() => setShowBranchDialog(false)}
                                style={styles.modalCancelButton}
                                labelStyle={styles.modalCancelButtonLabel}
                            >
                                Batal
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => setShowBranchDialog(false)}
                                style={styles.modalConfirmButton}
                                labelStyle={styles.modalConfirmButtonLabel}
                            >
                                Selesai
                            </Button>
                        </View>
                    </Surface>
                </Modal>
            </Portal>

            {/* Shift Selection Modal */}
            <Portal>
                <Modal
                    visible={showShiftDialog}
                    onDismiss={() => setShowShiftDialog(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Surface style={styles.modalSurface} elevation={5}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconContainer}>
                                <MaterialCommunityIcons name="clock-outline" size={28} color={colors.primary} />
                            </View>
                            <Text style={styles.modalTitle}>Pilih Shift</Text>
                            <Text style={styles.modalSubtitle}>Karyawan ini masuk shift apa?</Text>
                        </View>

                        <View style={styles.modalContent}>
                            <ScrollView style={styles.radioScrollView} showsVerticalScrollIndicator={false}>
                                <CustomRadioButton
                                    options={[
                                        { label: 'Default (Ikut Jam Toko)', value: '', icon: 'store' },
                                        ...shifts.map((s: any) => ({
                                            label: s.name,
                                            value: s.id.toString(),
                                            icon: 'clock-time-four',
                                            description: `${s.startHour} - ${s.endHour}`
                                        }))
                                    ]}
                                    value={shiftId}
                                    onSelect={(value) => {
                                        setShiftId(value);
                                        setTimeout(() => {
                                            setShowShiftDialog(false);
                                        }, 200);
                                    }}
                                />
                            </ScrollView>
                        </View>

                        <View style={styles.modalActions}>
                            <Button
                                mode="outlined"
                                onPress={() => setShowShiftDialog(false)}
                                style={styles.modalCancelButton}
                                labelStyle={styles.modalCancelButtonLabel}
                            >
                                Batal
                            </Button>
                        </View>
                    </Surface>
                </Modal>
            </Portal>

            {/* Success Modal */}
            <Portal>
                <Modal visible={showSuccessDialog} onDismiss={handleSuccessClose} contentContainerStyle={styles.successModal}>
                    <View style={styles.successContent}>
                        <Surface style={styles.successIconContainer} elevation={4}>
                            <MaterialCommunityIcons name="check" size={40} color="#FFF" />
                        </Surface>
                        <Text style={styles.successTitle}>Berhasil Diperbarui!</Text>
                        <Text style={styles.successMessage}>
                            Data karyawan <Text style={{ fontWeight: 'bold' }}>{name}</Text> telah berhasil disimpan.
                        </Text>

                        <View style={styles.successDetailItem}>
                            <MaterialCommunityIcons name="store-marker" size={20} color={colors.textSecondary} />
                            <Text style={styles.successDetailText}>Lokasi: {selectedBranchName}</Text>
                        </View>
                        <View style={styles.successDetailItem}>
                            <MaterialCommunityIcons name="shield-account" size={20} color={colors.textSecondary} />
                            <Text style={styles.successDetailText}>Role: {role}</Text>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleSuccessClose}
                            style={styles.successBtn}
                            contentStyle={{ height: 45 }}
                        >
                            Selesai & Kembali
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {/* CustomAlert for Errors/Warnings */}
            <CustomAlert
                visible={alertVisible}
                onDismiss={() => setAlertVisible(false)}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.md,
        paddingBottom: 50
    },
    formCard: {
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        marginTop: 20
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: spacing.md,
        flexWrap: 'wrap',
    },
    roleCard: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        position: 'relative',
    },
    roleCardSelected: {
        backgroundColor: '#FEF2F2',
        borderColor: colors.primary,
    },
    roleIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    roleIconSelected: {
        backgroundColor: '#FEE2E2',
    },
    roleLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    roleLabelSelected: {
        color: colors.primary,
    },
    roleDescription: {
        fontSize: 8,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    roleCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        marginLeft: 4
    },
    input: {
        marginBottom: spacing.sm,
        backgroundColor: colors.surface,
    },
    segmented: {
        marginBottom: spacing.md,
    },
    branchSelectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.divider,
        marginBottom: spacing.xl,
    },
    branchSelectLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    branchSelectValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginTop: 4,
    },
    branchInfoCard: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FEE2E2',
    },
    branchInfoText: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
        fontStyle: 'italic',
    },
    submitBtn: {
        borderRadius: borderRadius.lg,
        marginTop: spacing.sm,
        backgroundColor: colors.primary,
    },
    branchOption: {
        paddingVertical: 8,
    },
    branchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    branchOptionText: {
        fontSize: 16,
        marginLeft: 8,
    },
    successModal: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: borderRadius.xl,
        padding: 0,
        alignItems: 'center',
    },
    successContent: {
        width: '100%',
        padding: spacing.xl,
        alignItems: 'center',
    },
    successIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        marginTop: -50, // Floating effect
    },
    successTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    successMessage: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        fontSize: 14,
    },
    successDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    successDetailText: {
        marginLeft: 8,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    successBtn: {
        marginTop: spacing.lg,
        width: '100%',
        borderRadius: borderRadius.lg,
    },
    // Modern Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalSurface: {
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        maxHeight: '80%',
    },
    modalHeader: {
        alignItems: 'center',
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    modalContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    customInputContainer: {
        marginBottom: 16,
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    customPositionInput: {
        backgroundColor: '#FFFFFF',
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        marginTop: 8,
    },
    radioScrollView: {
        maxHeight: 300,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    modalCancelButton: {
        flex: 1,
        borderRadius: 12,
    },
    modalConfirmButton: {
        flex: 1,
        borderRadius: 12,
    },
    modalCancelButtonLabel: {
        color: colors.primary,
        fontWeight: '600',
    },
    modalConfirmButtonLabel: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
