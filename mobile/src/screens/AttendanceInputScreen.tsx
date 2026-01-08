import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, TextInput, Card, Portal, Modal, IconButton, Surface, ActivityIndicator, useTheme } from 'react-native-paper';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { useAuth } from '../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AttendanceInputScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { user } = useAuth();
    const theme = useTheme();

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
            setStatusMessage('Lokasi terkunci akurat.');
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
            const status = error?.response?.status;
            let title = 'Gagal Absen';
            let msg = resData?.message || 'Terjadi kesalahan sistem. Mohon coba lagi.';

            // NETWORK / SERVER DOWN
            if (!error.response) {
                msg = 'Koneksi gagal. Periksa internet Anda atau server sedang maintenance.';
            }
            // 400 - BAD REQUEST (Logika Bisnis)
            else if (status === 400) {
                const lowerMsg = msg.toLowerCase();

                if (lowerMsg.includes('jangkauan') || lowerMsg.includes('radius') || lowerMsg.includes('too far')) {
                    setResultModal({
                        visible: true,
                        type: 'range',
                        message: 'Posisi Anda Diluar Radius Absensi',
                        data: { distance: resData.distance, max: resData.maxRadius }
                    });
                    return; // Exit here as we used specific modal type
                }

                if (lowerMsg.includes('already') || lowerMsg.includes('sudah')) {
                    msg = type === 'CHECK_IN' ? 'Anda sudah tercatat MASUK hari ini.' : 'Anda sudah tercatat PULANG hari ini.';
                    title = 'Duplikat Absensi';
                } else if (lowerMsg.includes('shift') || lowerMsg.includes('schedule')) {
                    msg = 'Jadwal Shift tidak ditemukan atau belum saatnya absen.';
                    title = 'Diluar Jadwal';
                } else if (lowerMsg.includes('face') || lowerMsg.includes('wajah')) {
                    msg = 'Wajah tidak terdeteksi dengan jelas. Pastikan pencahayaan cukup dan wajah terlihat.';
                    title = 'Foto Tidak Valid';
                }
            }
            // 403 - FORBIDDEN
            else if (status === 403) {
                msg = 'Akun Anda tidak berhak melakukan absensi ini. Hubungi atasan.';
                title = 'Akses Ditolak';
            }
            // 500 - SERVER ERROR
            else if (status >= 500) {
                msg = 'Server sedang mengalami gangguan. Mohon tunggu sebentar dan coba lagi.';
                title = 'Server Error';
            }

            setResultModal({
                visible: true,
                type: 'error',
                message: `${title}\n\n${msg}`,
                data: null
            });
        } finally {
            setLoading(false);
        }
    };

    if (!permission?.granted) {
        return (
            <View style={styles.center}>
                <MaterialCommunityIcons name="camera-off" size={60} color={colors.textMuted} />
                <Text style={{ marginVertical: 20 }}>Izin kamera diperlukan untuk absensi.</Text>
                <Button mode="contained" onPress={requestPermission} style={styles.button}>Berikan Izin</Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Curved Gradient Header */}
            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={['#DC2626', '#EF4444', '#F87171']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    {/* Decorative Circles */}
                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />

                    <View style={styles.headerContent}>
                        <MaterialCommunityIcons name="store-marker" size={28} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.headerTitle}>Absensi Outlet</Text>
                        <Text style={styles.headerSubtitle}>{user?.branch?.name || 'Toko Pusat'}</Text>
                    </View>
                </LinearGradient>
                <View style={styles.curvedBottom} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Camera View */}
                <View style={styles.cameraCard}>
                    <View style={styles.cameraHeader}>
                        <Text style={styles.sectionTitle}>Foto Selfie</Text>
                        {photo && (
                            <TouchableOpacity onPress={() => setPhoto(null)}>
                                <Text style={styles.retakeText}>Ambil Ulang</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.cameraWrapper}>
                        {photo ? (
                            <Image source={{ uri: photo }} style={styles.photo} />
                        ) : (
                            isFocused && (
                                <CameraView style={styles.camera} facing={facing} ref={setCameraRef}>
                                    <View style={styles.cameraControls}>
                                        <IconButton
                                            icon="camera-flip"
                                            iconColor="#FFF"
                                            containerColor="rgba(0,0,0,0.4)"
                                            size={20}
                                            onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}
                                        />
                                    </View>
                                </CameraView>
                            )
                        )}
                    </View>

                    {!photo && !loading && (
                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                            <MaterialCommunityIcons name="camera" size={24} color="white" />
                            <Text style={styles.captureText}>Ambil Foto</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Location Status */}
                <View style={styles.locationCard}>
                    <View style={[styles.locationIndicator, { backgroundColor: location ? '#DCFCE7' : '#FEF2F2' }]}>
                        <MaterialCommunityIcons
                            name={location ? "map-marker-check" : "map-marker-off"}
                            size={20}
                            color={location ? "#16A34A" : "#DC2626"}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.locationTitle}>Status Lokasi</Text>
                        <Text style={[styles.locationStatus, { color: location ? '#16A34A' : '#DC2626' }]}>
                            {statusMessage}
                        </Text>
                    </View>
                    <IconButton
                        icon="refresh"
                        size={20}
                        iconColor="#6B7280"
                        onPress={getLocation}
                        disabled={loading}
                        style={{ margin: 0 }}
                    />
                </View>

                {/* Notes Input */}
                <View style={styles.formCard}>
                    <Text style={styles.fieldLabel}>Catatan (Opsional)</Text>
                    <TextInput
                        placeholder="Tambahkan keterangan jika perlu..."
                        value={notes}
                        onChangeText={setNotes}
                        mode="flat"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                        underlineColor="transparent"
                        activeUnderlineColor="#DC2626"
                        theme={{ roundness: 12, colors: { background: '#F9FAFB' } }}
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.checkInBtn, (loading || !location) && styles.disabledBtn]}
                        onPress={() => handleSubmit('CHECK_IN')}
                        disabled={loading || !location}
                        activeOpacity={0.8}
                    >
                        <View style={styles.btnIconBg}>
                            <MaterialCommunityIcons name="login" size={24} color="#DC2626" />
                        </View>
                        <View>
                            <Text style={styles.btnTitle}>MASUK</Text>
                            <Text style={styles.btnSub}>Mulai Shift</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.checkOutBtn, (loading || !location) && styles.disabledBtn]}
                        onPress={() => handleSubmit('CHECK_OUT')}
                        disabled={loading || !location}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.btnIconBg, { backgroundColor: '#F3F4F6' }]}>
                            <MaterialCommunityIcons name="logout" size={24} color="#4B5563" />
                        </View>
                        <View>
                            <Text style={[styles.btnTitle, { color: '#374151' }]}>PULANG</Text>
                            <Text style={styles.btnSub}>Akhiri Shift</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Result Modal */}
            <Portal>
                <Modal
                    visible={resultModal.visible}
                    onDismiss={() => resultModal.type !== 'success' && setResultModal({ ...resultModal, visible: false })}
                    contentContainerStyle={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={[styles.modalIconCircle, { backgroundColor: resultModal.type === 'success' ? '#DCFCE7' : '#FEF2F2' }]}>
                            <MaterialCommunityIcons
                                name={resultModal.type === 'success' ? 'check' : 'alert-outline'}
                                size={40}
                                color={resultModal.type === 'success' ? '#16A34A' : '#DC2626'}
                            />
                        </View>

                        <Text style={styles.modalTitle}>{resultModal.type === 'success' ? 'Berhasil!' : 'Oops!'}</Text>
                        <Text style={styles.modalMessage}>{resultModal.message}</Text>

                        {resultModal.type === 'range' && resultModal.data && (
                            <View style={styles.rangeInfo}>
                                <Text style={styles.rangeText}>Jarak: {resultModal.data.distance}m</Text>
                                <Text style={styles.rangeText}>Maks: {resultModal.data.max}m</Text>
                            </View>
                        )}

                        <Button
                            mode="contained"
                            onPress={() => {
                                setResultModal({ ...resultModal, visible: false });
                                if (resultModal.type === 'success') {
                                    setPhoto(null);
                                    setNotes('');
                                    navigation.goBack();
                                }
                            }}
                            style={[
                                styles.modalButton,
                                { backgroundColor: resultModal.type === 'success' ? '#16A34A' : '#DC2626' }
                            ]}
                            labelStyle={{ fontWeight: 'bold' }}
                        >
                            {resultModal.type === 'success' ? 'SELESAI' : 'MENGERTI'}
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={styles.loadingText}>Mengirim Data...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    // Header Styles matched with Settings
    headerContainer: {
        position: 'relative',
        marginBottom: -20,
        zIndex: 1,
    },
    header: {
        height: 180,
        paddingTop: 50,
        paddingHorizontal: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -80,
        right: -40,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: 20,
        left: -20,
    },
    headerContent: {
        alignItems: 'center',
        marginTop: 10,
    },
    headerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    curvedBottom: {
        height: 24,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },

    // Camera Card
    cameraCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    retakeText: {
        fontSize: 13,
        color: '#DC2626',
        fontWeight: '600',
    },
    cameraWrapper: {
        height: 320,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    photo: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cameraControls: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    captureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    captureText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },

    // Location Card
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    locationIndicator: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationTitle: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    locationStatus: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Notes Form
    formCard: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#F9FAFB',
        fontSize: 14,
    },

    // Action Buttons
    actionContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
        height: 110,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    checkInBtn: {
        backgroundColor: 'white',
        borderLeftWidth: 4,
        borderLeftColor: '#DC2626',
    },
    checkOutBtn: {
        backgroundColor: 'white',
        borderLeftWidth: 4,
        borderLeftColor: '#4B5563',
    },
    btnIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    btnTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#DC2626',
        marginBottom: 2,
    },
    btnSub: {
        fontSize: 12,
        color: '#6B7280',
    },
    disabledBtn: {
        opacity: 0.6,
    },

    // Modals
    modalContainer: {
        backgroundColor: 'white',
        marginHorizontal: 32,
        borderRadius: 24,
        padding: 0,
        overflow: 'hidden',
    },
    modalContent: {
        padding: 24,
        alignItems: 'center',
    },
    modalIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    rangeInfo: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 12,
        width: '100%',
        marginBottom: 20,
    },
    rangeText: {
        fontSize: 13,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 2,
    },
    modalButton: {
        width: '100%',
        borderRadius: 12,
        paddingVertical: 2,
    },
    button: {
        borderRadius: 12,
    },

    // Loading
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99,
    },
    loadingText: {
        color: 'white',
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    }
});
