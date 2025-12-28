// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\LoadingScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors, spacing } from '../theme/theme';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Loading'>;

export default function LoadingScreen() {
    const navigation = useNavigation<NavProp>();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

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
    }, [navigation, fadeAnim, scaleAnim]);

    return (
        <View style={styles.container}>
            {/* Watermark Logo */}
            <View style={styles.watermarkContainer}>
                <MaterialCommunityIcons name="fingerprint" size={400} color="rgba(255,255,255,0.05)" />
            </View>

            <View style={styles.gradientOverlay}>
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.logoWrapper}>
                        <MaterialCommunityIcons name="fingerprint" size={80} color={colors.primary} />
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.appName}>ChikoAttendance</Text>
                    <Text style={styles.tagline}>Sistem Absensi Modern</Text>
                </Animated.View>

                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
        position: 'relative',
        overflow: 'hidden',
    },
    watermarkContainer: {
        position: 'absolute',
        bottom: -100,
        right: -100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        backgroundColor: 'transparent', // Make transparent so watermark shows
    },
    logoContainer: {
        marginBottom: spacing.lg,
    },
    logoWrapper: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    logo: {
        width: 100,
        height: 100,
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: spacing.xs,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        fontWeight: '400',
    },
    loader: {
        position: 'absolute',
        bottom: 60,
    },
});