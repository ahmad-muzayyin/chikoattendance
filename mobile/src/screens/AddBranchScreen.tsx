// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\AddBranchScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { TextInput, Button, Text, Surface, Searchbar } from 'react-native-paper';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

export default function AddBranchScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as any || {};
    const editingBranch = params.branch;

    const safeParseFloat = (val: any, fallback: number) => {
        if (val === null || val === undefined || val === '') return fallback;
        const parsed = parseFloat(val.toString());
        return isNaN(parsed) ? fallback : parsed;
    };

    const [name, setName] = useState(editingBranch?.name || '');
    const [address, setAddress] = useState(editingBranch?.address || '');
    const [latitude, setLatitude] = useState(editingBranch?.latitude?.toString() || '');
    const [longitude, setLongitude] = useState(editingBranch?.longitude?.toString() || '');
    const [radius, setRadius] = useState(editingBranch?.radius?.toString() || '100');
    const [startHour, setStartHour] = useState(editingBranch?.startHour || '09:00');
    const [endHour, setEndHour] = useState(editingBranch?.endHour || '17:00');

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    // Map Region State (Decoupled from Marker Coordinates)
    const [region, setRegion] = useState({
        latitude: safeParseFloat(editingBranch?.latitude, -6.2088) || -6.2088,
        longitude: safeParseFloat(editingBranch?.longitude, 106.8456) || 106.8456,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    });

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);

    const searchLocation = async () => {
        if (!searchQuery.trim()) return;

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin lokasi untuk mencari alamat.');
            return;
        }

        setSearchLoading(true);
        try {
            const geocodedLocation = await Location.geocodeAsync(searchQuery);
            if (geocodedLocation.length > 0) {
                const target = geocodedLocation[0];
                setLatitude(target.latitude.toString());
                setLongitude(target.longitude.toString());
                setRegion({
                    latitude: target.latitude,
                    longitude: target.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                });
            } else {
                Alert.alert('Tidak Ditemukan', 'Lokasi tidak ditemukan. Coba kata kunci lain atau gunakan nama kota yang lebih spesifik.');
            }
        } catch (error: any) {
            console.log('Geocoding Error:', error);
            // On Android, geocoding often fails if the device lacks Play Services or has network issues
            const errorMessage = error?.message || 'Pastikan internet aktif dan Google Play Services tersedia.';
            Alert.alert('Gagal Mencari Lokasi', `Terjadi kesalahan saat mencari lokasi.\n\nDetail: ${errorMessage}`);
        } finally {
            setSearchLoading(false);
        }
    };

    const onTimeChange = (isStart: boolean, event: any, selectedDate?: Date) => {
        if (Platform.OS !== 'android') {
            isStart ? setShowStartPicker(false) : setShowEndPicker(false);
        }
        if (selectedDate) {
            const timeString = selectedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            isStart ? setStartHour(timeString) : setEndHour(timeString);
        }
    };

    const parseTimeString = (timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours || 0, minutes || 0, 0, 0);
        return date;
    };

    const showPicker = (isStart: boolean) => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: parseTimeString(isStart ? startHour : endHour),
                onChange: (event, date) => onTimeChange(isStart, event, date),
                mode: 'time',
                is24Hour: true,
            });
        } else {
            isStart ? setShowStartPicker(true) : setShowEndPicker(true);
        }
    };

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
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
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
                name, address,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                radius: parseInt(radius) || 100,
                startHour, endHour
            };

            const url = editingBranch
                ? `${API_CONFIG.BASE_URL}/branches/${editingBranch.id}`
                : `${API_CONFIG.BASE_URL}/branches`;

            await axios[editingBranch ? 'put' : 'post'](url, data, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Sukses', `Outlet berhasil ${editingBranch ? 'diperbarui' : 'disimpan'}!`, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Gagal menyimpan outlet.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{editingBranch ? 'Edit Data Outlet' : 'Outlet Baru'}</Text>
                    <Text style={styles.headerSubtitle}>Konfigurasi informasi operasional cabang</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Surface style={styles.formCard} elevation={2}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Detail Cabang</Text>
                        <TextInput
                            label="Nama Outlet"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                        />
                        <TextInput
                            label="Alamat Lengkap"
                            value={address}
                            onChangeText={setAddress}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Lokasi GPS</Text>
                        <View style={styles.row}>
                            <TextInput
                                label="Latitude"
                                value={latitude}
                                onChangeText={setLatitude}
                                mode="outlined"
                                style={[styles.input, styles.flex1]}
                                keyboardType="numbers-and-punctuation"
                                outlineStyle={styles.inputOutline}
                            />
                            <TextInput
                                label="Longitude"
                                value={longitude}
                                onChangeText={setLongitude}
                                mode="outlined"
                                style={[styles.input, styles.flex1]}
                                keyboardType="numbers-and-punctuation"
                                outlineStyle={styles.inputOutline}
                            />
                        </View>
                        <Button
                            mode="contained-tonal"
                            onPress={getCurrentLocation}
                            loading={locationLoading}
                            icon="crosshairs-gps"
                            style={styles.locationBtn}
                        >
                            Ambil Lokasi Sekarang (GPS)
                        </Button>

                        {/* MAP PICKER */}
                        <View style={styles.mapContainer}>
                            <View style={styles.searchContainer}>
                                <Searchbar
                                    placeholder="Cari Kota, Jalan, atau Daerah..."
                                    onChangeText={setSearchQuery}
                                    value={searchQuery}
                                    loading={searchLoading}
                                    onIconPress={searchLocation}
                                    onSubmitEditing={searchLocation}
                                    style={styles.searchBar}
                                    inputStyle={styles.searchInput}
                                    elevation={1}
                                />
                            </View>

                            <MapView
                                provider={PROVIDER_DEFAULT}
                                style={styles.map}
                                region={region}
                                onRegionChangeComplete={setRegion}
                                onPress={(e) => {
                                    setLatitude(e.nativeEvent.coordinate.latitude.toString());
                                    setLongitude(e.nativeEvent.coordinate.longitude.toString());
                                }}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: safeParseFloat(latitude, -6.2088),
                                        longitude: safeParseFloat(longitude, 106.8456),
                                    }}
                                    draggable
                                    title="Lokasi Outlet"
                                    description="Geser untuk menyesuaikan"
                                    onDragEnd={(e) => {
                                        setLatitude(e.nativeEvent.coordinate.latitude.toString());
                                        setLongitude(e.nativeEvent.coordinate.longitude.toString());
                                    }}
                                >
                                    <MaterialCommunityIcons name="map-marker" size={40} color="#DC2626" />
                                </Marker>
                            </MapView>
                        </View>
                        <TextInput
                            label="Radius Absensi (meter)"
                            value={radius}
                            onChangeText={setRadius}
                            mode="outlined"
                            keyboardType="numeric"
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                            right={<TextInput.Affix text="m" />}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Jam Operasional</Text>
                        <View style={styles.row}>
                            <TouchableOpacity style={styles.timeBox} onPress={() => showPicker(true)}>
                                <MaterialCommunityIcons name="clock-start" size={20} color={colors.primary} />
                                <View style={styles.timeTextContainer}>
                                    <Text style={styles.timeLabel}>Buka</Text>
                                    <Text style={styles.timeValue}>{startHour}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.timeBox} onPress={() => showPicker(false)}>
                                <MaterialCommunityIcons name="clock-end" size={20} color={colors.primary} />
                                <View style={styles.timeTextContainer}>
                                    <Text style={styles.timeLabel}>Tutup</Text>
                                    <Text style={styles.timeValue}>{endHour}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={loading}
                        style={styles.submitBtn}
                        contentStyle={styles.submitBtnContent}
                    >
                        {editingBranch ? 'Perbarui Outlet' : 'Simpan Outlet'}
                    </Button>
                </Surface>

                {Platform.OS === 'ios' && (showStartPicker || showEndPicker) && (
                    <DateTimePicker
                        value={showStartPicker ? parseTimeString(startHour) : parseTimeString(endHour)}
                        mode="time"
                        is24Hour={true}
                        display="spinner"
                        onChange={(event, date) => onTimeChange(showStartPicker, event, date)}
                    />
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
        paddingBottom: spacing.md,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.sm,
    },
    headerContent: {
        marginTop: Platform.OS === 'ios' ? 10 : 0,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
    headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    scrollContent: { padding: spacing.md, paddingBottom: 20 },
    formCard: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        ...shadows.md,
    },
    section: { marginBottom: spacing.md },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs
    },
    input: { marginBottom: spacing.sm, backgroundColor: colors.surface },
    inputOutline: { borderRadius: borderRadius.md },
    row: { flexDirection: 'row', gap: spacing.sm },
    flex1: { flex: 1 },
    locationBtn: { marginVertical: spacing.xs, borderRadius: borderRadius.md },
    timeBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.divider,
        gap: spacing.xs,
    },
    timeTextContainer: { flex: 1 },
    timeLabel: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', fontWeight: 'bold' },
    timeValue: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
    submitBtn: { marginTop: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary },
    submitBtnContent: { height: 48 },

    // Map Styles
    mapContainer: {
        height: 250,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        marginVertical: 12,
        borderWidth: 1,
        borderColor: colors.divider,
        backgroundColor: '#f0f0f0',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapHint: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 6,
        borderRadius: 8,
        fontSize: 10,
        color: colors.textSecondary,
        textAlign: 'center',
        elevation: 2,
    },
    // Search Styles
    searchContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        zIndex: 20,
    },
    searchBar: {
        backgroundColor: 'white',
        borderRadius: 24,
        height: 46
    },
    searchInput: {
        minHeight: 0,
        fontSize: 14,
        alignSelf: 'center', // Fix text alignment
    }
});
