// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    RefreshControl,
    Platform,
    Image,
} from 'react-native';
import { Text, Avatar, Surface, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { user, checkAuth } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState({ hadir: 0, telat: 0, izin: 0, alpha: 0 });

    const fetchStats = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const response = await axios.get(`${API_CONFIG.BASE_URL}/attendance/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Fetch stats error:', error);
        }
    };

    // ... (existing imports)

    useEffect(() => {
        fetchStats();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        // Push Notification Setup
        registerForPushNotificationsAsync().then(token => {
            if (token) {
                // Send to backend
                SecureStore.getItemAsync('authToken').then(tokenAuth => {
                    if (tokenAuth) {
                        axios.post(`${API_CONFIG.BASE_URL}/auth/push-token`, { pushToken: token }, {
                            headers: { Authorization: `Bearer ${tokenAuth}` }
                        }).catch(err => console.log('Push token update error', err));
                    }
                });
            }
        });

        return () => clearInterval(timer);
    }, []);

    async function registerForPushNotificationsAsync() {
        let token;
        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                // alert('Failed to get push token for push notification!');
                return;
            }
            // Get the token (use project ID if configured, otherwise default)
            token = (await Notifications.getExpoPushTokenAsync()).data;
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([checkAuth(), fetchStats()]);
        setRefreshing(false);
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const QuickAction = ({ icon, title, subtitle, color, onPress, isLarge = false }: any) => (
        <TouchableOpacity
            style={[styles.actionCard, isLarge && styles.actionCardLarge]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
                <MaterialCommunityIcons name={icon} size={isLarge ? 32 : 24} color={color} />
            </View>
            <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{title}</Text>
                <Text style={styles.actionSubtitle} numberOfLines={2}>{subtitle}</Text>
            </View>
            {isLarge && (
                <View style={styles.actionArrow}>
                    <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textMuted} />
                </View>
            )}
        </TouchableOpacity>
    );

    const StatItem = ({ label, value, color }: any) => (
        <View style={styles.statItem}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Hero Section */}
            <View style={styles.header}>
                {/* Background Pattern / Watermark Logo */}
                <View style={styles.watermarkContainer}>
                    <Image
                        source={require('../../assets/hc.png')}
                        style={styles.watermarkLogo}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>{getGreeting()}</Text>
                        <Text style={styles.userName}>{user?.name || 'User'}</Text>
                        <View style={styles.roleBadge}>
                            <MaterialCommunityIcons name="shield-account" size={12} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.roleText}>{user?.role || 'Employee'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('ProfileTab' as never)}
                        activeOpacity={0.8}
                        style={styles.headerRight}
                    >
                        {user?.profile_picture ? (
                            <Avatar.Image
                                size={50}
                                source={{ uri: user.profile_picture }}
                                style={[styles.avatar, { backgroundColor: '#f0f0f0' }]}
                            />
                        ) : (
                            <Avatar.Text
                                size={50}
                                label={user?.name?.substring(0, 2).toUpperCase() || 'US'}
                                style={[styles.avatar, styles.avatarPlaceholder]}
                                color={colors.primary}
                                labelStyle={{ fontWeight: 'bold' }}
                            />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Live Clock Card - Glassmorphism */}
                <Surface style={styles.clockCard} elevation={4}>
                    <View>
                        <Text style={styles.clockTime}>
                            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
                        </Text>
                        <Text style={styles.clockDate}>{formatDate(currentTime)}</Text>
                    </View>
                    <View style={styles.clockIconBadge}>
                        <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />
                    </View>
                </Surface>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Status Summary (Clean Minimalist) */}
                <View style={styles.statsContainer}>
                    <StatItem label="Hadir" value={stats.hadir.toString()} color={colors.success} />
                    <View style={styles.statDivider} />
                    <StatItem label="Telat" value={stats.telat.toString()} color={colors.warning} />
                    <View style={styles.statDivider} />
                    <StatItem label="Izin" value={stats.izin.toString()} color={colors.info} />
                    <View style={styles.statDivider} />
                    <StatItem label="Alpha" value={stats.alpha.toString()} color={colors.error} />
                </View>

                <Text style={styles.sectionTitle}>Akses Cepat</Text>

                {/* Menu Grid */}
                <View style={styles.gridContainer}>
                    {/* Primary Action: Absensi (Full Width) */}
                    {user?.role !== 'OWNER' && (
                        <TouchableOpacity
                            style={styles.mainAction}
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('MainTabs', { screen: 'AbsenTab' })}
                        >
                            <LinearGradient
                                colors={[colors.secondary, '#059669']}
                                style={styles.mainActionGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <View style={styles.mainActionContent}>
                                    <View style={styles.mainActionIcon}>
                                        <MaterialCommunityIcons name="scan-helper" size={28} color="#FFF" />
                                    </View>
                                    <View>
                                        <Text style={styles.mainActionTitle}>Scan Absensi</Text>
                                        <Text style={styles.mainActionSubtitle}>Catat kehadiran anda sekarang</Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    <View style={styles.row}>
                        <QuickAction
                            icon="calendar-check"
                            title="Kalender"
                            subtitle="Riwayat Absen"
                            color={colors.primary}
                            onPress={() => navigation.navigate('AttendanceCalendar')}
                        />
                        <QuickAction
                            icon="file-document-outline"
                            title="Rekap"
                            subtitle="Laporan Bulanan"
                            color="#8B5CF6"
                            onPress={() => {
                                if (user?.role === 'OWNER') {
                                    navigation.navigate('OwnerRecapBranch');
                                } else {
                                    navigation.navigate('MainTabs', { screen: 'HistoryTab' });
                                }
                            }}
                        />
                    </View>

                    <View style={styles.row}>
                        <QuickAction
                            icon="star-face"
                            title="Poin Saya"
                            subtitle="Prestasi & Sanksi"
                            color={colors.warning}
                            onPress={() => navigation.navigate('Points')}
                        />
                        <QuickAction
                            icon="account-cog"
                            title="Profil"
                            subtitle="Pengaturan Akun"
                            color="#EF4444"
                            onPress={() => navigation.navigate('ProfileTab')}
                        />
                    </View>

                    {/* Owner Specific Menus */}
                    {user?.role === 'OWNER' && (
                        <View style={[styles.row, { marginTop: spacing.md }]}>
                            <QuickAction
                                icon="store-search"
                                title="Outlet"
                                subtitle="Kelola Cabang"
                                color={colors.info}
                                onPress={() => navigation.navigate('BranchList')}
                            />
                            <QuickAction
                                icon="account-group"
                                title="Karyawan"
                                subtitle="Data Pegawai"
                                color="#10B981"
                                onPress={() => navigation.navigate('UserList')}
                            />
                        </View>
                    )}
                </View>

                {/* Quote / Info Card */}
                <Surface style={styles.infoCard} elevation={1}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
                    <Text style={styles.infoText}>
                        "Disiplin adalah jembatan antara tujuan dan pencapaian."
                    </Text>
                </Surface>

            </ScrollView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.lg,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
        backgroundColor: colors.primary,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
        position: 'relative',
        paddingBottom: 40, // Increased to make room for decorations
    },
    watermarkContainer: {
        position: 'absolute',
        right: -40,
        top: -40,
        opacity: 0.2,
        zIndex: 0,
    },
    watermarkLogo: {
        width: 300,
        height: 300,
        transform: [{ rotate: '-15deg' }],
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
        zIndex: 2,
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'transparent', // Avoid white box behind image
        borderWidth: 2,
        borderColor: '#FFFFFF', // Solid white border for premium look
        overflow: 'hidden',
    },
    avatarPlaceholder: {
        backgroundColor: '#FFFFFF', // Only for text/placeholder
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    clockCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white for glass feel
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        paddingHorizontal: spacing.lg,
        zIndex: 2,
        // Elevation/Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    clockTime: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.primary, // Red time
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        letterSpacing: -1,
    },
    clockDate: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    clockIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FEE2E2', // Light red bg
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        marginTop: -20, // Overlap effect
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: spacing.lg,
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.sm,
        marginBottom: spacing.xl,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.divider,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.md,
        marginLeft: 4,
    },
    gridContainer: {
        gap: spacing.md,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    mainAction: {
        marginBottom: spacing.md,
        borderRadius: 20,
        overflow: 'hidden',
        ...shadows.md,
    },
    mainActionGradient: {
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    mainActionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    mainActionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    mainActionSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: spacing.md,
        minHeight: 110,
        justifyContent: 'space-between',
        ...shadows.sm,
    },
    actionCardLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    actionText: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 11,
        color: colors.textSecondary,
        lineHeight: 16,
    },
    actionArrow: {
        marginLeft: spacing.sm,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2FE', // Light blue bg
        padding: spacing.md,
        borderRadius: 12,
        marginTop: spacing.lg,
    },
    infoText: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 12,
        color: '#0369A1', // Darker blue text
        fontStyle: 'italic',
    },
    // New header layout styles
    headerLeft: {
        flex: 1,
    },
    headerCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoBackground: {
        width: 56,
        height: 56,
        borderRadius: 0,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    logoImage: {
        width: 48,
        height: 48,
    },
    logoText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});