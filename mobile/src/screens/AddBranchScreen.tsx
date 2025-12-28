// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\AddBranchScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, Surface } from 'react-native-paper';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius } from '../theme/theme';

export default function AddBranchScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const editingBranch = (route.params as any)?.branch;

    const [name, setName] = useState(editingBranch?.name || '');
    const [address, setAddress] = useState(editingBranch?.address || '');
    const [latitude, setLatitude] = useState(editingBranch?.latitude?.toString() || '');
    const [longitude, setLongitude] = useState(editingBranch?.longitude?.toString() || '');
    const [radius, setRadius] = useState(editingBranch?.radius?.toString() || '100');
    const [startHour, setStartHour] = useState(editingBranch?.startHour || '09:00');
    const [endHour, setEndHour] = useState(editingBranch?.endHour || '17:00');

    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    const getCurrentLocation = async () => {
        setLocationLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin ditolak', 'Mohon izinkan akses lokasi.');
                return;
            }
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLatitude(location.coords.latitude.toString());
            setLongitude(location.coords.longitude.toString());
        } catch (error) {
            Alert.alert('Error', 'Gagal mengambil lokasi.');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name || !latitude || !longitude) {
            Alert.alert('Validasi', 'Nama outlet dan koordinat lokasi wajib diisi.');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const data = {
                name,
                address,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                radius: parseInt(radius),
                startHour,
                endHour
            };

            const url = editingBranch
                ? `${API_CONFIG.BASE_URL}/branches/${editingBranch.id}`
                : `${API_CONFIG.BASE_URL}/branches`;

            const method = editingBranch ? 'put' : 'post';

            await axios[method](url, data, { headers: { Authorization: `Bearer ${token}` } });

            Alert.alert('Sukses', `Outlet berhasil ${editingBranch ? 'diperbarui' : 'ditambahkan'}!`, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Gagal menyimpan outlet.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Surface style={styles.formCard} elevation={1}>
                <Text style={styles.title}>{editingBranch ? 'Edit Data Outlet' : 'Tambah Outlet Baru'}</Text>

                <TextInput
                    label="Nama Outlet"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                    placeholder="Contoh: Cabang Sudirman"
                />

                <TextInput
                    label="Alamat Lengkap"
                    value={address}
                    onChangeText={setAddress}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                    placeholder="Alamat lengkap outlet..."
                />

                <View style={styles.row}>
                    <TextInput
                        label="Latitude"
                        value={latitude}
                        onChangeText={setLatitude}
                        mode="outlined"
                        style={[styles.input, styles.halfInput]}
                        keyboardType="numeric"
                    />
                    <TextInput
                        label="Longitude"
                        value={longitude}
                        onChangeText={setLongitude}
                        mode="outlined"
                        style={[styles.input, styles.halfInput]}
                        keyboardType="numeric"
                    />
                </View>

                <Button
                    mode="contained-tonal"
                    onPress={getCurrentLocation}
                    loading={locationLoading}
                    icon="crosshairs-gps"
                    style={styles.locationBtn}
                    contentStyle={{ height: 44 }}
                >
                    Ambil Koordinat GPS
                </Button>

                <View style={styles.row}>
                    <TextInput
                        label="Jam Masuk"
                        value={startHour}
                        onChangeText={setStartHour}
                        mode="outlined"
                        style={[styles.input, styles.halfInput]}
                        placeholder="HH:mm"
                    />
                    <TextInput
                        label="Jam Pulang"
                        value={endHour}
                        onChangeText={setEndHour}
                        mode="outlined"
                        style={[styles.input, styles.halfInput]}
                        placeholder="HH:mm"
                    />
                </View>

                <TextInput
                    label="Radius Absensi (meter)"
                    value={radius}
                    onChangeText={setRadius}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                />

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.submitBtn}
                    contentStyle={{ height: 50 }}
                >
                    {editingBranch ? 'Perbarui Data' : 'Simpan Outlet'}
                </Button>
            </Surface>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    formCard: { padding: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: colors.surface },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.lg, color: colors.textPrimary },
    input: { marginBottom: spacing.md, backgroundColor: colors.surface },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfInput: { width: '48%' },
    locationBtn: { marginBottom: spacing.lg, borderRadius: borderRadius.md },
    submitBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md }
});
