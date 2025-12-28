// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\OwnerRecapEmployeesScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Surface, Avatar, ActivityIndicator, Searchbar, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';

export default function OwnerRecapEmployeesScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { branchId, branchName } = route.params;

    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            // assuming an endpoint to get users by branch exists, or FILTER client side from all employees.
            // For efficiency, server side filtering is better. But let's check existing endpoints.
            // adminController.getEmployees returns ALL users with branch info.
            // We can filter on client side for now.
            const res = await axios.get(`${API_CONFIG.BASE_URL}/admin/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter by branchId
            const filtered = res.data.filter((u: any) => {
                const uBranchId = u.Branch?.id || u.branchId;
                return uBranchId == branchId;
            });
            setEmployees(filtered);
        } catch (error) {
            console.error('Fetch employees error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        navigation.setOptions({ title: `Karyawan - ${branchName}` });
        fetchEmployees();
    }, [branchId]);

    const filteredList = employees.filter((u: any) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('OwnerRecapDetail', { userId: item.id, userName: item.name })}
        >
            <Surface style={styles.card} elevation={2}>
                <View style={styles.avatarContainer}>
                    {item.profile_picture ? (
                        <Avatar.Image
                            size={50}
                            source={{ uri: item.profile_picture }}
                            style={{ backgroundColor: 'transparent' }}
                        />
                    ) : (
                        <Avatar.Text
                            size={50}
                            label={item.name.substring(0, 2).toUpperCase()}
                            style={{ backgroundColor: colors.primary }}
                            color="#FFF"
                        />
                    )}
                    {/* Role Badge */}
                    <View style={styles.badgeContainer}>
                        <MaterialCommunityIcons
                            name={item.role === 'OWNER' ? 'crown' : 'account'}
                            size={10}
                            color="#FFF"
                        />
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.row}>
                        <View style={styles.roleTag}>
                            <Text style={styles.roleText}>{item.role}</Text>
                        </View>
                        {/* Stats Summary Badges */}
                        <View style={styles.statsRow}>
                            <View style={[styles.statBadge, { backgroundColor: '#E8F5E9' }]}>
                                <Text style={[styles.statLabel, { color: colors.success }]}>H: {item.stats?.hadir || 0}</Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: '#FFF3E0' }]}>
                                <Text style={[styles.statLabel, { color: colors.warning }]}>T: {item.stats?.telat || 0}</Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: '#E3F2FD' }]}>
                                <Text style={[styles.statLabel, { color: '#2196F3' }]}>I: {item.stats?.izin || 0}</Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: '#FFEBEE' }]}>
                                <Text style={[styles.statLabel, { color: colors.error }]}>A: {item.stats?.alpha || 0}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.arrowContainer}>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                </View>
            </Surface>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Searchbar
                    placeholder="Cari Karyawan..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={{ fontSize: 14 }}
                    iconColor={colors.primary}
                />
            </View>

            <FlatList
                data={filteredList}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchEmployees} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="account-search-outline" size={60} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Tidak ada karyawan ditemukan</Text>
                            <Text style={styles.emptySubText}>Di outlet {branchName}</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerContainer: {
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    searchBar: {
        elevation: 0,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#EEE',
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
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: spacing.md,
    },
    badgeContainer: {
        position: 'absolute',
        bottom: 0,
        right: -4,
        backgroundColor: colors.warning,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 8,
    },
    roleTag: {
        backgroundColor: `${colors.primary}15`,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    roleText: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        minWidth: 28,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
    },
    arrowContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        opacity: 0.7,
    },
    emptyText: {
        marginTop: spacing.md,
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    emptySubText: {
        marginTop: 4,
        fontSize: 14,
        color: colors.textSecondary,
    },
});
