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
    Animated,
    ViewStyle,
} from 'react-native';
import { Text, Avatar, Surface, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { NotificationService } from '../services/NotificationService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { user, checkAuth } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState({ hadir: 0, telat: 0, lembur: 0, izin: 0, alpha: 0 });
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

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
        const syncData = async () => {
            await fetchStats();

            // Check Today's Attendance for Notification Sync
            try {
                const token = await SecureStore.getItemAsync('authToken');
                const { data } = await axios.get(
                    `${API_CONFIG.BASE_URL}${ENDPOINTS.CALENDAR}?deviceId=MOBILE_APP`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const todayStr = new Date().toLocaleDateString('en-CA');
                const todayRecord = data.find((r: any) => r.date === todayStr);

                const hasCheckedIn = !!todayRecord?.checkInTime;
                const hasCheckedOut = !!todayRecord?.checkOutTime;

                // Sync Notifications
                NotificationService.updatePushToken();
                const start = (user as any)?.shift?.startTime || "08:00";
                const end = (user as any)?.shift?.endTime || "17:00";

                NotificationService.scheduleAttendanceReminder(start, end, hasCheckedIn, hasCheckedOut);
            } catch (e) {
                console.log('Sync notification error', e);
            }
        };

        syncData();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [user]);

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

    const QuickAction = ({ icon, title, subtitle, color, onPress, isFullWidth = false }: any) => (
        <Animated.View style={[{ flex: isFullWidth ? 0 : 1, width: isFullWidth ? '100%' : 'auto', opacity: fadeAnim }]}>
            <TouchableOpacity
                style={[styles.actionCard, isFullWidth && styles.actionCardFull]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={[isFullWidth ? styles.actionCardLeftFull : styles.actionCardTop]}>
                    <View style={[styles.actionIconContainer, { backgroundColor: `${color}12` }]}>
                        <MaterialCommunityIcons name={icon} size={isFullWidth ? 26 : 22} color={color} />
                    </View>
                </View>
                <View style={[isFullWidth ? styles.actionTextContainerFull : styles.actionTextContainer]}>
                    <Text style={styles.actionTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.actionSubtitle} numberOfLines={1}>{subtitle}</Text>
                </View>
                {isFullWidth && (
                    <View style={styles.fullWidthArrow}>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );

    const StatItem = ({ label, value, color, icon }: any) => (
        <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: `${color}08` }]}>
                <MaterialCommunityIcons name={icon} size={18} color={color} />
            </View>
            <View style={styles.statTextGroup}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
            </View>
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
                {/* Status Summary */}
                {user?.role !== 'OWNER' ? (
                    <Animated.View style={[styles.statsSection, { opacity: fadeAnim }]}>
                        <View style={styles.statsGrid}>
                            <StatItem label="Hadir" value={stats.hadir} color={colors.success} icon="check-all" />
                            <StatItem label="Telat" value={stats.telat} color={colors.warning} icon="clock-alert" />
                            <StatItem label="Izin" value={stats.izin} color={colors.info} icon="calendar-text" />
                            <StatItem label="Alpha" value={stats.alpha} color={colors.error} icon="close-circle" />
                        </View>
                    </Animated.View>
                ) : (
                    <Animated.View style={[styles.ownerSummaryBox, { opacity: fadeAnim }]}>
                        <Surface style={styles.ownerSummarySurface} elevation={2}>
                            <View style={styles.ownerSummaryContent}>
                                <View>
                                    <Text style={styles.ownerSummaryLabel}>Karyawan Hadir Hari Ini</Text>
                                    <Text style={styles.ownerSummaryValue}>{stats.hadir}</Text>
                                </View>
                                <View style={styles.ownerSummaryBadge}>
                                    <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
                                </View>
                            </View>
                        </Surface>
                    </Animated.View>
                )}

                <Text style={styles.sectionTitle}>Menu Utama</Text>
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

                    {/* Dynamic Menu Generation */}
                    {(() => {
                        const menus = [];

                        // 1. Monitoring / Calendar
                        menus.push({
                            icon: ['OWNER', 'HEAD'].includes(user?.role || '') ? "clipboard-list" : "calendar-check",
                            title: ['OWNER', 'HEAD'].includes(user?.role || '') ? "Monitoring" : "Kalender",
                            subtitle: ['OWNER', 'HEAD'].includes(user?.role || '') ? "Kehadiran Tim" : "Riwayat Absen",
                            color: colors.primary,
                            onPress: () => {
                                if (['OWNER', 'HEAD'].includes(user?.role || '')) navigation.navigate('EmployeeList');
                                else navigation.navigate('AttendanceCalendar');
                            }
                        });

                        // 2. Rekap
                        menus.push({
                            icon: "file-document-outline",
                            title: "Rekap",
                            subtitle: "Laporan Bulanan",
                            color: "#8B5CF6",
                            onPress: () => {
                                if (user?.role === 'OWNER') navigation.navigate('OwnerRecapBranch');
                                else navigation.navigate('MainTabs', { screen: 'HistoryTab' });
                            }
                        });

                        // 3. Poin / Leaderboard
                        if (user?.role === 'OWNER') {
                            menus.push({
                                icon: "trophy-award",
                                title: "Leaderboard",
                                subtitle: "Top Karyawan",
                                color: "#EAB308",
                                onPress: () => navigation.navigate('Leaderboard')
                            });
                        } else {
                            menus.push({
                                icon: "star-face",
                                title: "Poin Saya",
                                subtitle: "Prestasi & Sanksi",
                                color: colors.warning,
                                onPress: () => navigation.navigate('Points')
                            });
                        }

                        // 4. Profil
                        menus.push({
                            icon: "account-cog",
                            title: "Profil",
                            subtitle: "Pengaturan Akun",
                            color: "#EF4444",
                            onPress: () => navigation.navigate('ProfileTab')
                        });

                        // 5. Cuti
                        menus.push({
                            icon: user?.role === 'OWNER' ? "calendar-clock" : "calendar-edit",
                            title: user?.role === 'OWNER' ? "Manajemen Cuti" : "Ajukan Cuti",
                            subtitle: user?.role === 'OWNER' ? "Persetujuan Izin" : "Izin/Sakit/Cuti",
                            color: "#06B6D4",
                            onPress: () => {
                                if (user?.role === 'OWNER') navigation.navigate('LeaveManagement');
                                else navigation.navigate('LeaveRequest');
                            }
                        });

                        // 6. Leaderboard (for non-owner)
                        if (user?.role !== 'OWNER') {
                            menus.push({
                                icon: "trophy-award",
                                title: "Leaderboard",
                                subtitle: "Peringkat",
                                color: "#EAB308",
                                onPress: () => navigation.navigate('Leaderboard')
                            });
                        }

                        // 7. Owner/Head Specifics
                        if (user?.role === 'OWNER') {
                            menus.push({
                                icon: "store-search", title: "Outlet", subtitle: "Kelola Cabang", color: colors.info,
                                onPress: () => navigation.navigate('BranchList')
                            });
                            menus.push({
                                icon: "account-group", title: "Karyawan", subtitle: "Data Pegawai", color: "#10B981",
                                onPress: () => navigation.navigate('UserList')
                            });
                            menus.push({
                                icon: "clock-edit-outline", title: "Jam Shift", subtitle: "Atur Shift", color: "#F97316",
                                onPress: () => navigation.navigate('ShiftList')
                            });
                            menus.push({
                                icon: "briefcase-edit-outline", title: "Posisi", subtitle: "Jabatan", color: "#6366F1",
                                onPress: () => navigation.navigate('PositionList')
                            });
                        } else if (user?.role === 'HEAD') {
                            menus.push({
                                icon: "account-group", title: "Karyawan", subtitle: "Data Pegawai", color: "#10B981",
                                onPress: () => navigation.navigate('UserList')
                            });
                        }

                        // 8. Event
                        if (['OWNER', 'HEAD'].includes(user?.role || '')) {
                            menus.push({
                                icon: "calendar-star", title: "Event", subtitle: "Jadwal Khusus", color: "#EC4899",
                                onPress: () => navigation.navigate('EventManagement')
                            });
                        }

                        // Render in rows of 2
                        const rows = [];
                        for (let i = 0; i < menus.length; i += 2) {
                            if (i + 1 < menus.length) {
                                rows.push(
                                    <View key={`row-${i}`} style={styles.row}>
                                        <QuickAction {...menus[i]} />
                                        <QuickAction {...menus[i + 1]} />
                                    </View>
                                );
                            } else {
                                // Odd item - Full Width
                                rows.push(
                                    <View key={`row-${i}`} style={styles.row}>
                                        <QuickAction {...menus[i]} isFullWidth />
                                    </View>
                                );
                            }
                        }
                        return rows;
                    })()}

                </View>

                {/* Quote / Info Card */}
                <Surface style={styles.infoCard} elevation={1}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
                    <Text style={styles.infoText}>
                        "Disiplin adalah jembatan antara tujuan dan pencapaian."
                    </Text>
                </Surface>
            </ScrollView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.primary,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 60,
        position: 'relative',
    },
    watermarkContainer: {
        position: 'absolute',
        right: -30,
        top: -30,
        opacity: 0.1,
    },
    watermarkLogo: {
        width: 250,
        height: 250,
        transform: [{ rotate: '-10deg' }],
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    userName: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: 'bold',
        marginTop: 2,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    headerRight: {
        marginLeft: 15,
    },
    avatar: {
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    avatarPlaceholder: {
        backgroundColor: '#FFF',
    },
    clockCard: {
        position: 'absolute',
        bottom: -30,
        left: spacing.lg,
        right: spacing.lg,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.md,
    },
    clockTime: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
        letterSpacing: 0.5,
    },
    clockDate: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '500',
        marginTop: 1,
    },
    clockIconBadge: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 50,
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
    },
    statsSection: {
        marginBottom: 25,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statBox: {
        flex: 1,
        minWidth: '46%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.sm,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statTextGroup: {
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    ownerSummaryBox: {
        marginBottom: 25,
    },
    ownerSummarySurface: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        ...shadows.md,
    },
    ownerSummaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ownerSummaryLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
        marginBottom: 4,
    },
    ownerSummaryValue: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    ownerSummaryBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: `${colors.primary}08`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.primary, // Red accent for section titles
        marginBottom: 15,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    gridContainer: {
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    mainAction: {
        backgroundColor: colors.primary,
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: 6,
        ...shadows.md,
    },
    mainActionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    mainActionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    mainActionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
    },
    mainActionSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 18,
        minHeight: 125,
        justifyContent: 'space-between',
        ...shadows.sm,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    actionCardFull: {
        minHeight: 80,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    actionCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    actionCardLeftFull: {
        marginRight: 15,
    },
    actionIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTextContainer: {
        width: '100%',
    },
    actionTextContainerFull: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    actionSubtitle: {
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },
    fullWidthArrow: {
        backgroundColor: '#F8FAFC',
        padding: 4,
        borderRadius: 8,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '500',
        lineHeight: 16,
    },
});
