import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Surface, IconButton, useTheme, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../hooks/useAuth';

export default function NotificationsScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const response = await axios.get(`${API_CONFIG.BASE_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAllRead = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.put(`${API_CONFIG.BASE_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.put(`${API_CONFIG.BASE_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state for instant feedback
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.delete(`${API_CONFIG.BASE_URL}/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const triggerTestNotif = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.post(`${API_CONFIG.BASE_URL}/notifications/test`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Test notifikasi dikirim! Tunggu sebentar...');
        } catch (error) {
            console.error(error);
            alert('Gagal mengirim test notif');
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const renderItem = ({ item }: { item: any }) => {
        const isRead = item.isRead;
        let iconName: any = 'bell-outline';
        let iconColor = colors.primary;

        if (item.type === 'WARNING') {
            iconName = 'alert-circle-outline';
            iconColor = colors.warning;
        } else if (item.type === 'SUCCESS') {
            iconName = 'check-circle-outline';
            iconColor = colors.success;
        } else if (item.type === 'ERROR') {
            iconName = 'close-circle-outline';
            iconColor = colors.error;
        }

        return (
            <Surface style={[styles.card, !isRead && styles.unreadCard]} elevation={0}>
                <View style={styles.cardContent}>
                    <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
                        <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
                    </View>
                    <View style={styles.textContainer}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.title, !isRead && styles.unreadTitle]}>{item.title}</Text>
                            <Text style={styles.time}>
                                {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </Text>
                        </View>
                        <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
                    </View>
                </View>
                <View style={styles.actionsRow}>
                    {!isRead && (
                        <Button
                            mode="text"
                            compact
                            onPress={() => markAsRead(item.id)}
                            textColor={colors.primary}
                            labelStyle={{ fontSize: 10 }}
                        >
                            Tandai Dibaca
                        </Button>
                    )}
                    <IconButton
                        icon="trash-can-outline"
                        size={16}
                        iconColor={colors.error}
                        onPress={() => deleteNotification(item.id)}
                    />
                </View>
            </Surface>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <IconButton icon="arrow-left" iconColor="white" onPress={() => navigation.goBack()} />
                    <Text style={styles.headerTitle}>Notifikasi</Text>
                </View>
                <View style={styles.headerRight}>
                    <IconButton icon="bell-ring" iconColor="white" onPress={() => triggerTestNotif()} />
                    <IconButton icon="check-all" iconColor="white" onPress={markAllRead} />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="bell-off-outline" size={60} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Tidak ada notifikasi baru</Text>
                            <Text style={styles.emptySubText}>
                                {user?.role === 'OWNER'
                                    ? 'Aktivitas karyawan akan muncul di sini'
                                    : 'Pengumuman dan info penting akan muncul di sini'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        height: 100, // Slightly reduced height
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 4, // Reduced padding to fit buttons
        paddingBottom: 8,
        elevation: 6,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: spacing.md,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: spacing.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    unreadCard: {
        backgroundColor: '#FEF2F2', // Light red tint for unread
        borderColor: '#FECACA',
    },
    cardContent: {
        flexDirection: 'row',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        flex: 1,
    },
    unreadTitle: {
        fontWeight: 'bold',
    },
    time: {
        fontSize: 10,
        color: colors.textMuted, // Adjusted to textSecondary/Muted
        marginLeft: 8,
    },
    message: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        padding: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    emptySubText: {
        marginTop: 8,
        fontSize: 13,
        color: colors.textMuted,
        textAlign: 'center',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    }
});
