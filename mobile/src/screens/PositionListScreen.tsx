import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity, Keyboard } from 'react-native';
import { Text, FAB, IconButton, ActivityIndicator, Surface, Searchbar, Dialog, Portal, TextInput, Button } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomAlert } from '../components';

export default function PositionListScreen() {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [positions, setPositions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog State
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingPosition, setEditingPosition] = useState<any>(null);
    const [positionName, setPositionName] = useState('');
    const [saving, setSaving] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<any>({ visible: false, title: '', message: '', type: 'info' });

    const fetchPositions = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/positions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPositions(res.data);
        } catch (error) {
            console.error('Fetch positions error:', error);
            // Don't show alert on initial load failure if it's just network
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) fetchPositions();
    }, [isFocused]);

    const handleSave = async () => {
        if (!positionName.trim()) {
            setAlertConfig({ visible: true, title: 'Error', message: 'Nama posisi tidak boleh kosong', type: 'error' });
            return;
        }

        setSaving(true);
        Keyboard.dismiss();
        try {
            const token = await SecureStore.getItemAsync('authToken');

            if (editingPosition) {
                // Update
                await axios.put(`${API_CONFIG.BASE_URL}/positions/${editingPosition.id}`, {
                    name: positionName
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAlertConfig({ visible: true, title: 'Sukses', message: 'Posisi berhasil diperbarui', type: 'success' });
            } else {
                // Create
                await axios.post(`${API_CONFIG.BASE_URL}/positions`, {
                    name: positionName
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAlertConfig({ visible: true, title: 'Sukses', message: 'Posisi berhasil ditambahkan', type: 'success' });
            }

            setDialogVisible(false);
            fetchPositions();
        } catch (error: any) {
            setAlertConfig({
                visible: true,
                title: 'Gagal',
                message: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: number, name: string) => {
        Alert.alert(
            'Hapus Posisi',
            `Apakah Anda yakin ingin menghapus posisi "${name}"? Karyawan dengan posisi ini akan tetap memiliki nama posisi ini sampai diubah manual.`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await SecureStore.getItemAsync('authToken');
                            await axios.delete(`${API_CONFIG.BASE_URL}/positions/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            fetchPositions();
                        } catch (e) {
                            Alert.alert('Error', 'Gagal menghapus posisi');
                        }
                    }
                }
            ]
        );
    };

    const openDialog = (position?: any) => {
        if (position) {
            setEditingPosition(position);
            setPositionName(position.name);
        } else {
            setEditingPosition(null);
            setPositionName('');
        }
        setDialogVisible(true);
    };

    const filteredPositions = positions.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <Surface style={styles.card} elevation={1}>
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="briefcase-outline" size={24} color={colors.primary} />
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.positionName}>{item.name}</Text>
                </View>

                <View style={styles.actions}>
                    <IconButton
                        icon="pencil-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => openDialog(item)}
                    />
                    <IconButton
                        icon="trash-can-outline"
                        size={20}
                        iconColor={colors.error}
                        onPress={() => handleDelete(item.id, item.name)}
                    />
                </View>
            </View>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Manajemen Posisi</Text>
                    <Text style={styles.headerSubtitle}>{positions.length} Posisi Terdaftar</Text>
                </View>
                <Searchbar
                    placeholder="Cari posisi..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor={colors.primary}
                    elevation={0}
                />
            </View>

            <FlatList
                data={filteredPositions}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchPositions} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="briefcase-off-outline" size={80} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Tidak ada posisi ditemukan</Text>
                            <Text style={styles.emptySubText}>Tambahkan posisi baru untuk karyawan Anda.</Text>
                        </View>
                    ) : (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    )
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => openDialog()}
                color="#FFFFFF"
                label="Tambah Posisi"
            />

            {/* Add/Edit Dialog */}
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
                    <Dialog.Title>{editingPosition ? 'Edit Posisi' : 'Tambah Posisi'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Nama Posisi"
                            value={positionName}
                            onChangeText={setPositionName}
                            mode="outlined"
                            style={{ backgroundColor: 'white' }}
                            autoFocus
                        />
                        {editingPosition && (
                            <Text style={styles.warningText}>
                                <MaterialCommunityIcons name="alert-circle" size={14} />
                                Mengubah nama akan mengupdate semua karyawan dengan posisi ini.
                            </Text>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)} textColor={colors.textSecondary}>Batal</Button>
                        <Button onPress={handleSave} loading={saving} disabled={saving}>Simpan</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <CustomAlert
                visible={alertConfig.visible}
                onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.sm,
    },
    headerInfo: {
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    searchBar: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        height: 45,
    },
    searchInput: {
        fontSize: 14,
        minHeight: 0,
    },
    list: {
        padding: spacing.lg,
        paddingBottom: 100
    },
    card: {
        marginBottom: spacing.sm,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        padding: spacing.md,
        alignItems: 'center'
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${colors.primary}10`,
        alignItems: 'center',
        justifyContent: 'center'
    },
    infoContainer: {
        flex: 1,
        marginLeft: spacing.md
    },
    positionName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    actions: {
        flexDirection: 'row',
    },
    fab: {
        position: 'absolute',
        margin: 20,
        right: 0,
        bottom: 20,
        backgroundColor: colors.primary,
        borderRadius: 20,
        elevation: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    emptySubText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 8,
    },
    loader: {
        marginTop: 100,
    },
    dialog: {
        backgroundColor: 'white',
        borderRadius: borderRadius.xl
    },
    warningText: {
        fontSize: 12,
        color: colors.warning,
        marginTop: 8
    }
});
