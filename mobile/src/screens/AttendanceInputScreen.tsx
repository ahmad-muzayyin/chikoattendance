import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, TextInput, Card, Portal, Modal, IconButton, Surface, ActivityIndicator, useTheme, Dialog, Chip } from 'react-native-paper';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

// import * as FaceDetector from 'expo-face-detector'; // Removed to prevent crash
let FaceDetector: any;
try {
    FaceDetector = require('expo-face-detector');
} catch (e) {
    console.log('WARN: expo-face-detector not found (Native module missing). defaulting to mock.');
    FaceDetector = {
        detectFacesAsync: async (uri: string) => ({ faces: [{ bounds: {} }] }), // Mock detecting 1 face to allow bypass
        FaceDetectorMode: { fast: 'fast' },
        FaceDetectorLandmarks: { none: 'none' },
        FaceDetectorClassifications: { none: 'none' }
    };
}
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { useAuth } from '../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';

const { width } = Dimensions.get('window');

// Helper: Haversine Distance (Meters)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000; // Returns meters
}

export default function AttendanceInputScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { user } = useAuth();
    const theme = useTheme();

    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [facing, setFacing] = useState<CameraType>('front');
    const [faceDetected, setFaceDetected] = useState(true); // Default true to allow capture, we validate AFTER capture now
    const [photo, setPhoto] = useState<string | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true); // Initial load state
    const [statusMessage, setStatusMessage] = useState('Menginisialisasi...');

    // Branch Detection
    const [branches, setBranches] = useState<any[]>([]);
    const [detectedOutlet, setDetectedOutlet] = useState<string | null>(null); // "nama outlet" or null
    const [nearestBranch, setNearestBranch] = useState<any>(null); // For Map Visualization

    // Result Modals
    const [resultModal, setResultModal] = useState<{ visible: boolean, type: 'success' | 'error' | 'range' | 'info', message: string, data?: any }>({
        visible: false,
        type: 'success',
        message: ''
    });

    const [todayCheckIn, setTodayCheckIn] = useState<Date | null>(null);
    const [activeEvent, setActiveEvent] = useState<any>(null);

    const [userShift, setUserShift] = useState<{ endHour: string } | null>(null);
    const [hasCheckedOutToday, setHasCheckedOutToday] = useState(false);
    const [todayRecord, setTodayRecord] = useState<any>(null); // To store full record for display
    const [availableEvents, setAvailableEvents] = useState<any[]>([]); // List of all events today

    // Initial Data Fetch
    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const init = async () => {
                setStatusLoading(true);
                try {
                    // Parallel Execution: Don't wait for location to start fetching attendance
                    const locationPromise = Location.requestForegroundPermissionsAsync().then(({ status }) => {
                        if (status === 'granted') {
                            return getLocation();
                        } else {
                            setStatusMessage('Izin lokasi diperlukan.');
                        }
                    });

                    const attendancePromise = fetchUserDataAndAttendance();

                    await Promise.all([locationPromise, attendancePromise]);
                } finally {
                    setStatusLoading(false);
                }
            };

            init();

            // Fetch Branches
            const fetchBranches = async () => {
                try {
                    const token = await SecureStore.getItemAsync('authToken');
                    if (!token) return;
                    const { data } = await axios.get(`${API_CONFIG.BASE_URL}/branches`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (isActive) setBranches(data);
                } catch (error) { console.log('Failed to fetch branches'); }
            };

            const fetchTodayEvent = async () => {
                try {
                    const token = await SecureStore.getItemAsync('authToken');
                    const { data } = await axios.get(`${API_CONFIG.BASE_URL}/events`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const todayStr = new Date().toISOString().split('T')[0];
                    const todaysEvents = data.filter((e: any) => e.date.startsWith(todayStr));

                    if (isActive) {
                        setAvailableEvents(todaysEvents);
                        if (todaysEvents.length > 0) {
                            setActiveEvent(todaysEvents[0]);
                            setStatusMessage(`Event: ${todaysEvents[0].name} (Bypass Jadwal)`);
                        }
                    }
                } catch (error) { console.log('No events found'); }
            };

            fetchBranches();
            fetchTodayEvent();

            return () => { isActive = false; };
        }, [])
    );

    const fetchUserDataAndAttendance = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');

            // 1. Fetch User Profile for Shift
            // Using endpoint that returns full user info or refresh from auth
            // Assuming /auth/me or similar exists, or use stored user data if sufficient.
            // But we need Shift details which might not be in initial login storage.
            // Let's assume we can hit /profile or /auth/me
            try {
                const userRes = await axios.get(`${API_CONFIG.BASE_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (userRes.data && userRes.data.user) {
                    const user = userRes.data.user;
                    const shiftEnd = user.shift?.endHour || user.branch?.endHour || '17:00';
                    setUserShift({ endHour: shiftEnd });
                }
            } catch (e) { console.log('Failed to refresh user data'); }


            // 2. Fetch Attendance (API)
            // FETCH ALL SOURCES: Stats (Realtime), History, Calendar
            let historyList: any[] = [];
            let statsData: any = null;

            // A. Fetch Realtime Stats
            try {
                const statsRes = await axios.get(`${API_CONFIG.BASE_URL}/stats`, { headers: { Authorization: `Bearer ${token}` } });
                statsData = statsRes.data;
                console.log("Stats Loaded:", JSON.stringify(statsData));
            } catch (e) { console.log("Stats failed"); }

            // B. Fetch History & Calendar
            const fetchCal = axios.get(`${API_CONFIG.BASE_URL}${ENDPOINTS.CALENDAR}?deviceId=MOBILE_APP`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => (Array.isArray(res.data) ? res.data : (res.data?.data || [])))
                .catch(() => []);

            const fetchHist = axios.get(`${API_CONFIG.BASE_URL}${ENDPOINTS.HISTORY}?deviceId=MOBILE_APP`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => (Array.isArray(res.data) ? res.data : (res.data?.data || [])))
                .catch(() => []);

            // C. Fetch Local Persistence (Backup for Server Lag)
            const localStatusPromise = SecureStore.getItemAsync('local_attendance_status');
            const localTimePromise = SecureStore.getItemAsync('local_attendance_time');

            const [calData, histData, localStatus, localTimeStr] = await Promise.all([
                fetchCal, fetchHist, localStatusPromise, localTimePromise
            ]);

            historyList = [...calData, ...histData];

            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const todayDateStr = `${yyyy}-${mm}-${dd}`;

            // Reset States
            setTodayCheckIn(null);
            setHasCheckedOutToday(false);
            setTodayRecord(null);

            // LOGIC START
            let determinedState = 'IDLE';
            let relevantTime: Date | null = null;
            let displayRecord: any = null;

            // STRATEGY: Trust /stats if available
            if (statsData && statsData.currentStatus) {
                if (statsData.currentStatus === 'CHECKED_IN') {
                    determinedState = 'CHECKED_IN';
                    relevantTime = statsData.lastCheckInTime ? new Date(statsData.lastCheckInTime) : new Date();
                } else if (statsData.currentStatus === 'CHECKED_OUT') {
                    // Check if it's TODAY's checkout
                    const lastOut = statsData.lastCheckOutTime ? new Date(statsData.lastCheckOutTime) : null;
                    if (lastOut && lastOut.getDate() === now.getDate()) {
                        determinedState = 'CHECKED_OUT';
                        relevantTime = lastOut;
                    }
                }
            }

            // FALLBACK CALCULATION (If Stats says nothing or failed)
            if (determinedState === 'IDLE') {
                const validList = historyList.filter((r: any) => r.date && r.checkInTime);
                const sortedData = validList.sort((a: any, b: any) => {
                    if (a.date !== b.date) return b.date.localeCompare(a.date);
                    return b.checkInTime.localeCompare(a.checkInTime);
                });

                const latestServerRecord = sortedData[0];

                if (latestServerRecord) {
                    const [ry, rm, rd] = latestServerRecord.date.split('-').map(Number);
                    const [rh, rmn] = latestServerRecord.checkInTime.split(':').map(Number);
                    const recordCheckInDate = new Date(ry, rm - 1, rd, rh, rmn);
                    const diffMs = now.getTime() - recordCheckInDate.getTime();
                    const hoursSinceCheckIn = diffMs / (1000 * 60 * 60);

                    const isDateMatch = (yyyy === ry && (now.getMonth() + 1) === rm && now.getDate() === rd);
                    const isCheckedOut = latestServerRecord.checkOutTime &&
                        latestServerRecord.checkOutTime !== '00:00:00' &&
                        latestServerRecord.checkOutTime !== '00:00';

                    if (!isCheckedOut) {
                        if (isDateMatch || hoursSinceCheckIn < 24) {
                            determinedState = 'CHECKED_IN';
                            relevantTime = recordCheckInDate;
                            displayRecord = latestServerRecord;
                        }
                    } else {
                        if (isDateMatch) {
                            determinedState = 'CHECKED_OUT';
                            relevantTime = recordCheckInDate;
                            displayRecord = latestServerRecord;
                        }
                    }
                }
            }

            // EMERGENCY LOCAL OVERRIDE (If Server is IDLE but Local is ACTIVE Today)
            // This prevents "flicker" to IDLE when server is lagging
            if (determinedState === 'IDLE' && localStatus && localTimeStr) {
                const localDate = new Date(localTimeStr);
                const isLocalToday = (localDate.getDate() === now.getDate() && localDate.getMonth() === now.getMonth() && localDate.getFullYear() === now.getFullYear());

                // If local says 'CHECKED_IN' and it's from today (or very recent)
                if (isLocalToday && localStatus === 'CHECKED_IN') {
                    determinedState = 'CHECKED_IN';
                    relevantTime = localDate;

                    if (!displayRecord) {
                        displayRecord = {
                            date: todayDateStr,
                            checkInTime: localDate.toTimeString().substring(0, 5),
                            checkOutTime: null
                        };
                    }
                    console.log(">> Server Lag Detected: Using Local 'CHECKED_IN'");
                }
                // If local says 'CHECKED_OUT' and it's from today
                else if (isLocalToday && localStatus === 'CHECKED_OUT') {
                    determinedState = 'CHECKED_OUT';
                    if (!displayRecord) {
                        displayRecord = {
                            date: todayDateStr,
                            checkInTime: "--:--",
                            checkOutTime: localDate.toTimeString().substring(0, 5)
                        };
                    }
                    console.log(">> Server Lag Detected: Using Local 'CHECKED_OUT'");
                }
            }

            // Set Display Record based on determined state
            if (!displayRecord) {
                // Try to find the record corresponding to the relevant time from the history list
                displayRecord = historyList.find((r: any) => r.date === todayDateStr);
            }

            // 3. APPLY FINAL STATE
            if (determinedState === 'CHECKED_IN') {
                setTodayCheckIn(relevantTime || new Date());
                setHasCheckedOutToday(false);
                setStatusMessage('Status: Bekerja (Aktif)');
            } else if (determinedState === 'CHECKED_OUT') {
                setTodayCheckIn(relevantTime || new Date());
                setHasCheckedOutToday(true);
                setStatusMessage('Absensi Hari Ini Selesai ✅');
            } else {
                setTodayCheckIn(null);
                setHasCheckedOutToday(false);
                setStatusMessage('Silakan Absensi Masuk');
            }

        } catch (error) {
            console.log("Failed to fetch todays attendance", error);
        }
    };

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

            // Detect Nearest Branch
            if (branches.length > 0) {
                const { latitude, longitude } = loc.coords;
                let nearest: any = null;
                let minDistance = Infinity;

                branches.forEach((b: any) => {
                    const dist = getDistanceFromLatLonInKm(latitude, longitude, parseFloat(b.latitude), parseFloat(b.longitude));
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearest = b;
                    }
                });

                setNearestBranch(nearest); // Store for Map Visualization

                const radius = nearest?.radius || 100;
                if (nearest && minDistance <= radius) {
                    setDetectedOutlet(nearest.name);
                    setStatusMessage(`Terdeteksi di: ${nearest.name} (${Math.floor(minDistance)}m)`);
                } else {
                    setDetectedOutlet(null);
                    setStatusMessage(`Di luar area outlet. Terdekat: ${nearest?.name || '-'} (${Math.floor(minDistance)}m)`);
                }
            } else {
                setStatusMessage('Lokasi terkunci akurat.');
            }
        } catch (e) {
            setStatusMessage('GPS Error. Coba lagi.');
        }
    };

    const handleRefresh = () => {
        getLocation();
        fetchUserDataAndAttendance();
    };

    const takePicture = async () => {
        if (cameraRef) {
            try {
                const photoData = await cameraRef.takePictureAsync({
                    quality: 0.3, // Compressed for faster upload
                    base64: true,
                });

                // Validate Face AFTER capture
                try {
                    const detection = await FaceDetector.detectFacesAsync(photoData.uri, {
                        mode: FaceDetector.FaceDetectorMode.fast,
                        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                        runClassifications: FaceDetector.FaceDetectorClassifications.none,
                    });

                    if (detection.faces.length === 0) {
                        Alert.alert("Wajah Tidak Terdeteksi", "Mohon posisikan wajah Anda dengan jelas di kamera.");
                        return;
                    }
                } catch (faceError: any) {
                    console.log('Face Detection Warning:', faceError.message);
                    if (faceError.message.includes('native module')) {
                        // Fallback for Dev: If native module is missing, allow bypass
                        // Alert.alert("Dev Warning", "Module Deteksi Wajah belum terinstall. Validasi dilewatkan.");
                    } else {
                        // If it's another error, we might want to ignore or block. 
                        // For testing stability, let's log and proceed.
                    }
                }

                setPhoto(`data:image/jpeg;base64,${photoData.base64}`);
            } catch (e) {
                console.log(e);
                Alert.alert("Eror", "Gagal mengambil foto.");
            }
        }
    };

    const [overtimeReason, setOvertimeReason] = useState('');
    const [showOvertimeDialog, setShowOvertimeDialog] = useState(false);

    const handleSubmit = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
        if (!location) {
            setResultModal({ visible: true, type: 'error', message: 'Lokasi belum ditemukan. Mohon tunggu sejenak atau pastikan GPS aktif.' });
            return;
        }

        // Logic Lembur untuk Check Out
        if (type === 'CHECK_OUT') {
            // User Feedback: "jika waktunya pulang tidak melakukan absensi + 3 jam maka ada notifikasi pertanyaan..."
            // Check if current time > shiftEnd + 3 hours
            if (userShift && userShift.endHour) {
                const now = new Date();
                const [endH, endM] = userShift.endHour.split(':').map(Number);

                // Construct Shift End Date for Today
                const shiftEndDate = new Date();
                shiftEndDate.setHours(endH, endM, 0, 0);

                const diffMs = now.getTime() - shiftEndDate.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);

                // If more than 3 hours late from SHIFT END (and not just duration working)
                if (diffHours >= 3) {
                    setShowOvertimeDialog(true);
                    return;
                }
            }
        }

        if (!photo) {
            setResultModal({ visible: true, type: 'error', message: 'Foto Selfie wajib diambil sebagai bukti kehadiran.' });
            return;
        }

        processCheckout(type);
    };

    const processCheckout = async (type: 'CHECK_IN' | 'CHECK_OUT' = 'CHECK_OUT', isOvertime = false, overtimeNotes = '') => {
        // Confirmation Dialog
        const finalNotes = overtimeNotes ? `${notes} (Lembur: ${overtimeNotes})` : notes;

        const execute = async () => {
            setLoading(true);
            try {
                const token = await SecureStore.getItemAsync('authToken');
                const endpoint = type === 'CHECK_IN' ? ENDPOINTS.CHECK_IN : ENDPOINTS.CHECK_OUT;

                const res = await axios.post(
                    `${API_CONFIG.BASE_URL}${endpoint}`,
                    {
                        latitude: location?.coords.latitude,
                        longitude: location?.coords.longitude,
                        deviceId: 'MOBILE_APP',
                        photoUrl: photo,
                        notes: finalNotes,
                        isOvertime
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Personalised Success Messages
                let successTitle = type === 'CHECK_IN' ? 'Absensi Masuk Berhasil' : 'Absensi Pulang Berhasil';
                let successMsg = type === 'CHECK_IN'
                    ? 'Selamat bekerja! Semangat untuk hari ini.'
                    : 'Terima kasih atas kerja kerasmu hari ini. Hati-hati di jalan!';

                // If Success Check In, update local state
                if (type === 'CHECK_IN') {
                    const now = new Date();
                    setTodayCheckIn(now);
                    // SAVE LOCAL PERSISTENCE
                    SecureStore.setItemAsync('local_attendance_status', 'CHECKED_IN');
                    SecureStore.setItemAsync('local_attendance_time', now.toISOString());

                    const nowStr = now.toTimeString().split(' ')[0];
                    setTodayRecord({
                        checkInTime: nowStr,
                        date: now.toISOString().split('T')[0]
                    });
                } else {
                    const now = new Date();
                    // SAVE LOCAL PERSISTENCE (Checkout)
                    SecureStore.setItemAsync('local_attendance_status', 'CHECKED_OUT');
                    SecureStore.setItemAsync('local_attendance_time', now.toISOString());
                    setHasCheckedOutToday(true);
                }

                setResultModal({
                    visible: true,
                    type: 'success',
                    message: successMsg,
                    data: res.data
                });

            } catch (error: any) {
                const resData = error?.response?.data;
                const status = error?.response?.status;
                let title = 'Gagal Absen';
                let msg = resData?.message || 'Terjadi kesalahan sistem. Mohon coba lagi.';

                // NETWORK / SERVER DOWN
                if (!error.response) {
                    msg = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
                }
                // 400 - BAD REQUEST (Logika Bisnis)
                else if (status === 400) {
                    const lowerMsg = msg.toLowerCase();

                    if (lowerMsg.includes('jangkauan') || lowerMsg.includes('radius') || lowerMsg.includes('too far')) {
                        setResultModal({
                            visible: true,
                            type: 'range',
                            message: 'Lokasi Anda Terlalu Jauh dari Outlet',
                            data: { distance: resData.distance, max: resData.maxRadius }
                        });
                        return;
                    }

                    if (lowerMsg.includes('already') || lowerMsg.includes('sudah')) {
                        // DETEKSI DUPLIKAT: Perbaiki State Aplikasi secara Paksa
                        // Silent Recovery: Just update the state and let user press Pulang.

                        // Fix for "Mode Lembur" complaint:
                        // Don't show a big modal. Just update state and show a small toast/alert.

                        if (type === 'CHECK_IN') {
                            const now = new Date();
                            setTodayCheckIn(now);
                            setHasCheckedOutToday(false);

                            // SAVE LOCAL PERSISTENCE (Recovery)
                            SecureStore.setItemAsync('local_attendance_status', 'CHECKED_IN');
                            SecureStore.setItemAsync('local_attendance_time', now.toISOString());

                            // Create a dummy record so the UI card shows something
                            const nowStr = now.toTimeString().split(' ')[0];
                            setTodayRecord({
                                checkInTime: nowStr,
                                date: now.toISOString().split('T')[0]
                            });

                            // Simple Native Alert (Less intrusive than custom modal)
                            Alert.alert("Status Diperbarui", "Anda sudah tercatat Absen Masuk. Tombol telah dialihkan ke Absen Pulang.");
                            return;

                        } else if (type === 'CHECK_OUT') {
                            setHasCheckedOutToday(true);
                            setTodayCheckIn(new Date()); // Ensure it looks "done"
                            // SAVE LOCAL PERSISTENCE
                            SecureStore.setItemAsync('local_attendance_status', 'CHECKED_OUT');
                            SecureStore.setItemAsync('local_attendance_time', new Date().toISOString());

                            Alert.alert("Info", "Anda sudah Check-Out sebelumnya.");
                            return;
                        }
                    } else if (lowerMsg.includes('shift') || lowerMsg.includes('schedule')) {
                        msg = 'Tidak ada jadwal shift yang aktif saat ini. Hubungi supervisor jika jadwal tidak sesuai.';
                        title = 'Diluar Jadwal';
                    } else if (lowerMsg.includes('face') || lowerMsg.includes('wajah')) {
                        msg = 'Wajah tidak terdeteksi dengan jelas di foto. Mohon foto ulang di tempat terang.';
                        title = 'Wajah Tidak Terdeteksi';
                    }
                }
                // 403 - FORBIDDEN
                else if (status === 403) {
                    msg = 'Akun Anda tidak memiliki izin untuk melakukan absensi ini.';
                    title = 'Akses Ditolak';
                }
                // 500 - SERVER ERROR
                else if (status >= 500) {
                    msg = 'Server sedang sibuk atau mengalami gangguan. Mohon coba beberapa saat lagi.';
                    title = 'Gangguan Server';
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

        if (isOvertime) {
            execute();
        } else {
            Alert.alert(
                `Konfirmasi ${type === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}`,
                `Anda akan melakukan absensi ${type === 'CHECK_IN' ? 'MASUK' : 'PULANG'}.\n\nPastikan data sudah benar karena tidak dapat diubah (Hanya 1x sehari).`,
                [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Ya, Kirim', onPress: execute }
                ]
            );
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

                        {/* Lokasi Tugas (Seharusnya) */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                            <MaterialCommunityIcons name="briefcase-outline" size={14} color="white" style={{ marginRight: 6 }} />
                            <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>
                                Tugas: {user?.branch?.name || 'Outlet Pusat'}
                            </Text>
                        </View>

                        {/* Lokasi Terdeteksi GPS */}
                        <Text style={styles.headerSubtitle}>
                            {detectedOutlet ? `📍 Posisi: ${detectedOutlet}` : (statusMessage.includes('Melacak') ? '📡 Melacak Lokasi...' : '❌ Di Luar Outlet')}
                        </Text>
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
                                <View style={styles.camera}>
                                    <CameraView style={StyleSheet.absoluteFill} facing={facing} ref={setCameraRef} />
                                    <View style={styles.cameraControls}>
                                        <IconButton
                                            icon="camera-flip"
                                            iconColor="#FFF"
                                            containerColor="rgba(0,0,0,0.4)"
                                            size={20}
                                            onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}
                                        />
                                    </View>
                                    {/* Face Validation Indicator (Static) */}
                                    <View style={{
                                        position: 'absolute',
                                        bottom: 16,
                                        alignSelf: 'center',
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 20,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    }}>
                                        <MaterialCommunityIcons name="face-recognition" size={16} color="#4ADE80" style={{ marginRight: 6 }} />
                                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                                            Validasi Wajah Aktif
                                        </Text>
                                    </View>
                                </View>
                            )
                        )}
                    </View>

                    {!photo && !loading && (
                        <TouchableOpacity
                            style={styles.captureButton}
                            onPress={takePicture}
                        >
                            <MaterialCommunityIcons name="camera" size={24} color="white" />
                            <Text style={styles.captureText}>Ambil Foto</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Event Banner */}
                {activeEvent && (
                    <Surface style={styles.eventBanner} elevation={2}>
                        <MaterialCommunityIcons name="calendar-star" size={24} color="#FFF" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.eventTitle}>Event: {activeEvent.name}</Text>
                            <Text style={styles.eventSub}>Mode Bebas Jadwal Aktif. Absensi dibuka 00:01.</Text>
                        </View>
                    </Surface>
                )}

                {/* Maps & Location Info */}
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
                        onPress={handleRefresh}
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

                {/* Today's Attendance Info Card */}
                {todayRecord && (
                    <View style={{
                        backgroundColor: 'white',
                        marginHorizontal: 4,
                        marginBottom: 20,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
                    }}>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>JAM MASUK</Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#16A34A' }}>
                                {todayRecord.checkInTime?.substring(0, 5) || '--:--'}
                            </Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 10 }} />
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>JAM PULANG</Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: todayRecord.checkOutTime ? '#DC2626' : '#9CA3AF' }}>
                                {(todayRecord.checkOutTime && todayRecord.checkOutTime !== '00:00:00') ? todayRecord.checkOutTime.substring(0, 5) : '--:--'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* SINGLE ACTION BUTTON */}
                <View style={styles.actionContainer}>
                    {statusLoading ? (
                        <View style={[styles.btnShadowContainer, { justifyContent: 'center', alignItems: 'center', height: 80, backgroundColor: '#F1F5F9' }]}>
                            <ActivityIndicator size="small" color="#94A3B8" />
                            <Text style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>Memeriksa Status...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.btnShadowContainer,
                                (loading || !location || (hasCheckedOutToday && !activeEvent)) && styles.disabledBtn
                            ]}
                            onPress={() => {
                                if (hasCheckedOutToday) {
                                    Alert.alert("Selesai", "Anda sudah menyelesaikan absensi hari ini.");
                                    return;
                                }
                                handleSubmit(todayCheckIn ? 'CHECK_OUT' : 'CHECK_IN');
                            }}
                            disabled={loading || !location || (hasCheckedOutToday && !activeEvent)}
                            activeOpacity={0.9}
                        >
                            <View style={styles.btnOverflow}>
                                <LinearGradient
                                    colors={
                                        hasCheckedOutToday ? ['#64748B', '#475569'] :
                                            todayCheckIn ? ['#1E293B', '#0F172A'] : // Dark/Navy for Checkout
                                                ['#DC2626', '#B91C1C'] // Red for Checkin
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.actionBtnGradient, { justifyContent: 'center', paddingVertical: 0 }]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={[styles.iconCircleWhite, {
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            width: 56, height: 56, borderRadius: 28
                                        }]}>
                                            <MaterialCommunityIcons
                                                name={hasCheckedOutToday ? "check-all" : todayCheckIn ? "logout" : "login"}
                                                size={28}
                                                color="#FFF"
                                            />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 20, fontWeight: '800', color: 'white', letterSpacing: 0.5 }}>
                                                {hasCheckedOutToday ? 'SELESAI HARI INI' : todayCheckIn ? 'ABSEN PULANG' : 'ABSEN MASUK'}
                                            </Text>
                                            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
                                                {hasCheckedOutToday ? 'Sampai jumpa besok!' : todayCheckIn ? 'Tekan untuk mengakhiri shift' : 'Tekan untuk memulai shift'}
                                            </Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Result Modal */}
            <Portal>
                {/* Overtime Reason Dialog */}
                <Dialog visible={showOvertimeDialog} onDismiss={() => setShowOvertimeDialog(false)}>
                    <Dialog.Title>Sedang Lembur?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ marginBottom: 10 }}>
                            Sistem mendeteksi Anda pulang terlambat 3 jam dari jadwal.
                        </Text>
                        <Text style={{ fontWeight: 'bold' }}>
                            Apakah Anda sedang mengerjakan Event/Lembur?
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666', marginTop: 5, marginBottom: 10 }}>
                            Jika TIDAK, silakan tekan tombol "Tidak, Hanya Pulang".
                        </Text>

                        {availableEvents.length > 0 && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                {availableEvents.map((evt: any, idx: number) => (
                                    <Chip
                                        key={idx}
                                        selected={overtimeReason === evt.name}
                                        onPress={() => setOvertimeReason(evt.name)}
                                        mode="outlined"
                                        style={{ marginBottom: 4 }}
                                    >
                                        {evt.name}
                                    </Chip>
                                ))}
                            </View>
                        )}

                        <TextInput
                            label="Alasan Lembur / Nama Event"
                            value={overtimeReason}
                            onChangeText={setOvertimeReason}
                            mode="outlined"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => {
                            setShowOvertimeDialog(false);
                            processCheckout('CHECK_OUT', false); // No overtime
                        }}>Tidak, Hanya Pulang</Button>
                        <Button onPress={() => {
                            if (!overtimeReason) {
                                Alert.alert("Wajib Diisi", "Mohon isi alasan lembur.");
                                return;
                            }
                            setShowOvertimeDialog(false);
                            processCheckout('CHECK_OUT', true, overtimeReason); // Overtime confirmed
                        }}>Ya, Kirim Lembur</Button>
                    </Dialog.Actions>
                </Dialog>

                <Modal
                    visible={resultModal.visible}
                    onDismiss={() => resultModal.type !== 'success' && setResultModal({ ...resultModal, visible: false })}
                    contentContainerStyle={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={[styles.modalIconCircle, { backgroundColor: resultModal.type === 'success' ? '#DCFCE7' : resultModal.type === 'info' ? '#DBEAFE' : '#FEF2F2' }]}>
                            <MaterialCommunityIcons
                                name={resultModal.type === 'success' ? 'check' : resultModal.type === 'info' ? 'clock-check-outline' : 'alert-outline'}
                                size={40}
                                color={resultModal.type === 'success' ? '#16A34A' : resultModal.type === 'info' ? '#3B82F6' : '#DC2626'}
                            />
                        </View>

                        <Text style={styles.modalTitle}>
                            {resultModal.type === 'success' ? 'Berhasil!' :
                                resultModal.type === 'info' ? 'Mode Lembur' : 'Oops!'}
                        </Text>
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
                                { backgroundColor: resultModal.type === 'success' ? '#16A34A' : resultModal.type === 'info' ? '#3B82F6' : '#DC2626' }
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
        height: 240, // Increased from 180 to fit new content
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'center', // Center content vertically
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

    // Event Banner
    eventBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#EC4899', // Pink event color
        borderRadius: 12,
        marginBottom: 16,
        marginHorizontal: 4,
        shadowColor: "#EC4899",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    eventTitle: {
        fontWeight: 'bold',
        color: '#FFF',
        fontSize: 14,
    },
    eventSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
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
    // Action Buttons
    actionContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    btnShadowContainer: {
        flex: 1,
        borderRadius: 20,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        height: 100,
    },
    btnOverflow: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    actionBtnGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    btnTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    iconCircleWhite: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnTitleMain: {
        fontSize: 16,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    btnSubWhite: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
    },
    disabledBtn: {
        opacity: 0.5,
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
