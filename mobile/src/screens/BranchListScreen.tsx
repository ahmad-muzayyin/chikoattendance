// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\BranchListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Text, FAB, Card, IconButton, ActivityIndicator, Surface } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BranchListScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/branches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
        } catch (error) {
            Alert.alert('Error', 'Gagal memuat daftar outlet');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) fetchBranches();
    }, [isFocused]);

    const handleDelete = (id: number) => {
        Alert.alert('Hapus Outlet', 'Yakin ingin menghapus outlet ini?', [
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

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.card} elevation={1}>
            <View style={styles.cardLayout}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="store" size={24} color={colors.primary} />
                </View>
                <View style={styles.infoContainer}>
                    <Text variant="titleMedium" style={styles.branchName}>{item.name}</Text>
                    <Text variant="bodySmall" numberOfLines={1} style={styles.address}>{item.address}</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color={colors.textMuted} />
                            <Text style={styles.statText}>{item.radius}m</Text>
                        </View>
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
                            <Text style={styles.statText}>{item.startHour} - {item.endHour}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.actionContainer}>
                    <IconButton
                        icon="pencil-outline"
                        size={20}
                        onPress={() => navigation.navigate('AddBranch' as any, { branch: item })}
                    />
                    <IconButton
                        icon="trash-can-outline"
                        size={20}
                        iconColor={colors.error}
                        onPress={() => handleDelete(item.id)}
                    />
                </View>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={branches}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBranches} />}
                ListEmptyComponent={!loading && <Text style={styles.emptyText}>Belum ada outlet</Text>}
            />

            <FAB
                icon="plus"
                style={styles.fab}
                label="Tambah Outlet"
                onPress={() => navigation.navigate('AddBranch' as any)}
                color="#FFFFFF"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md, paddingBottom: 100 },
    card: { marginBottom: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.surface },
    cardLayout: { flexDirection: 'row', padding: spacing.md, alignItems: 'center' },
    iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },
    infoContainer: { flex: 1, marginLeft: spacing.md },
    branchName: { fontWeight: 'bold' },
    address: { color: colors.textSecondary, marginTop: 2 },
    statsRow: { flexDirection: 'row', marginTop: 8 },
    statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
    statText: { fontSize: 11, color: colors.textMuted, marginLeft: 4 },
    actionContainer: { alignItems: 'center' },
    fab: { position: 'absolute', margin: 20, right: 0, bottom: 0, backgroundColor: colors.primary, borderRadius: 28 },
    emptyText: { textAlign: 'center', marginTop: 100, color: colors.textSecondary }
});
