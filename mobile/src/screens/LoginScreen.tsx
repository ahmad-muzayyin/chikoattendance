// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\LoginScreen.tsx
import React, { useState, useRef } from 'react';
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
} from 'react-native';
import {
    TextInput,
    Button,
    Text,
    IconButton,
} from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import axios from 'axios';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const navigation = useNavigation<NavProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Mohon isi email dan password');
            return;
        }

        setError('');
        setLoading(true);

        try {
            console.log('Attempting login to:', `${API_CONFIG.BASE_URL}${ENDPOINTS.LOGIN}`);

            const { data } = await axios.post(
                `${API_CONFIG.BASE_URL}${ENDPOINTS.LOGIN}`,
                { email: email.trim().toLowerCase(), password }
            );

            // If login is successful, store token and navigate
            await SecureStore.setItemAsync('authToken', data.token);
            await SecureStore.setItemAsync('userName', data.user?.name || 'User');
            navigation.replace('MainTabs');
        } catch (e: any) {
            console.log('Login Error Details:', e);
            let message = 'Login gagal.';

            if (e.message === 'Network Error') {
                message = `Gagal terhubung ke server (${API_CONFIG.BASE_URL}). \nPastikan HP & Laptop di WiFi yang sama.`;
            } else if (e.response?.data?.message) {
                message = e.response.data.message;
            } else if (e.code === 'ECONNABORTED') {
                message = 'Koneksi timeout. Server tidak merespon.';
            }

            setError(message);
            shake();
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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
                    behavior={Platform.select({ ios: 'padding', android: undefined })}
                >
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoWrapper}>
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.welcomeText}>Selamat Datang</Text>
                        <Text style={styles.subtitleText}>Masuk ke akun Absensi Chiko Anda</Text>
                    </View>

                    {/* Form Section */}
                    <Animated.View
                        style={[
                            styles.formCard,
                            { transform: [{ translateX: shakeAnim }] }
                        ]}
                    >
                        {error && (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholder="Masukkan email Anda"
                                placeholderTextColor={colors.textMuted}
                                style={styles.input}
                                mode="outlined"
                                outlineColor={colors.border}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="email-outline" color={colors.textSecondary} />}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={secureTextEntry}
                                placeholder="Masukkan password"
                                placeholderTextColor={colors.textMuted}
                                style={styles.input}
                                mode="outlined"
                                outlineColor={colors.border}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="lock-outline" color={colors.textSecondary} />}
                                right={
                                    <TextInput.Icon
                                        icon={secureTextEntry ? "eye-off-outline" : "eye-outline"}
                                        color={colors.textSecondary}
                                        onPress={() => setSecureTextEntry(!secureTextEntry)}
                                    />
                                }
                            />
                        </View>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
                        </TouchableOpacity>

                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={loading}
                            disabled={loading}
                            style={styles.loginButton}
                            contentStyle={styles.loginButtonContent}
                            labelStyle={styles.loginButtonLabel}
                        >
                            {loading ? 'Memproses...' : 'Masuk'}
                        </Button>
                    </Animated.View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            ChikoAttendance v1.0.0
                        </Text>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.35,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        borderRadius: 9999,
    },
    circle1: {
        width: width * 0.8,
        height: width * 0.8,
        backgroundColor: colors.primary,
        opacity: 0.1,
        top: -width * 0.4,
        right: -width * 0.2,
    },
    circle2: {
        width: width * 0.6,
        height: width * 0.6,
        backgroundColor: colors.primary,
        opacity: 0.08,
        top: -width * 0.1,
        left: -width * 0.3,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoWrapper: {
        width: 280,
        height: 200,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        letterSpacing: -0.5,
    },
    subtitleText: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    formCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        ...shadows.md,
    },
    errorBanner: {
        backgroundColor: `${colors.error}15`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        fontWeight: '500',
    },
    inputWrapper: {
        marginBottom: spacing.md,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        fontSize: 15,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: spacing.lg,
    },
    forgotPasswordText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
    },
    loginButtonContent: {
        paddingVertical: spacing.sm,
    },
    loginButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    footer: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    footerText: {
        color: colors.textMuted,
        fontSize: 12,
    },
});