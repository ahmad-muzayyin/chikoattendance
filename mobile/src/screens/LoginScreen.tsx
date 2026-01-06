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
} from 'react-native';
import {
    TextInput,
    Button,
    Text,
    IconButton,
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
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const navigation = useNavigation<NavProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [isBioAvailable, setIsBioAvailable] = useState(false);
    const [isBioEnabled, setIsBioEnabled] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [inputPin, setInputPin] = useState('');
    const [isUnlockMode, setIsUnlockMode] = useState(false);

    const shakeAnim = useRef(new Animated.Value(0)).current;

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: API_CONFIG.GOOGLE_CLIENT_IDS.ANDROID,
        iosClientId: API_CONFIG.GOOGLE_CLIENT_IDS.IOS,
        webClientId: API_CONFIG.GOOGLE_CLIENT_IDS.WEB,
        scopes: ['profile', 'email'],
        redirectUri: API_CONFIG.EXPO_REDIRECT_URI,
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleLoginResponse(id_token);
        }
    }, [response]);

    const handleGoogleLoginResponse = async (idToken: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post(`${API_CONFIG.BASE_URL}/auth/google/login`, {
                idToken
            });
            await SecureStore.setItemAsync('authToken', data.token);
            await SecureStore.setItemAsync('userName', data.user.name || 'Owner');
            navigation.replace('MainTabs');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Login Google gagal');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkQuickLogin = async () => {
            const bioHardware = await LocalAuthentication.hasHardwareAsync();
            const bioEnabled = await SecureStore.getItemAsync('isBiometricEnabled');
            const storedPin = await SecureStore.getItemAsync('userPin');
            const token = await SecureStore.getItemAsync('authToken');
            const savedEmail = await SecureStore.getItemAsync('userEmail');
            const savedPassword = await SecureStore.getItemAsync('userPassword');
            const hasCreds = !!(savedEmail && savedPassword);

            setIsBioAvailable(bioHardware);
            setIsBioEnabled(bioEnabled === 'true');
            setHasPin(!!storedPin);
            setIsUnlockMode(!!token || hasCreds);

            if (bioHardware && bioEnabled === 'true' && (token || hasCreds)) {
                setTimeout(() => handleBiometricLogin(!!storedPin), 500);
            }
        };
        checkQuickLogin();
    }, []);

    const handleBiometricLogin = async (pinExists: boolean = hasPin) => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Login dengan Biometrik',
                cancelLabel: pinExists ? 'Gunakan PIN' : 'Gunakan Password',
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
            const { data } = await axios.post(
                `${API_CONFIG.BASE_URL}${ENDPOINTS.LOGIN}`,
                { email: emailFinal.trim().toLowerCase(), password: passwordFinal }
            );

            // Save Session
            await SecureStore.setItemAsync('authToken', data.token);
            await SecureStore.setItemAsync('userName', data.user?.name || 'User');
            await SecureStore.setItemAsync('userRole', data.user?.role || 'EMPLOYEE');

            // Save Credentials for Biometric Fallback (Token Expiry)
            await SecureStore.setItemAsync('userEmail', emailFinal.trim().toLowerCase());
            await SecureStore.setItemAsync('userPassword', passwordFinal);

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
            let token = await SecureStore.getItemAsync('securedAuthToken');
            if (!token) token = await SecureStore.getItemAsync('authToken');

            if (token) {
                try {
                    // Try validating token
                    const { data } = await axios.get(`${API_CONFIG.BASE_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Update fresh data
                    await SecureStore.setItemAsync('userName', data.name || 'User');
                    if (data.role) await SecureStore.setItemAsync('userRole', data.role);

                    navigation.replace('MainTabs');
                    return; // Success
                } catch (tokenErr) {
                    // Token expired
                }
            }

            // Fallback: Try Login with Stored Credentials
            const savedEmail = await SecureStore.getItemAsync('userEmail');
            const savedPassword = await SecureStore.getItemAsync('userPassword');

            if (savedEmail && savedPassword) {
                // Re-login using handleLogin (which handles navigation)
                await handleLogin(savedEmail, savedPassword);
            } else {
                throw new Error('No credentials found');
            }

        } catch (error) {
            setError('Sesi kedaluwarsa. Silakan login ulang.');
            setIsUnlockMode(false);
            await SecureStore.deleteItemAsync('authToken');
            await SecureStore.deleteItemAsync('securedAuthToken');
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

    const handleSwitchAccount = async () => {
        Alert.alert('Konfirmasi', 'Keluar dari mode kunci aplikasi?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Ya, Keluar',
                style: 'destructive',
                onPress: async () => {
                    await SecureStore.deleteItemAsync('authToken');
                    await SecureStore.deleteItemAsync('securedAuthToken');
                    setIsUnlockMode(false);
                    setEmail('');
                    setPassword('');
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Diagonal Watermark Background */}
            <View style={styles.watermarkContainer} pointerEvents="none">
                {[...Array(12)].map((_, i) => (
                    <View key={i} style={[styles.watermarkRow, { marginLeft: i % 2 === 0 ? -100 : -20 }]}>
                        {[...Array(5)].map((_, j) => (
                            <Image
                                key={j}
                                source={require('../../assets/logo.png')}
                                style={styles.watermarkLogoItem}
                                resizeMode="contain"
                            />
                        ))}
                    </View>
                ))}
            </View>

            {/* Header Decoration */}
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
                            {isUnlockMode ? 'Buka Aplikasi' : 'Selamat Datang'}
                        </Text>
                        <Text style={styles.subtitleText}>
                            {isUnlockMode
                                ? 'Gunakan PIN atau Biometrik untuk melanjutkan'
                                : 'Masuk ke akun Chiko Anda'}
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

                        {!isUnlockMode && (
                            <>
                                <TextInput
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
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
                                    <View style={{ alignItems: 'center' }}>
                                        <TouchableOpacity onPress={() => handleBiometricLogin()} disabled={!isBioEnabled} style={[styles.iconBtn, !isBioEnabled && styles.iconBtnDisabled]}>
                                            <MaterialCommunityIcons name="fingerprint" size={28} color={isBioEnabled ? colors.primary : colors.textMuted} />
                                        </TouchableOpacity>
                                        <Text style={[styles.iconLabel, !isBioEnabled && { color: colors.textMuted }]}>Bio</Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <TouchableOpacity onPress={() => setPinModalVisible(true)} disabled={!hasPin} style={[styles.iconBtn, !hasPin && styles.iconBtnDisabled]}>
                                            <MaterialCommunityIcons name="numeric" size={28} color={hasPin ? colors.primary : colors.textMuted} />
                                        </TouchableOpacity>
                                        <Text style={[styles.iconLabel, !hasPin && { color: colors.textMuted }]}>PIN</Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <TouchableOpacity onPress={handleGoogleLogin} style={styles.iconBtn}>
                                            <MaterialCommunityIcons name="google" size={26} color="#4285F4" />
                                        </TouchableOpacity>
                                        <Text style={styles.iconLabel}>Owner</Text>
                                    </View>
                                </View>
                            </>
                        )}

                        {isUnlockMode && (
                            <View style={styles.unlockContainer}>
                                <View style={styles.quickActions}>
                                    {isBioAvailable && isBioEnabled && (
                                        <TouchableOpacity
                                            style={styles.quickActionBtn}
                                            onPress={() => handleBiometricLogin()}
                                        >
                                            <MaterialCommunityIcons name="fingerprint" size={40} color={colors.primary} />
                                            <Text style={styles.quickActionLabel}>Biometrik</Text>
                                        </TouchableOpacity>
                                    )}
                                    {hasPin && (
                                        <TouchableOpacity
                                            style={styles.quickActionBtn}
                                            onPress={() => setPinModalVisible(true)}
                                        >
                                            <MaterialCommunityIcons name="numeric" size={40} color={colors.primary} />
                                            <Text style={styles.quickActionLabel}>PIN</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TouchableOpacity onPress={handleSwitchAccount} style={styles.switchBtn}>
                                    <Text style={styles.switchText}>Ganti Akun / Logout</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        position: 'relative',
        overflow: 'hidden',
    },
    watermarkContainer: {
        ...StyleSheet.absoluteFillObject,
        transform: [{ rotate: '-15deg' }, { scale: 1.5 }],
        top: -100,
        left: -100,
        zIndex: 0,
    },
    watermarkRow: {
        flexDirection: 'row',
        marginBottom: 80,
    },
    watermarkLogoItem: {
        width: 60,
        height: 60,
        marginRight: 80,
        // tintColor: '#000',
        opacity: 0.07,
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
    unlockContainer: {
        alignItems: 'center',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: spacing.xl,
        gap: spacing.xl,
    },
    quickActionBtn: {
        alignItems: 'center',
    },
    quickActionLabel: {
        marginTop: 8,
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    switchBtn: {
        marginTop: spacing.md,
    },
    switchText: {
        color: colors.error,
        fontWeight: '600',
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
});