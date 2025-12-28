// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\UserFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, List, Surface, Portal, Dialog, Modal, RadioButton, TouchableRipple } from 'react-native-paper';
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
    const [showPositionDialog, setShowPositionDialog] = useState(false);

    // Initial Branch Logic
    const initialBranchId = editingUser?.branchId?.toString() ||
        editingUser?.Branch?.id?.toString() ||
        (isHead ? currentUser?.branchId?.toString() : '');

    const [branchId, setBranchId] = useState(initialBranchId);

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showBranchDialog, setShowBranchDialog] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    useEffect(() => {
        if (!isHead) fetchBranches();
        if (isHead) setBranchId(currentUser?.branchId?.toString());
    }, [isHead]);

    // Get selected branch name
    const selectedBranchName = isHead
        ? 'Cabang Saya' // Or fetch real name if needed, but 'Cabang Saya' is clear enough
        : (branches.find((b: any) => b.id.toString() === branchId)?.name || 'Toko Pusat / Semua');

    const fetchBranches = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/branches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
        } catch (e) { }
    };

    const handleSubmit = async () => {
        if (!name || !email || (!editingUser && !password)) {
            Alert.alert('Peringatan', 'Mohon isi semua field wajib.');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const url = editingUser
                ? `${API_CONFIG.BASE_URL}/admin/users/${editingUser.id}`
                : `${API_CONFIG.BASE_URL}/admin/users`;

            const method = editingUser ? 'put' : 'post';

            await axios[method](url, {
                name,
                email,
                password: password || undefined,
                role,
                branchId: branchId ? parseInt(branchId) : null,
                position: role === 'EMPLOYEE' ? position : null
            }, { headers: { Authorization: `Bearer ${token}` } });

            // Show Custom Success Dialog
            setShowSuccessDialog(true);
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Gagal menyimpan data user.');
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

                <Text style={styles.label}>Role / Jabatan</Text>
                <SegmentedButtons
                    value={role}
                    onValueChange={setRole}
                    buttons={[
                        ...(isHead ? [] : [{ value: 'OWNER', label: 'Owner' }]), // Head cannot create Owner
                        ...(isHead ? [] : [{ value: 'HEAD', label: 'Head' }]),   // Head cannot create Head (usually)
                        { value: 'EMPLOYEE', label: 'Staf' },
                    ]}
                    style={styles.segmented}
                />

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

            {/* Position Selection Dialog */}
            <Portal>
                <Dialog visible={showPositionDialog} onDismiss={() => setShowPositionDialog(false)} style={{ backgroundColor: colors.surface }}>
                    <Dialog.Title style={{ textAlign: 'center', fontWeight: 'bold' }}>Pilih Posisi</Dialog.Title>
                    <Dialog.Content style={{ maxHeight: 400 }}>
                        <ScrollView>
                            <TextInput
                                label="Posisi Baru / Lainnya"
                                value={position}
                                onChangeText={setPosition}
                                mode="outlined"
                                style={[styles.input, { marginBottom: 15 }]}
                                placeholder="Ketik manual jika tidak ada di list"
                            />
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8, fontWeight: 'bold' }}>Saran Posisi:</Text>
                            {COMMON_POSITIONS.map((pos) => (
                                <TouchableRipple key={pos} onPress={() => { setPosition(pos); setShowPositionDialog(false); }} style={styles.branchOption}>
                                    <View style={styles.branchRow}>
                                        <RadioButton
                                            value={pos}
                                            status={position === pos ? 'checked' : 'unchecked'}
                                            color={colors.primary}
                                            onPress={() => { setPosition(pos); setShowPositionDialog(false); }}
                                        />
                                        <Text style={styles.branchOptionText}>{pos}</Text>
                                    </View>
                                </TouchableRipple>
                            ))}
                        </ScrollView>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowPositionDialog(false)}>Selesai</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Branch Selection Dialog */}
            <Portal>
                <Dialog visible={showBranchDialog} onDismiss={() => setShowBranchDialog(false)} style={{ backgroundColor: colors.surface }}>
                    <Dialog.Title style={{ textAlign: 'center', fontWeight: 'bold' }}>Pilih Outlet</Dialog.Title>
                    <Dialog.Content style={{ maxHeight: 400 }}>
                        <ScrollView>
                            <TouchableRipple onPress={() => { setBranchId(''); setShowBranchDialog(false); }} style={styles.branchOption}>
                                <View style={styles.branchRow}>
                                    <RadioButton
                                        value=""
                                        status={branchId === '' ? 'checked' : 'unchecked'}
                                        color={colors.primary}
                                        onPress={() => { setBranchId(''); setShowBranchDialog(false); }}
                                    />
                                    <Text style={styles.branchOptionText}>Toko Pusat / Semua</Text>
                                </View>
                            </TouchableRipple>
                            {branches.map((b: any) => (
                                <TouchableRipple key={b.id} onPress={() => { setBranchId(b.id.toString()); setShowBranchDialog(false); }} style={styles.branchOption}>
                                    <View style={styles.branchRow}>
                                        <RadioButton
                                            value={b.id.toString()}
                                            status={branchId === b.id.toString() ? 'checked' : 'unchecked'}
                                            color={colors.primary}
                                            onPress={() => { setBranchId(b.id.toString()); setShowBranchDialog(false); }}
                                        />
                                        <Text style={styles.branchOptionText}>{b.name}</Text>
                                    </View>
                                </TouchableRipple>
                            ))}
                        </ScrollView>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowBranchDialog(false)}>Batal</Button>
                    </Dialog.Actions>
                </Dialog>
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
        fontWeight: 'bold',
        color: colors.textPrimary,
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
    }
});
