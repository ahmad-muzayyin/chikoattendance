// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\BranchListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { Text, FAB, IconButton, ActivityIndicator, Surface, Searchbar } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BranchListScreen() {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/branches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
        } catch (error) {
            console.error('Fetch branches error:', error);
            Alert.alert('Error', 'Gagal memuat daftar outlet');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) fetchBranches();
    }, [isFocused]);

    const handleDelete = (id: number) => {
        Alert.alert('Hapus Outlet', 'Apakah Anda yakin ingin menghapus outlet ini? Tindakan ini tidak dapat dibatalkan.', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const token = await SecureStore.getItemAsync('authToken');
                        await axios.delete(`${API_CONFIG.BASE_URL}/branches/${id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchBranches();
                    } catch (e) {
                        Alert.alert('Error', 'Gagal menghapus outlet');
                    }
                }
            }
        ]);
    };

    const filteredBranches = branches.filter((b: any) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <Surface style={styles.card} elevation={1}>
            <TouchableOpacity
                activeOpacity={0.7}
                style={styles.cardContent}
                onPress={() => navigation.navigate('AddBranch', { branch: item })}
            >
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="store-marker" size={26} color={colors.primary} />
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.branchName}>{item.name}</Text>
                    <Text numberOfLines={1} style={styles.address}>{item.address || 'Alamat tidak diatur'}</Text>

                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="radar" size={14} color={colors.textMuted} />
                            <Text style={styles.detailText}>{item.radius}m</Text>
                        </View>
                        <View style={styles.dot} />
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="clock-check-outline" size={14} color={colors.textMuted} />
                            <Text style={styles.detailText}>{item.startHour} - {item.endHour}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actions}>
                    <IconButton
                        icon="trash-can-outline"
                        size={20}
                        iconColor={colors.error}
                        onPress={() => handleDelete(item.id)}
                        style={styles.actionBtn}
                    />
                </View>
            </TouchableOpacity>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Outlet Cabang</Text>
                    <Text style={styles.headerSubtitle}>{branches.length} Outlet Terdaftar</Text>
                </View>
                <Searchbar
                    placeholder="Cari outlet..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor={colors.primary}
                    elevation={0}
                />
            </View>

            <FlatList
                data={filteredBranches}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchBranches} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="store-off-outline" size={80} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Tidak ada outlet ditemukan</Text>
                            <Text style={styles.emptySubText}>Tambahkan outlet baru untuk memulai operasional.</Text>
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
                onPress={() => navigation.navigate('AddBranch')}
                color="#FFFFFF"
                label="Tambah Outlet"
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
        paddingBottom: 120
    },
    card: {
        marginBottom: spacing.md,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        padding: spacing.md,
        alignItems: 'center'
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: `${colors.primary}10`,
        alignItems: 'center',
        justifyContent: 'center'
    },
    infoContainer: {
        flex: 1,
        marginLeft: spacing.md
    },
    branchName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    address: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    detailText: {
        fontSize: 11,
        color: colors.textMuted,
        marginLeft: 4,
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.divider,
        marginHorizontal: 8,
    },
    actions: {
        paddingLeft: spacing.sm,
    },
    actionBtn: {
        margin: 0,
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
        paddingHorizontal: spacing.xxl
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginTop: spacing.md,
        textAlign: 'center'
    },
    emptySubText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    loader: {
        marginTop: 100,
    }
});
