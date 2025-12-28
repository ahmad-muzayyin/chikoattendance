// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\SettingsScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Surface, Avatar, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { useAuth } from '../hooks/useAuth';

export default function SettingsScreen() {
    const { user, checkAuth } = useAuth();
    const navigation = useNavigation();

    const [name, setName] = useState(user?.name || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [maxPunishment, setMaxPunishment] = useState('');
    const [loadingSettings, setLoadingSettings] = useState(false);

    React.useEffect(() => {
        if (user?.role === 'OWNER') {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}${ENDPOINTS.SETTINGS}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.max_punishment_points) {
                setMaxPunishment(res.data.max_punishment_points);
            }
        } catch (error) {
            console.log('Error fetching settings', error);
        }
    };

    const handleSaveSettings = async () => {
        if (!maxPunishment) return;
        setLoadingSettings(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.put(`${API_CONFIG.BASE_URL}${ENDPOINTS.SETTINGS}`, {
                key: 'max_punishment_points',
                value: maxPunishment
            }, { headers: { Authorization: `Bearer ${token}` } });

            Alert.alert('Sukses', 'Pengaturan berhasil disimpan');
        } catch (error) {
            Alert.alert('Gagal', 'Gagal menyimpan pengaturan');
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleUpdate = async () => {
        if (password && password !== confirmPassword) {
            Alert.alert('Eror', 'Konfirmasi password tidak cocok.');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            await axios.put(`${API_CONFIG.BASE_URL}/auth/profile`, {
                name,
                password: password || undefined
            }, { headers: { Authorization: `Bearer ${token}` } });

            await SecureStore.setItemAsync('userName', name);
            await checkAuth(); // Refresh user state

            Alert.alert('Sukses', 'Profil berhasil diperbarui');
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Gagal memperbarui profil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Avatar.Text
                    size={80}
                    label={name.substring(0, 2).toUpperCase()}
                    style={{ backgroundColor: colors.primary }}
                />
                <Text style={styles.emailText}>{user?.email}</Text>
            </View>

            {user?.role === 'OWNER' && (
                <Surface style={[styles.card, { marginBottom: spacing.lg }]} elevation={2}>
                    <Text style={styles.sectionTitle}>Pengaturan Global</Text>
                    <TextInput
                        label="Batas Maksimum Poin Pelanggaran"
                        value={maxPunishment}
                        onChangeText={setMaxPunishment}
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.input}
                        placeholder="Contoh: 50"
                    />
                    <Button
                        mode="contained"
                        onPress={handleSaveSettings}
                        loading={loadingSettings}
                        style={[styles.btn, { backgroundColor: colors.secondary }]}
                        contentStyle={{ height: 48 }}
                        icon="cog"
                    >
                        Simpan Pengaturan
                    </Button>
                </Surface>
            )}

            <Surface style={styles.card} elevation={1}>
                <Text style={styles.sectionTitle}>Ubah Nama Panggilan</Text>
                <TextInput
                    label="Nama"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                />

                <Divider style={styles.divider} />

                <Text style={styles.sectionTitle}>Ubah Password</Text>
                <TextInput
                    label="Password Baru"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                    placeholder="Kosongkan jika tidak ingin diubah"
                />
                <TextInput
                    label="Konfirmasi Password Baru"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                />

                <Button
                    mode="contained"
                    onPress={handleUpdate}
                    loading={loading}
                    style={styles.btn}
                    contentStyle={{ height: 48 }}
                >
                    Simpan Perubahan
                </Button>
            </Surface>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    emailText: {
        marginTop: spacing.sm,
        color: colors.textSecondary,
        fontSize: 14,
    },
    card: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    input: {
        marginBottom: spacing.md,
        backgroundColor: colors.surface,
    },
    divider: {
        marginVertical: spacing.xl,
    },
    btn: {
        marginTop: spacing.md,
        borderRadius: borderRadius.md,
    }
});
