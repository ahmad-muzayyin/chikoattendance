import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Share } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';

export default function BackupManagementScreen() {
    const [backups, setBackups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/admin/backups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBackups(res.data);
        } catch (error) {
            console.error('Fetch backups error:', error);
            Alert.alert('Error', 'Gagal mengambil daftar backup');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setActionLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.post(`${API_CONFIG.BASE_URL}/admin/backups`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert('Sukses', 'Backup database berhasil dibuat');
            fetchBackups();
        } catch (error) {
            Alert.alert('Error', 'Gagal membuat backup');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBackup = (fileName: string) => {
        Alert.alert('Konfirmasi', 'Yakin ingin menghapus backup ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const token = await SecureStore.getItemAsync('authToken');
                        await axios.delete(`${API_CONFIG.BASE_URL}/admin/backups/${fileName}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchBackups();
                    } catch (error) {
                        Alert.alert('Error', 'Gagal menghapus backup');
                    }
                }
            }
        ]);
    };

    const handleDownload = async (fileName: string) => {
        // In a real app, you might use Linking or FileSystem
        // For now, we'll show the URL or simulate a download/share
        const url = `${API_CONFIG.BASE_URL}/admin/backups/download/${fileName}`;
        Alert.alert('Link Download', url, [
            { text: 'Copy', onPress: () => Share.share({ message: url }) },
            { text: 'Tutup' }
        ]);
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderItem = ({ item }: { item: any }) => (
        <Surface style={styles.card} elevation={1}>
            <View style={styles.cardIcon}>
                <MaterialCommunityIcons name="database-arrow-down" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.fileInfo}>
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • {formatSize(item.size)}
                </Text>
            </View>
            <View style={styles.cardActions}>
                <IconButton icon="download" iconColor={colors.primary} size={20} onPress={() => handleDownload(item.name)} />
                <IconButton icon="delete-outline" iconColor={colors.error} size={20} onPress={() => handleDeleteBackup(item.name)} />
            </View>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Database Backup</Text>
                    <Text style={styles.headerSubtitle}>Kelola pencadangan data sistem</Text>
                </View>
                <Button
                    mode="contained"
                    onPress={handleCreateBackup}
                    loading={actionLoading}
                    disabled={actionLoading}
                    style={styles.backupBtn}
                >
                    Backup Sekarang
                </Button>
            </View>

            <FlatList
                data={backups}
                keyExtractor={(item) => item.name}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBackups} colors={[colors.primary]} />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="database-off" size={60} color={`${colors.primary}20`} />
                            <Text style={styles.emptyText}>Belum ada data backup</Text>
                        </View>
                    ) : null
                }
            />

            {loading && !backups.length && (
                <View style={styles.loader}>
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
    },
    header: {
        padding: spacing.lg,
        backgroundColor: 'white',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.sm,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    backupBtn: {
        borderRadius: 12,
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: `${colors.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    fileInfo: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 15,
        color: colors.textMuted,
        fontSize: 16,
    },
    loader: {
        marginTop: 50,
    }
});
