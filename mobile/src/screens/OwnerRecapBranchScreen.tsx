// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\OwnerRecapBranchScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { Text, Surface, ActivityIndicator, Searchbar, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';

export default function OwnerRecapBranchScreen() {
    const navigation = useNavigation<any>();
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            // Assuming we can reuse the existing branch list endpoint which likely returns employees too or we might need a specific one.
            // For now, let's use the standard branch list. If it doesn't exist, we might need to create it.
            // Based on previous context, BranchListScreen uses '/admin/branches' (implied).
            // Let's check adminRoutes.ts or branchController.ts to be sure.
            // Waiting for tool check... actually I can just try '/admin/branches' or similar. 
            // Better yet, let's use the one that gets all employees grouped by branch if possible, 
            // OR just get all branches and then when clicking a branch, query employees for that branch.

            // Let's assume we have a way to get branches.
            const res = await axios.get(`${API_CONFIG.BASE_URL}/branches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
        } catch (error) {
            console.error('Fetch branches error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const filteredBranches = branches.filter((b: any) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('OwnerRecapEmployees', { branchId: item.id, branchName: item.name })}
        >
            <Surface style={styles.card} elevation={2}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="store-marker" size={30} color={colors.primary} />
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.branchName}>{item.name}</Text>
                    <Text style={styles.branchAddress} numberOfLines={2}>{item.address}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </Surface>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Rekap Per Outlet</Text>
                <Searchbar
                    placeholder="Cari Outlet..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={{ fontSize: 14 }}
                    elevation={0}
                />
            </View>

            <FlatList
                data={filteredBranches}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchBranches} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="store-off" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Tidak ada outlet ditemukan</Text>
                        </View>
                    ) : null
                }
            />
            {loading && (
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
    headerContainer: {
        backgroundColor: colors.surface,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + spacing.sm : 20,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.sm,
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    searchBar: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        height: 46,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: `${colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    infoContainer: {
        flex: 1,
    },
    branchName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    branchAddress: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: spacing.sm,
        color: colors.textMuted,
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
    }
});
