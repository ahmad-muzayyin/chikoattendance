// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\LoadingScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions } from 'react-native';
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
                navigation.replace(token ? 'MainTabs' : 'Login');
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
            {/* Gradient Background */}
            <LinearGradient
                colors={['#DC2626', '#991B1B', '#7F1D1D']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Animated Background Circles */}
                <View style={styles.backgroundCircles}>
                    <Animated.View
                        style={[
                            styles.circle,
                            styles.circle1,
                            { transform: [{ scale: pulseAnim }] }
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.circle,
                            styles.circle2,
                            { transform: [{ scale: pulseAnim }] }
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.circle,
                            styles.circle3,
                            { transform: [{ scale: pulseAnim }] }
                        ]}
                    />
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
                        <View style={styles.logoWrapper}>
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
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
                        <Text style={styles.appNameSub}>Attendance</Text>
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
                                color="rgba(255,255,255,0.9)"
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
                        <Text style={styles.copyrightText}>© 2025 Chiko Attendance</Text>
                    </Animated.View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        position: 'relative',
    },
    backgroundCircles: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    circle1: {
        width: 400,
        height: 400,
        top: -200,
        right: -100,
    },
    circle2: {
        width: 300,
        height: 300,
        bottom: -150,
        left: -100,
    },
    circle3: {
        width: 200,
        height: 200,
        top: height / 2 - 100,
        left: -50,
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
    },
    logoWrapper: {
        width: 140,
        height: 140,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    logo: {
        width: 120,
        height: 120,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl * 2,
    },
    appName: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: -1,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    appNameSub: {
        fontSize: 32,
        fontWeight: '300',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: -8,
        letterSpacing: 4,
        textTransform: 'uppercase',
        opacity: 0.9,
    },
    divider: {
        width: 60,
        height: 3,
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
        marginVertical: spacing.md,
        opacity: 0.8,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
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
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    versionContainer: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500',
        marginBottom: 4,
    },
    copyrightText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '400',
    },
});
