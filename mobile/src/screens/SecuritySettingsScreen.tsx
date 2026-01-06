// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\SecuritySettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { Text, Surface, Switch, TouchableRipple, Portal, Modal, Button, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import useAuth from '../hooks/useAuth';
import { API_CONFIG } from '../config/api';
import axios from 'axios';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

if (Platform.OS === 'web') {
    WebBrowser.maybeCompleteAuthSession();
}

export default function SecuritySettingsScreen() {
    const navigation = useNavigation();
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState<string>('');
    const { user } = useAuth();
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [googleLinked, setGoogleLinked] = useState(false);
    const [linkingGoogle, setLinkingGoogle] = useState(false);



    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: API_CONFIG.GOOGLE_CLIENT_IDS.ANDROID,
        iosClientId: API_CONFIG.GOOGLE_CLIENT_IDS.IOS,
        webClientId: API_CONFIG.GOOGLE_CLIENT_IDS.WEB,
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleResponse(id_token);
        } else if (response?.type === 'error') {
            // Error ini wajar terjadi di Expo Go jika package name tidak sesuai
            Alert.alert('Gagal Linking', 'Pastikan Anda menggunakan APK Development Build (bukan Expo Go) agar Package Name sesuai dengan Google Cloud Console.');
            console.error('Google Auth Error:', response.error);
        }
    }, [response]);

    const handleGoogleResponse = async (idToken: string) => {
        setLinkingGoogle(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.post(`${API_CONFIG.BASE_URL}/auth/google/link`,
                { idToken },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setGoogleLinked(true);
            Alert.alert('Sukses', 'Akun Google berhasil ditautkan!');
        } catch (e) {
            Alert.alert('Error', 'Gagal menautkan Google. Silakan coba lagi.');
            console.error(e);
        } finally {
            setLinkingGoogle(false);
        }
    };

    // PIN Setup Modal
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState(1); // 1: Enter PIN, 2: Confirm PIN

    useEffect(() => {
        checkHardware();
        loadSettings();
    }, []);

    const checkHardware = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsBiometricAvailable(compatible);

        if (compatible) {
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                setBiometricType('FaceID / Face Recognition');
            } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                setBiometricType('Fingerprint');
            } else {
                setBiometricType('Biometric');
            }
        }
    };

    const loadSettings = async () => {
        try {
            const bioEnabled = await SecureStore.getItemAsync('isBiometricEnabled');
            setIsBiometricEnabled(bioEnabled === 'true');

            const storedPin = await SecureStore.getItemAsync('userPin');
            setHasPin(!!storedPin);

            // Check if google is already linked (Only for OWNER)
            if (user?.role === 'OWNER') {
                const res = await axios.get(`${API_CONFIG.BASE_URL}/auth/me`);
                if (res.data.googleId) {
                    setGoogleLinked(true);
                }
            }
        } catch (e) {
            console.error('Load settings error:', e);
        }
    };

    const toggleBiometric = async (value: boolean) => {
        if (value) {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Konfirmasi Biometrik',
                cancelLabel: 'Batal',
            });

            if (result.success) {
                const token = await SecureStore.getItemAsync('authToken');
                if (token) {
                    await SecureStore.setItemAsync('securedAuthToken', token);
                    await SecureStore.setItemAsync('isBiometricEnabled', 'true');
                    setIsBiometricEnabled(true);
                    Alert.alert('Sukses', 'Biometrik berhasil diaktifkan');
                } else {
                    Alert.alert('Error', 'Sesi tidak ditemukan. Silakan login ulang.');
                }
            } else {
                setIsBiometricEnabled(false);
            }
        } else {
            await SecureStore.setItemAsync('isBiometricEnabled', 'false');
            setIsBiometricEnabled(false);
        }
    };

    const handleSavePin = async () => {
        if (pin.length < 4) {
            Alert.alert('Error', 'PIN harus minimal 4 digit');
            return;
        }

        if (pin !== confirmPin) {
            Alert.alert('Error', 'PIN konfirmasi tidak cocok');
            setStep(1);
            setPin('');
            setConfirmPin('');
            return;
        }

        try {
            const token = await SecureStore.getItemAsync('authToken');
            if (token) {
                await SecureStore.setItemAsync('securedAuthToken', token);
                await SecureStore.setItemAsync('userPin', pin);
                setHasPin(true);
                setPinModalVisible(false);
                setPin('');
                setConfirmPin('');
                setStep(1);
                Alert.alert('Sukses', 'PIN berhasil disimpan');
            }
        } catch (error) {
            Alert.alert('Error', 'Gagal menyimpan PIN');
        }
    };

    const removePin = () => {
        Alert.alert(
            'Konfirmasi',
            'Yakin ingin menghapus PIN?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('userPin');
                        setHasPin(false);
                    }
                }
            ]
        );
    };

    const handleLinkGoogle = async () => {
        if (!request) {
            Alert.alert('Error', 'Google sign in tidak tersedia saat ini.');
            return;
        }
        promptAsync();
    };

    const SecurityItem = ({ icon, title, subtitle, right, onPress }: any) => (
        <TouchableRipple onPress={onPress}>
            <View style={styles.item}>
                <View style={styles.itemIcon}>
                    <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{title}</Text>
                    {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
                </View>
                <View>{right}</View>
            </View>
        </TouchableRipple>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.sectionHeader}>LOGIN CEPAT</Text>
                <Surface style={styles.card} elevation={1}>
                    {isBiometricAvailable && (
                        <>
                            <SecurityItem
                                icon="fingerprint"
                                title="Biometrik"
                                subtitle={`Gunakan ${biometricType} untuk login`}
                                right={
                                    <Switch
                                        value={isBiometricEnabled}
                                        onValueChange={toggleBiometric}
                                        color={colors.primary}
                                    />
                                }
                            />
                            <View style={styles.divider} />
                        </>
                    )}

                    <SecurityItem
                        icon="numeric"
                        title="PIN Keamanan"
                        subtitle={hasPin ? 'PIN sudah aktif' : 'Gunakan PIN untuk login'}
                        onPress={() => hasPin ? removePin() : setPinModalVisible(true)}
                        right={
                            <MaterialCommunityIcons
                                name={hasPin ? "delete-outline" : "plus"}
                                size={24}
                                color={hasPin ? colors.error : colors.textMuted}
                            />
                        }
                    />
                    {hasPin && (
                        <>
                            <View style={styles.divider} />
                            <SecurityItem
                                icon="form-textbox-password"
                                title="Ubah PIN"
                                onPress={() => {
                                    setStep(1);
                                    setPin('');
                                    setConfirmPin('');
                                    setPinModalVisible(true);
                                }}
                            />
                        </>
                    )}
                </Surface>

                {user?.role === 'OWNER' && (
                    <>
                        <Text style={[styles.sectionHeader, { marginTop: spacing.xl }]}>GOOGLE AUTH (OWNER ONLY)</Text>
                        <Surface style={styles.card} elevation={1}>
                            <SecurityItem
                                icon="google"
                                title="Tautkan Akun Google"
                                subtitle={googleLinked ? 'Akun Google sudah tertaut' : 'Gunakan untuk login saat lupa password'}
                                onPress={handleLinkGoogle}
                                right={
                                    linkingGoogle ? <ActivityIndicator size="small" color={colors.primary} /> :
                                        <MaterialCommunityIcons
                                            name={googleLinked ? "check-circle" : "link-variant"}
                                            size={24}
                                            color={googleLinked ? colors.success : colors.primary}
                                        />
                                }
                            />
                        </Surface>
                    </>
                )}

                <Text style={[styles.sectionHeader, { marginTop: spacing.xl }]}>PASSWORD</Text>
                <Surface style={styles.card} elevation={1}>
                    <SecurityItem
                        icon="lock-outline"
                        title="Ubah Password"
                        subtitle="Update password akun Anda"
                        onPress={() => { }}
                    />
                </Surface>

                <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.infoText}>
                        Login cepat (PIN & Biometrik) hanya berlaku di perangkat ini. Akun Google berguna untuk pemulihan akses Owner.
                    </Text>
                </View>
            </ScrollView>

            <Portal>
                <Modal visible={pinModalVisible} onDismiss={() => setPinModalVisible(false)} contentContainerStyle={styles.modal}>
                    <Text style={styles.modalTitle}>{step === 1 ? 'Masukkan PIN Baru' : 'Konfirmasi PIN Baru'}</Text>
                    <TextInput
                        value={step === 1 ? pin : confirmPin}
                        onChangeText={(text) => {
                            const numericText = text.replace(/[^0-9]/g, '');
                            if (step === 1) setPin(numericText);
                            else setConfirmPin(numericText);
                        }}
                        maxLength={6}
                        keyboardType="number-pad"
                        secureTextEntry
                        style={styles.pinInput}
                        mode="outlined"
                        textAlign="center"
                    />
                    <View style={styles.modalButtons}>
                        <Button onPress={() => setPinModalVisible(false)} style={{ flex: 1 }}>Batal</Button>
                        <Button mode="contained" onPress={() => step === 1 ? setStep(2) : handleSavePin()} style={{ flex: 1, marginLeft: spacing.md }}>
                            {step === 1 ? 'Lanjut' : 'Simpan'}
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg },
    sectionHeader: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm, marginLeft: spacing.xs, letterSpacing: 1 },
    card: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', ...shadows.sm },
    item: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    itemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}10`, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    itemContent: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    itemSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    divider: { height: 1, backgroundColor: colors.divider, marginLeft: 72 },
    infoBox: { flexDirection: 'row', backgroundColor: `${colors.info}10`, padding: 16, borderRadius: 12, marginTop: spacing.xl, alignItems: 'flex-start' },
    infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    modal: { backgroundColor: 'white', padding: 24, margin: 20, borderRadius: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
    pinInput: { width: '100%', fontSize: 24, letterSpacing: 8, marginBottom: 24 },
    modalButtons: { flexDirection: 'row', width: '100%' }
});
