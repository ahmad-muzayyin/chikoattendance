import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
    Animated,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {
    TextInput,
    Button,
    Text,
} from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Portal, Modal } from 'react-native-paper';
import axios from 'axios';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { getIntegrityToken } from '../utils/Integrity';

WebBrowser.maybeCompleteAuthSession();

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const navigation = useNavigation<NavProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    // Biometric & PIN State
    const [isBioAvailable, setIsBioAvailable] = useState(false);
    const [isBioEnabled, setIsBioEnabled] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [inputPin, setInputPin] = useState('');
    const [savedName, setSavedName] = useState('');
    const [initializing, setInitializing] = useState(true);

    const shakeAnim = useRef(new Animated.Value(0)).current;

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: API_CONFIG.GOOGLE_CLIENT_IDS.ANDROID,
        iosClientId: API_CONFIG.GOOGLE_CLIENT_IDS.IOS,
        webClientId: API_CONFIG.GOOGLE_CLIENT_IDS.WEB,
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleLoginResponse(id_token);
        }
    }, [response]);

    useEffect(() => {
        const checkQuickLogin = async () => {
            try {
                const bioHardware = await LocalAuthentication.hasHardwareAsync();
                const bioEnabled = await SecureStore.getItemAsync('isBiometricEnabled');
                const storedPin = await SecureStore.getItemAsync('userPin');

                // Load data
                const token = await SecureStore.getItemAsync('authToken');
                const name = await SecureStore.getItemAsync('userName');

                const hasSession = !!token;

                setIsBioAvailable(bioHardware);
                setIsBioEnabled(bioEnabled === 'true');
                setHasPin(!!storedPin);

                if (name) {
                    setSavedName(name); // Set state immediately
                }

                if (bioHardware && bioEnabled === 'true' && hasSession) {
                    // Pass current 'name' directly to avoid stale state issues in prompt
                    setTimeout(() => handleBiometricLogin(!!storedPin, name), 800);
                }
            } catch (err) {
                console.log('Error init quick login', err);
            } finally {
                setInitializing(false);
            }
        };
        checkQuickLogin();
    }, []);

    const handleGoogleLoginResponse = async (idToken: string) => {
        setLoading(true);
        setError(null);
        try {
            await SecureStore.deleteItemAsync('authToken');
            await SecureStore.deleteItemAsync('securedAuthToken');
            await SecureStore.deleteItemAsync('userPassword');

            const { data } = await axios.post(`${API_CONFIG.BASE_URL}/auth/google/login`, {
                idToken
            });

            // Log untuk debug
            const userName = data.user.name || 'Owner';
            console.log('Google Login Success. Name:', userName);

            await SecureStore.setItemAsync('authToken', data.token);
            await SecureStore.setItemAsync('userName', userName);
            await SecureStore.setItemAsync('userRole', data.user.role || 'OWNER');

            // Set savedName agar UI update
            setSavedName(userName);

            if (data.user.email) {
                await SecureStore.setItemAsync('userEmail', data.user.email);
            }

            navigation.replace('MainTabs');

        } catch (err: any) {
            setError(err?.response?.data?.message || 'Login Google gagal');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Modified to accept optional nameoverride for initial load
    const handleBiometricLogin = async (pinExists: boolean = hasPin, nameOverride?: string | null) => {
        try {
            // Priority: Name param -> State -> Default
            const displayName = nameOverride || savedName || 'User';

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: `Login kembali sebagai ${displayName}`,
                cancelLabel: pinExists ? 'Gunakan PIN' : 'Batal',
            });

            if (result.success) {
                await performQuickLogin();
            }
        } catch (error) {
            console.error('Biometric error:', error);
        }
    };

    const handlePinLogin = async () => {
        const storedPin = await SecureStore.getItemAsync('userPin');
        if (inputPin === storedPin) {
            setPinModalVisible(false);
            setInputPin('');
            await performQuickLogin();
        } else {
            setError('PIN salah');
            setInputPin('');
            shake();
        }
    };

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleLogin = async (manualEmail?: string, manualPassword?: string) => {
        const emailFinal = manualEmail || email;
        const passwordFinal = manualPassword || password;

        if (!emailFinal || !passwordFinal) {
            setError('Mohon isi email dan password');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const storedEmail = await SecureStore.getItemAsync('userEmail');
            const isDifferentUser = storedEmail && storedEmail !== emailFinal.trim().toLowerCase();

            if (isDifferentUser) {
                await SecureStore.deleteItemAsync('authToken');
                await SecureStore.deleteItemAsync('securedAuthToken');
                await SecureStore.deleteItemAsync('userPassword');
            }

            if (Platform.OS === 'android' && !__DEV__) {
                try {
                    const { token, nonce } = await getIntegrityToken();
                    const integrityRes = await axios.post(`${API_CONFIG.BASE_URL}/integrity/verify-integrity`, {
                        integrityToken: token,
                        nonce: nonce
                    });

                    if (integrityRes.data.status === 'BLOCK') {
                        setError(`Security Check Failed: ${integrityRes.data.reasons.join(', ')}`);
                        shake();
                        return;
                    }
                } catch (integrityErr) {
                    console.error("Integrity Check Failed", integrityErr);
                    // BYPASS FOR TESTING APK (Allow Sideload)
                    // In strict production we return; here we allow proceeding.
                    // alert("Warning: Integrity Check Failed. Running in Bypass Mode.");
                }
            }

            const { data } = await axios.post(
                `${API_CONFIG.BASE_URL}${ENDPOINTS.LOGIN}`,
                { email: emailFinal.trim().toLowerCase(), password: passwordFinal }
            );

            await SecureStore.deleteItemAsync('securedAuthToken');

            const userName = data.user?.name || 'User';
            setSavedName(userName);

            await SecureStore.setItemAsync('authToken', data.token);
            await SecureStore.setItemAsync('userName', userName);
            await SecureStore.setItemAsync('userRole', data.user?.role || 'EMPLOYEE');

            await SecureStore.setItemAsync('userEmail', emailFinal.trim().toLowerCase());

            if (passwordFinal) {
                await SecureStore.setItemAsync('userPassword', passwordFinal);
            }

            navigation.replace('MainTabs');
        } catch (e: any) {
            setError(e.response?.data?.message || 'Login gagal.');
            shake();
        } finally {
            setLoading(false);
        }
    };

    const performQuickLogin = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');

            if (token) {
                try {
                    const { data } = await axios.get(`${API_CONFIG.BASE_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const realName = data.name || data.user?.name || 'User';
                    const realRole = data.role || data.user?.role;

                    await SecureStore.setItemAsync('userName', realName);
                    if (realRole) await SecureStore.setItemAsync('userRole', realRole);

                    setSavedName(realName);
                    navigation.replace('MainTabs');
                    return;

                } catch (tokenErr) {
                    throw new Error('Sesi kedaluwarsa');
                }
            } else {
                throw new Error('No token found');
            }

        } catch (error: any) {
            console.log('Quick login error details:', error);

            // Jika tidak ada token (misal baru install), jangan tampilkan error, biarkan user login manual
            if (error.message === 'No token found') {
                setError(null);
            }
            // Sesi benar-benar habis/expired dari server
            else if (error.message === 'Sesi kedaluwarsa' || error.response?.status === 403 || error.response?.status === 401) {
                await SecureStore.deleteItemAsync('authToken');
                setError('Sesi telah berakhir. Mohon login ulang.');
            }
            // Error lain (koneksi, dll)
            else {
                setError('Gagal verifikasi otomatis. Silakan login manual.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!request) {
            Alert.alert('Error', 'Google sign in tidak tersedia saat ini.');
            return;
        }
        promptAsync();
    };

    // Manual handler for UI Button click (uses State savedName)
    const handleBioBtnClick = () => {
        handleBiometricLogin(hasPin, savedName);
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Background Decorations */}
            <View style={styles.headerDecoration}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.welcomeText}>
                            {savedName ? `Hai, ${savedName}` : 'Selamat Datang'}
                        </Text>
                        <Text style={styles.subtitleText}>
                            Masuk ke akun Chiko Anda
                        </Text>
                    </View>

                    {/* Form Section */}
                    <Animated.View
                        style={[
                            styles.formCard,
                            { transform: [{ translateX: shakeAnim }] }
                        ]}
                    >
                        {error && (
                            <View style={styles.errorContainer}>
                                <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="ck@chiko.com"
                            mode="outlined"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                            left={<TextInput.Icon icon="email-outline" color={colors.textMuted} />}
                        />

                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry={secureTextEntry}
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                            left={<TextInput.Icon icon="lock-outline" color={colors.textMuted} />}
                            right={
                                <TextInput.Icon
                                    icon={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                                    color={colors.textMuted}
                                />
                            }
                        />

                        <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>Lupa Password?</Text>
                        </TouchableOpacity>

                        <Button
                            mode="contained"
                            onPress={() => handleLogin()}
                            loading={loading}
                            disabled={loading}
                            style={styles.loginButton}
                            contentStyle={styles.loginButtonContent}
                        >
                            Masuk
                        </Button>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>Opsi Login Lain</Text>
                            <View style={styles.divider} />
                        </View>

                        <View style={styles.quickAccessRow}>
                            {/* Biometric Button */}
                            <View style={{ alignItems: 'center' }}>
                                <TouchableOpacity
                                    onPress={handleBioBtnClick}
                                    disabled={!isBioEnabled}
                                    style={[styles.iconBtn, !isBioEnabled && styles.iconBtnDisabled]}
                                >
                                    <MaterialCommunityIcons name="fingerprint" size={28} color={isBioEnabled ? colors.primary : colors.textMuted} />
                                </TouchableOpacity>
                                <Text style={[styles.iconLabel, !isBioEnabled && { color: colors.textMuted }]}>Bio</Text>
                            </View>

                            {/* PIN Button */}
                            <View style={{ alignItems: 'center' }}>
                                <TouchableOpacity
                                    onPress={() => setPinModalVisible(true)}
                                    disabled={!hasPin}
                                    style={[styles.iconBtn, !hasPin && styles.iconBtnDisabled]}
                                >
                                    <MaterialCommunityIcons name="numeric" size={28} color={hasPin ? colors.primary : colors.textMuted} />
                                </TouchableOpacity>
                                <Text style={[styles.iconLabel, !hasPin && { color: colors.textMuted }]}>PIN</Text>
                            </View>

                            {/* Google Button */}
                            <View style={{ alignItems: 'center' }}>
                                <TouchableOpacity onPress={handleGoogleLogin} style={styles.iconBtn}>
                                    <MaterialCommunityIcons name="google" size={26} color="#4285F4" />
                                </TouchableOpacity>
                                <Text style={styles.iconLabel}>Owner</Text>
                            </View>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </ScrollView>

            {/* PIN Modal */}
            <Portal>
                <Modal
                    visible={pinModalVisible}
                    onDismiss={() => setPinModalVisible(false)}
                    contentContainerStyle={styles.pinModal}
                >
                    <Text style={styles.pinTitle}>Masukkan PIN</Text>
                    <TextInput
                        value={inputPin}
                        onChangeText={(t) => setInputPin(t.replace(/[^0-9]/g, ''))}
                        maxLength={6}
                        keyboardType="number-pad"
                        secureTextEntry
                        style={styles.pinInput}
                        mode="outlined"
                        textAlign="center"
                        autoFocus
                    />
                    <Button
                        mode="contained"
                        onPress={handlePinLogin}
                        disabled={inputPin.length < 4}
                        style={styles.pinSubmit}
                    >
                        Verifikasi
                    </Button>
                </Modal>
            </Portal>

            {/* Loading Overlay if needed */}
            {initializing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        position: 'relative',
    },
    headerDecoration: {
        position: 'absolute',
        top: -50,
        right: -50,
        zIndex: 0,
    },
    circle: {
        position: 'absolute',
        borderRadius: 100,
    },
    circle1: {
        width: 200,
        height: 200,
        backgroundColor: '#F1F5F9',
        top: 0,
        right: 0,
    },
    circle2: {
        width: 140,
        height: 140,
        backgroundColor: '#E2E8F0',
        top: 20,
        right: 20,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    keyboardView: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xxl,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.xl,
    },
    logo: {
        width: width * 0.7,
        height: 140,
        marginBottom: spacing.md,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    subtitleText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    formCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: spacing.lg,
        ...shadows.lg,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.error}10`,
        padding: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.md,
        gap: 8,
    },
    errorText: {
        color: colors.error,
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    input: {
        backgroundColor: 'white',
        marginBottom: spacing.md,
    },
    inputOutline: {
        borderRadius: 12,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: spacing.lg,
    },
    forgotText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    loginButton: {
        borderRadius: 12,
        marginBottom: spacing.lg,
    },
    loginButtonContent: {
        paddingVertical: 6,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        marginTop: spacing.md,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.divider,
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 12,
        color: colors.textMuted,
    },
    quickAccessRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginTop: 16,
        marginBottom: 8,
    },
    iconBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconBtnDisabled: {
        backgroundColor: colors.background,
        borderColor: colors.border,
        opacity: 0.6,
    },
    iconLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },
    pinModal: {
        backgroundColor: 'white',
        padding: spacing.xl,
        margin: spacing.lg,
        borderRadius: 24,
        alignItems: 'center',
    },
    pinTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: spacing.xl,
    },
    pinInput: {
        width: '100%',
        fontSize: 24,
        letterSpacing: 10,
        marginBottom: spacing.xl,
    },
    pinSubmit: {
        width: '100%',
        borderRadius: 12,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    }
});