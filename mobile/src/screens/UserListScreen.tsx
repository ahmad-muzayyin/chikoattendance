// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\UserListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
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
        <Surface style={styles.card} elevation={0}>
            {/* Top Row: Avatar + Main Info */}
            <View style={styles.cardMain}>
                <Avatar.Text
                    size={48}
                    label={item.name.substring(0, 2).toUpperCase()}
                    style={[styles.avatar, { backgroundColor: `${getRoleColor(item.role)}10` }]}
                    color={getRoleColor(item.role)}
                    labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
                />

                <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                        {(item.Branch || item.branch) && (
                            <View style={styles.branchPill}>
                                <Text style={styles.branchPillText}>{(item.Branch || item.branch).name}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>

                    <View style={styles.badgesRow}>
                        <View style={[styles.roleLabel, { backgroundColor: `${getRoleColor(item.role)}15` }]}>
                            <Text style={[styles.roleLabelText, { color: getRoleColor(item.role) }]}>
                                {item.role === 'EMPLOYEE' && item.position ? item.position : getRoleLabel(item.role)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom Row: Contact + Actions */}
            <View style={styles.cardFooter}>
                <View style={styles.metaInfo}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={14} color="#94A3B8" />
                    <Text style={styles.metaText}>{item.employeeId || '-'}</Text>
                    <View style={styles.metaDot} />
                    <MaterialCommunityIcons name="phone-outline" size={14} color="#94A3B8" />
                    <Text style={styles.metaText}>{item.phone || '-'}</Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => navigation.navigate('UserForm' as any, { user: item })}
                    >
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconBtn, { marginLeft: 8, backgroundColor: '#FEF2F2' }]}
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
        backgroundColor: '#F8FAFC',
    },
    headerContainer: {
        backgroundColor: '#FFFFFF',
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        zIndex: 10,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardMain: {
        flexDirection: 'row',
        padding: 16,
        paddingBottom: 12,
        alignItems: 'center',
    },
    avatar: {
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 2,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginRight: 8,
    },
    branchPill: {
        backgroundColor: '#F1F5F9', // Very light grey
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    branchPillText: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 6,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleLabel: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    roleLabelText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
        backgroundColor: '#FCFCFD',
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 11,
        color: '#94A3B8',
        marginLeft: 4,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
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
        margin: 20,
        right: 0,
        bottom: 10,
        backgroundColor: colors.primary,
        borderRadius: 28,
        elevation: 6,
        zIndex: 20,
    },
});
