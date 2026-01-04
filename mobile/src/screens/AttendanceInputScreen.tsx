// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\AttendanceInputScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput, Card, Portal, Modal, IconButton, Surface, ActivityIndicator } from 'react-native-paper';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { useAuth } from '../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AttendanceInputScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { user } = useAuth();

    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [facing, setFacing] = useState<CameraType>('front');
    const [photo, setPhoto] = useState<string | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Menginisialisasi GPS...');

    // Result Modals
    const [resultModal, setResultModal] = useState<{ visible: boolean, type: 'success' | 'error' | 'range', message: string, data?: any }>({
        visible: false,
        type: 'success',
        message: ''
    });

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                getLocation();
            } else {
                setStatusMessage('Izin lokasi diperlukan.');
            }
        })();
    }, []);

    const getLocation = async () => {
        try {
            setStatusMessage('Melacak lokasi...');
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

            // Anti-Fake GPS Check
            if (loc.mocked) {
                setResultModal({
                    visible: true,
                    type: 'error',
                    message: 'Terdeteksi Lokasi Palsu (Fake GPS). Mohon matikan aplikasi Fake GPS Anda untuk melakukan absensi.'
                });
                setStatusMessage('Terdeteksi Fake GPS 🚫');
                setLocation(null);
                return;
            }

            setLocation(loc);
            setStatusMessage('Lokasi terkunci.');
        } catch (e) {
            setStatusMessage('GPS Error. Coba lagi.');
        }
    };

    const takePicture = async () => {
        if (cameraRef) {
            try {
                const photoData = await cameraRef.takePictureAsync({
                    quality: 0.3, // Compressed for faster upload
                    base64: true,
                });
                setPhoto(`data:image/jpeg;base64,${photoData.base64}`);
            } catch (e) {
                Alert.alert("Eror", "Gagal mengambil foto.");
            }
        }
    };

    const handleSubmit = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
        if (!location) {
            setResultModal({ visible: true, type: 'error', message: 'Lokasi Anda belum terlacak. Mohon aktifkan GPS.' });
            return;
        }

        if (type === 'CHECK_IN' && !photo) {
            setResultModal({ visible: true, type: 'error', message: 'Anda wajib mengambil foto selfie.' });
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const endpoint = type === 'CHECK_IN' ? ENDPOINTS.CHECK_IN : ENDPOINTS.CHECK_OUT;

            const res = await axios.post(
                `${API_CONFIG.BASE_URL}${endpoint}`,
                {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    deviceId: 'MOBILE_APP',
                    photoUrl: photo,
                    notes: notes
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setResultModal({
                visible: true,
                type: 'success',
                message: `${type === 'CHECK_IN' ? 'Berhasil Masuk!' : 'Berhasil Pulang!'}`,
                data: res.data
            });

        } catch (error: any) {
            const resData = error?.response?.data;
            if (error.response?.status === 400 && resData?.message?.includes('jangkauan')) {
                setResultModal({
                    visible: true,
                    type: 'range',
                    message: 'Diluar Jangkauan',
                    data: { distance: resData.distance, max: resData.maxRadius }
                });
            } else {
                setResultModal({
                    visible: true,
                    type: 'error',
                    message: resData?.message || 'Server Error. Mohon hubungi admin.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    if (!permission?.granted) {
        return (
            <View style={styles.center}>
                <MaterialCommunityIcons name="camera-off" size={60} color={colors.textMuted} />
                <Text style={{ marginVertical: 20 }}>Izin kamera diperlukan untuk absensi.</Text>
                <Button mode="contained" onPress={requestPermission}>Berikan Izin</Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Branch Info Header */}
                <Surface style={styles.headerBrand} elevation={2}>
                    <View style={styles.headerInfo}>
                        <MaterialCommunityIcons name="store-marker" size={24} color="#FFF" />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.headerTitle}>Absensi Outlet</Text>
                            <Text style={styles.headerSubtitle}>{user?.branch?.name || 'Toko Pusat'}</Text>
                        </View>
                    </View>
                </Surface>

                {/* Camera View */}
                <View style={styles.cameraWrapper}>
                    {photo ? (
                        <View style={styles.photoPreview}>
                            <Image source={{ uri: photo }} style={styles.photo} />
                            <TouchableOpacity style={styles.retakeIcon} onPress={() => setPhoto(null)}>
                                <MaterialCommunityIcons name="close-circle" size={40} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        isFocused && (
                            <CameraView style={styles.camera} facing={facing} ref={setCameraRef}>
                                <View style={styles.cameraOverlay}>
                                    <IconButton
                                        icon="camera-flip"
                                        iconColor="#FFF"
                                        containerColor="rgba(0,0,0,0.4)"
                                        onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}
                                    />
                                </View>
                            </CameraView>
                        )
                    )}
                </View>

                {/* Main Form */}
                <View style={styles.form}>
                    {!photo && !loading && (
                        <Button
                            mode="contained"
                            icon="camera"
                            onPress={takePicture}
                            style={styles.snapButton}
                            contentStyle={{ height: 55 }}
                        >
                            Ambil Selfie Sekarang
                        </Button>
                    )}

                    <Card style={styles.geoCard}>
                        <View style={styles.row}>
                            <View style={[styles.dot, { backgroundColor: location ? colors.success : colors.warning }]} />
                            <Text style={styles.geoTitle}>{statusMessage}</Text>
                            <IconButton icon="refresh" size={20} onPress={getLocation} disabled={loading} />
                        </View>
                    </Card>

                    <TextInput
                        label="Catatan atau Keterangan"
                        value={notes}
                        onChangeText={setNotes}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.notesInput}
                    />

                    <View style={styles.actionGrid}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.checkInBtn, (loading || !location) && styles.disabledBtn]}
                            onPress={() => handleSubmit('CHECK_IN')}
                            disabled={loading || !location}
                        >
                            <MaterialCommunityIcons name="login-variant" size={28} color="#FFF" />
                            <Text style={styles.btnLabel}>MASUK</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.checkOutBtn, (loading || !location) && styles.disabledBtn]}
                            onPress={() => handleSubmit('CHECK_OUT')}
                            disabled={loading || !location}
                        >
                            <MaterialCommunityIcons name="logout-variant" size={28} color={colors.error} />
                            <Text style={[styles.btnLabel, { color: colors.error }]}>PULANG</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Premium Result Modal */}
            <Portal>
                <Modal
                    visible={resultModal.visible}
                    onDismiss={() => resultModal.type !== 'success' && setResultModal({ ...resultModal, visible: false })}
                    contentContainerStyle={styles.resultModal}
                >
                    <View style={styles.modalBody}>
                        <View style={[styles.modalIcon, { backgroundColor: resultModal.type === 'success' ? '#DCFCE7' : '#FEE2E2' }]}>
                            <MaterialCommunityIcons
                                name={resultModal.type === 'success' ? 'check-decagram' : 'alert-circle'}
                                size={50}
                                color={resultModal.type === 'success' ? '#16A34A' : '#DC2626'}
                            />
                        </View>

                        <Text style={styles.modalTitle}>{resultModal.message}</Text>

                        {resultModal.type === 'range' && resultModal.data && (
                            <View style={styles.rangeDetails}>
                                <Text style={styles.rangeText}>Jarak Anda: <Text style={{ fontWeight: 'bold' }}>{resultModal.data.distance}m</Text></Text>
                                <Text style={styles.rangeText}>Batas Max: {resultModal.data.max}m</Text>
                            </View>
                        )}

                        <Text style={styles.modalSub}>{
                            resultModal.type === 'success'
                                ? 'Laporan absensi Anda telah tercatat di sistem.'
                                : 'Terjadi kendala saat memproses data. Silakan coba lagi.'
                        }</Text>

                        <Button
                            mode="contained"
                            style={styles.closeBtn}
                            onPress={() => {
                                setResultModal({ ...resultModal, visible: false });
                                if (resultModal.type === 'success') {
                                    // Reset camera and form for next attendance
                                    setPhoto(null);
                                    setNotes('');
                                    navigation.goBack();
                                }
                            }}
                        >
                            {resultModal.type === 'success' ? 'Selesai' : 'Tutup'}
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FFF" />
                    <Text style={{ color: '#FFF', marginTop: 10 }}>Mengirim Data...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    headerBrand: {
        backgroundColor: colors.primary,
        padding: spacing.xl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
    },
    headerInfo: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    headerSubtitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    cameraWrapper: {
        height: 350,
        margin: spacing.lg,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000',
        ...shadows.md
    },
    camera: { flex: 1 },
    cameraOverlay: { padding: 10, alignItems: 'flex-end' },
    photoPreview: { flex: 1 },
    photo: { flex: 1, resizeMode: 'cover' },
    retakeIcon: { position: 'absolute', top: 10, right: 10 },
    form: { paddingHorizontal: spacing.xl },
    snapButton: { marginBottom: spacing.lg, borderRadius: borderRadius.md },
    geoCard: { padding: 12, borderRadius: 15, backgroundColor: colors.surface, marginBottom: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    geoTitle: { flex: 1, fontSize: 13, color: colors.textSecondary },
    notesInput: { backgroundColor: colors.surface, marginBottom: spacing.xl },
    actionGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    actionBtn: {
        width: '48%',
        height: 100,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm
    },
    checkInBtn: { backgroundColor: colors.primary },
    checkOutBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.error },
    btnLabel: { color: '#FFF', fontWeight: 'bold', marginTop: 8, fontSize: 14 },
    disabledBtn: { opacity: 0.5 },
    resultModal: { backgroundColor: 'white', margin: 30, borderRadius: 30, padding: 0, overflow: 'hidden' },
    modalBody: { padding: 30, alignItems: 'center' },
    modalIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    modalSub: { textAlign: 'center', color: colors.textSecondary, marginBottom: 25, lineHeight: 20 },
    rangeDetails: { backgroundColor: colors.background, padding: 10, borderRadius: 10, marginBottom: 15, width: '100%', alignItems: 'center' },
    rangeText: { fontSize: 13, color: colors.error },
    closeBtn: { width: '100%', borderRadius: 12 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 99 }
});
