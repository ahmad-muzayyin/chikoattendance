// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\ProfileScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Button, Avatar, Surface, TouchableRipple, Switch, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { useAuth } from '../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const { user, logout, checkAuth } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [unreadCount, setUnreadCount] = useState(0);

    const checkUnreadNotifications = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const response = await axios.get(`${API_CONFIG.BASE_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const unread = response.data.filter((n: any) => !n.isRead).length;
            setUnreadCount(unread);
        } catch (error) {
            console.log('Unread check failed', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await checkAuth();
        await checkUnreadNotifications();
        setRefreshing(false);
    };

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            checkUnreadNotifications();
        });
        return unsubscribe;
    }, [navigation]);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0].base64) {
            handleUpdatePhoto(result.assets[0].base64);
        }
    };

    const handleUpdatePhoto = async (base64Image: string) => {
        setUploading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const imageUri = `data:image/jpeg;base64,${base64Image}`;

            await axios.put(
                `${API_CONFIG.BASE_URL}/auth/profile`,
                { profile_picture: imageUri },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await checkAuth(); // Refresh user data
            Alert.alert('Sukses', 'Foto profil berhasil diperbarui');
        } catch (error) {
            Alert.alert('Error', 'Gagal memperbarui foto profil');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Konfirmasi', 'Yakin ingin keluar?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Keluar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                }
            }
        ]);
    };

    const MenuItem = ({ icon, title, subtitle, onPress, color = colors.primary, isDestructive = false, rightElement }: any) => (
        <TouchableRipple onPress={onPress} style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
                <View style={[styles.iconBox, { backgroundColor: isDestructive ? '#FEE2E2' : `${color}15` }]}>
                    <MaterialCommunityIcons name={icon} size={22} color={isDestructive ? colors.error : color} />
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuTitle, isDestructive && { color: colors.error }]}>{title}</Text>
                    {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
                </View>
                {rightElement ? rightElement : <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />}
            </View>
        </TouchableRipple>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={[colors.primary, '#b91313']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    {/* Watermark Logo */}
                    <View style={styles.watermarkContainer}>
                        <MaterialCommunityIcons name="fingerprint" size={200} color="rgba(255,255,255,0.1)" style={{ transform: [{ rotate: '-15deg' }] }} />
                    </View>

                    <View style={styles.profileInfo}>
                        <View style={styles.avatarContainer}>
                            <TouchableRipple onPress={pickImage} style={{ borderRadius: 40 }} disabled={uploading}>
                                {user?.profile_picture ? (
                                    <Avatar.Image
                                        size={80}
                                        source={{ uri: user.profile_picture }}
                                        style={[styles.avatar, { backgroundColor: 'white' }]}
                                    />
                                ) : (
                                    <Avatar.Text
                                        size={80}
                                        label={user?.name?.substring(0, 2).toUpperCase() || 'U'}
                                        style={[styles.avatar, { backgroundColor: 'white' }]}
                                        color={colors.primary}
                                    />
                                )}
                            </TouchableRipple>
                            {uploading && (
                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 40 }}>
                                    <ActivityIndicator color="white" />
                                </View>
                            )}
                            <TouchableOpacity onPress={pickImage} style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'white', borderRadius: 12, padding: 4 }}>
                                <MaterialCommunityIcons name="camera" size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{user?.role || 'Guest'}</Text>
                        </View>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Owner Dashboard Panel */}
                    {user?.role === 'OWNER' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>PANEL ADMIN</Text>
                            <Surface style={styles.card} elevation={1}>
                                <MenuItem
                                    icon="store-cog"
                                    title="Manajemen Outlet"
                                    subtitle="Atur lokasi & radius kantor"
                                    onPress={() => navigation.navigate('BranchList')}
                                    color={colors.info}
                                />
                                <View style={styles.divider} />
                                <MenuItem
                                    icon="account-group"
                                    title="Data Karyawan"
                                    subtitle="Tambah, edit, hapus user"
                                    onPress={() => navigation.navigate('UserList')}
                                    color={colors.secondary}
                                />
                                <View style={styles.divider} />
                                <MenuItem
                                    icon="chart-timeline-variant"
                                    title="Monitoring Absensi"
                                    subtitle="Realtime monitoring kehadiran"
                                    onPress={() => navigation.navigate('EmployeeList')}
                                    color={colors.primary}
                                />
                            </Surface>
                        </View>
                    )}

                    {/* Account Settings */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>AKUN SAYA</Text>
                        <Surface style={styles.card} elevation={1}>
                            <MenuItem
                                icon="account-cog-outline"
                                title="Edit Profil"
                                subtitle="Ubah nama & info pribadi"
                                onPress={() => navigation.navigate('Settings')}
                                color={colors.textSecondary}
                            />
                            <View style={styles.divider} />
                            <MenuItem
                                icon="lock-check-outline"
                                title="Keamanan"
                                subtitle="Ubah password & PIN"
                                onPress={() => { }}
                                color={colors.textSecondary}
                            />
                            <View style={styles.divider} />
                            <MenuItem
                                icon="bell-ring-outline"
                                title="Notifikasi"
                                onPress={() => navigation.navigate('Notifications')}
                                color={colors.textSecondary}
                                rightElement={
                                    unreadCount > 0 && (
                                        <View style={{ backgroundColor: colors.error, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                                            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
                                        </View>
                                    )
                                }
                            />
                        </Surface>
                    </View>

                    {/* App Info & Logout */}
                    <View style={styles.section}>
                        <Surface style={styles.card} elevation={1}>
                            <MenuItem
                                icon="information-outline"
                                title="Tentang Aplikasi"
                                subtitle="Versi 1.0.0 (Build 2024)"
                                onPress={() => { }}
                                color={colors.textMuted}
                            />
                            <View style={styles.divider} />
                            <MenuItem
                                icon="logout-variant"
                                title="Keluar Aplikasi"
                                subtitle="Sesi anda akan berakhir"
                                onPress={handleLogout}
                                isDestructive
                            />
                        </Surface>
                    </View>

                    <Text style={styles.footerText}>Chiko Attendance © 2024</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        position: 'relative',
        overflow: 'hidden',
    },
    watermarkContainer: {
        position: 'absolute',
        right: -50,
        bottom: -20,
        opacity: 0.6,
    },
    profileInfo: {
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        backgroundColor: '#FFF',
        elevation: 4,
    },
    roleBadge: {
        marginTop: -15, // Pull up to overlap bottom of avatar slightly
        backgroundColor: colors.warning,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFF',
        zIndex: 2,
        marginBottom: spacing.sm,
    },
    roleText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
        textTransform: 'uppercase',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    content: {
        padding: spacing.lg,
        paddingTop: spacing.xl,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        ...shadows.sm,
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginLeft: 72, // Align with text start
    },
    footerText: {
        textAlign: 'center',
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 20,
    }
});
