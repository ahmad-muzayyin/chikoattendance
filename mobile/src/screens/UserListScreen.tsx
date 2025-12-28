// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\UserListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { Text, FAB, Surface, IconButton, ActivityIndicator, Avatar, Searchbar, Chip, Portal, Dialog, Button } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ROLES = [
    { label: 'Semua', value: 'ALL' },
    { label: 'Owner', value: 'OWNER' },
    { label: 'Kepala Toko', value: 'HEAD' },
    { label: 'Staf', value: 'EMPLOYEE' },
];

import { useAuth } from '../hooks/useAuth';

export default function UserListScreen() {
    console.log('UserListScreen: Component Render');
    const { user: currentUser } = useAuth();
    const isHead = currentUser?.role === 'HEAD';
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState(isHead ? 'EMPLOYEE' : 'ALL');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/admin/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('🔍 UserListScreen - API Response:', res.data);
            console.log('🔍 UserListScreen - Total users:', res.data.length);
            console.log('🔍 UserListScreen - Current user role:', currentUser?.role);
            console.log('🔍 UserListScreen - isHead:', isHead);
            console.log('🔍 UserListScreen - selectedRole:', selectedRole);
            setUsers(res.data);
        } catch (error) {
            console.log('❌ UserListScreen - Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) fetchUsers();
    }, [isFocused]);

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: number, name: string } | null>(null);

    const confirmDelete = (id: number, name: string) => {
        setUserToDelete({ id, name });
        setDeleteDialogVisible(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.delete(`${API_CONFIG.BASE_URL}/admin/users/${userToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
            setDeleteDialogVisible(false);
            setUserToDelete(null);
        } catch (e) {
            // Optional: Show error toast/dialog
        }
    };

    // Cleaned up
    console.log('UserListScreen Refresh');

    const filteredUsers = users.filter((u: any) => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;

        if (!matchesRole) {
            console.log(`🔍 Filtered out ${u.name} - role: ${u.role}, selectedRole: ${selectedRole}`);
        }

        return matchesSearch && matchesRole;
    });

    console.log('🔍 UserListScreen - Filtered users count:', filteredUsers.length);

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'OWNER': return '#2563EB'; // Blue
            case 'HEAD': return '#7C3AED'; // Purple
            default: return '#059669'; // Emerald
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'OWNER': return 'Owner';
            case 'HEAD': return 'Kepala Toko';
            default: return 'Staf';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <Surface style={styles.card} elevation={1}>
            <View style={styles.cardContent}>
                <View style={styles.avatarContainer}>
                    <Avatar.Text
                        size={50}
                        label={item.name.substring(0, 2).toUpperCase()}
                        style={{ backgroundColor: getRoleColor(item.role) }}
                        color="#FFF"
                    />
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                        {(item.Branch || item.branch) ? (
                            <View style={styles.branchBadge}>
                                <MaterialCommunityIcons name="store-marker" size={12} color={colors.textSecondary} />
                                <Text style={styles.branchText}>{(item.Branch || item.branch).name}</Text>
                            </View>
                        ) : (
                            <View style={[styles.branchBadge, { backgroundColor: '#F3F4F6' }]}>
                                <MaterialCommunityIcons name="domain" size={12} color={colors.textMuted} />
                                <Text style={styles.branchText}>Pusat / Semua</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.userEmail}>{item.email}</Text>

                    <View style={styles.roleContainer}>
                        <View style={[styles.roleBadge, { borderColor: getRoleColor(item.role), borderWidth: 1 }]}>
                            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                                {item.role === 'EMPLOYEE' && item.position ? item.position : getRoleLabel(item.role)}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionColumn}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                        onPress={() => navigation.navigate('UserForm' as any, { user: item })}
                    >
                        <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#FEF2F2', marginTop: 8 }]}
                        onPress={() => confirmDelete(item.id, item.name)}
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Searchbar
                    placeholder="Cari user..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={{ fontSize: 14 }}
                    elevation={0}
                />
                {!isHead && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {ROLES.map((role) => (
                            <Chip
                                key={role.value}
                                selected={selectedRole === role.value}
                                onPress={() => setSelectedRole(role.value)}
                                style={[
                                    styles.chip,
                                    selectedRole === role.value && { backgroundColor: '#EFF6FF', borderColor: colors.primary }
                                ]}
                                textStyle={selectedRole === role.value ? { color: colors.primary, fontWeight: 'bold' } : { color: colors.textSecondary }}
                                mode="outlined"
                                showSelectedOverlay
                            >
                                {role.label}
                            </Chip>
                        ))}
                    </ScrollView>
                )}
            </View>

            <FlatList
                data={filteredUsers}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUsers} colors={[colors.primary]} />}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="account-search" size={60} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Tidak ada pengguna ditemukan</Text>
                        </View>
                    )
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                color="#FFFFFF"
                onPress={() => navigation.navigate('UserForm' as any)}
                label="Tambah"
            />

            {/* Custom Delete Confirmation Dialog */}
            <Portal>
                <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)} style={{ backgroundColor: colors.surface, borderRadius: borderRadius.lg }}>
                    <Dialog.Icon icon="alert-circle" size={50} color={colors.error} />
                    <Dialog.Title style={{ textAlign: 'center', color: colors.error }}>Hapus Pengguna?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ textAlign: 'center', color: colors.textSecondary, marginBottom: 10 }}>
                            Apakah Anda yakin ingin menghapus pengguna <Text style={{ fontWeight: 'bold' }}>{userToDelete?.name}</Text>?
                            Tindakan ini tidak dapat dibatalkan.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 20 }}>
                        <Button mode="outlined" onPress={() => setDeleteDialogVisible(false)} style={{ marginRight: 10, borderColor: colors.textSecondary }} textColor={colors.textSecondary}>
                            Batal
                        </Button>
                        <Button mode="contained" onPress={handleDelete} buttonColor={colors.error}>
                            Hapus
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerContainer: {
        backgroundColor: colors.surface,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        elevation: 2,
    },
    searchBar: {
        margin: spacing.md,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        height: 46,
    },
    filterScroll: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    chip: {
        marginRight: 8,
        height: 32,
        backgroundColor: colors.surface,
        borderColor: colors.divider,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 80,
    },
    card: {
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        padding: spacing.md,
    },
    avatarContainer: {
        marginRight: spacing.md,
        justifyContent: 'center',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        flex: 1,
    },
    branchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 4,
        maxWidth: 100,
    },
    branchText: {
        fontSize: 10,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    userEmail: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 6,
    },
    roleContainer: {
        flexDirection: 'row',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 1,
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    roleText: {
        fontSize: 10,
        fontWeight: '700',
    },
    actionColumn: {
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: spacing.md,
        color: colors.textMuted,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: colors.primary,
        borderRadius: 16,
    },
});
