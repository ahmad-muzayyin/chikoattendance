// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\LoadingScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors, spacing } from '../theme/theme';

const { width, height } = Dimensions.get('window');

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Loading'>;

export default function LoadingScreen() {
    const navigation = useNavigation<NavProp>();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Complex entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Continuous rotation for loading indicator
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        ).start();

        const bootstrap = async () => {
            await new Promise(r => setTimeout(r, 2500));
            try {
                const token = await SecureStore.getItemAsync('authToken');
                const bioEnabled = await SecureStore.getItemAsync('isBiometricEnabled');
                const storedPin = await SecureStore.getItemAsync('userPin');

                if (token) {
                    // If quick login is enabled, we still go to Login screen to "unlock"
                    // but the LoginScreen will recognize the token and perform quick auth
                    if (bioEnabled === 'true' || storedPin) {
                        navigation.replace('Login');
                    } else {
                        navigation.replace('MainTabs');
                    }
                } else {
                    navigation.replace('Login');
                }
            } catch (error) {
                console.log('Auth check error:', error);
                navigation.replace('Login');
            }
        };
        bootstrap();
    }, [navigation]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Diagonal Watermark Background (Matches LoginScreen) */}
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

            {/* Main Content */}
            <View style={styles.content}>
                {/* Logo Container */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { scale: scaleAnim },
                                { translateY: slideAnim }
                            ],
                        },
                    ]}
                >
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* App Name & Tagline */}
                <Animated.View
                    style={[
                        styles.textContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={styles.appName}>Chiko</Text>
                    <Text style={styles.appNameSub}>Absensi</Text>
                    <View style={styles.divider} />
                    <Text style={styles.tagline}>Sistem Absensi Modern & Profesional</Text>
                </Animated.View>

                {/* Loading Indicator */}
                <Animated.View
                    style={[
                        styles.loadingContainer,
                        { opacity: fadeAnim }
                    ]}
                >
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <MaterialCommunityIcons
                            name="loading"
                            size={32}
                            color={colors.primary}
                        />
                    </Animated.View>
                    <Text style={styles.loadingText}>Memuat...</Text>
                </Animated.View>

                {/* Version */}
                <Animated.View
                    style={[
                        styles.versionContainer,
                        { opacity: fadeAnim }
                    ]}
                >
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                    <Text style={styles.copyrightText}>© 2026 Chiko Absensi</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
        overflow: 'hidden',
    },
    watermarkContainer: {
        ...StyleSheet.absoluteFillObject,
        transform: [{ rotate: '-15deg' }, { scale: 1.5 }],
        top: -100,
        left: -100,
        zIndex: 0,
        opacity: 0.6,
    },
    watermarkRow: {
        flexDirection: 'row',
        marginBottom: 80,
    },
    watermarkLogoItem: {
        width: 60,
        height: 60,
        marginRight: 80,
        opacity: 0.07, // Subtle watermark
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        zIndex: 1,
    },
    logoContainer: {
        marginBottom: spacing.xl,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    logo: {
        width: 140,
        height: 140,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl * 2,
    },
    appName: {
        fontSize: 48,
        fontWeight: '800',
        color: colors.primary, // Red Text
        textAlign: 'center',
        letterSpacing: -1,
    },
    appNameSub: {
        fontSize: 32,
        fontWeight: '300',
        color: colors.textSecondary, // Dark Grey Text
        textAlign: 'center',
        marginTop: -8,
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    divider: {
        width: 60,
        height: 3,
        backgroundColor: colors.primary,
        borderRadius: 2,
        marginVertical: spacing.md,
    },
    tagline: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        fontWeight: '400',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: spacing.xl,
    },
    loadingText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    versionContainer: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
        marginBottom: 4,
    },
    copyrightText: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '400',
    },
});
