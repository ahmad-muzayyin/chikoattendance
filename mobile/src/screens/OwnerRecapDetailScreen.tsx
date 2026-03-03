// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\screens\OwnerRecapDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Image, StatusBar } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, Portal, Dialog, RadioButton, Modal, TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';

const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function OwnerRecapDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { userId, userName } = route.params;

    console.log('🔍 OwnerRecapDetail -> Params:', { userId, userName, type: typeof userId });

    const [attendances, setAttendances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-indexed
    const [year, setYear] = useState(new Date().getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const [tempMonth, setTempMonth] = useState(month);
    const [tempYear, setTempYear] = useState(year);
    const [visibleCount, setVisibleCount] = useState(7);
    const [photoModal, setPhotoModal] = useState<{ visible: boolean, photoUrl: string | null, data: any }>({
        visible: false,
        photoUrl: null,
        data: null
    });
    const [userProfile, setUserProfile] = useState<any>(null);
    const [pointsData, setPointsData] = useState<any>(null);
    const [punishmentModal, setPunishmentModal] = useState({ visible: false, points: '', reason: '' });
    const [punishmentLoading, setPunishmentLoading] = useState(false);

    const fetchAttendance = async () => {
        setLoading(true);
        setVisibleCount(7);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}/admin/attendance/${userId}`, {
                params: { month, year },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(res.data)) {
                console.log('📸 Attendance Data Sample:', JSON.stringify(res.data[0], null, 2));
                setAttendances(res.data);
            } else {
                setAttendances([]);
            }

            // Fetch User Detail for Audit Comparison
            try {
                const userRes = await axios.get(`${API_CONFIG.BASE_URL}/admin/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ User Profile Fetched:', userRes.data?.name);
                setUserProfile(userRes.data);
            } catch (err) {
                console.log('Profile fetch failed - likely endpoint not deployed yet');
            }

            try {
                const pointsRes = await axios.get(`${API_CONFIG.BASE_URL}/admin/users/${userId}/points`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPointsData(pointsRes.data);
            } catch (err) {
                console.log('Points fetch failed - likely endpoint not deployed yet');
            }

        } catch (error: any) {
            console.error('❌ Fetch attendance error:', error?.response?.status, error?.response?.data || error.message);
            console.error('❌ Failed URL:', error?.config?.url);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        navigation.setOptions({ title: userName });
        fetchAttendance();
    }, [month, year]);

    // Grouping logic remains similar but I'll optimize
    const items = attendances.map((item: any) => {
        const alphaEvent = item.events?.find((e: any) => e.type === 'ALPHA');
        const permitEvent = item.events?.find((e: any) => e.type === 'PERMIT');
        const sickEvent = item.events?.find((e: any) => e.type === 'SICK');

        return {
            ...item,
            isAlpha: !!alphaEvent,
            alphaNotes: alphaEvent?.notes,
            isPermit: !!permitEvent,
            permitNotes: permitEvent?.notes,
            isSick: !!sickEvent,
            sickNotes: sickEvent?.notes,
            userId: userId // Ensure we have this for punishment
        };
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <View style={styles.container}>
            {/* Modern Filter Header */}
            <Surface style={styles.headerSurface} elevation={2}>
                <TouchableOpacity
                    onPress={() => {
                        setTempMonth(month);
                        setTempYear(year);
                        setShowMonthPicker(true);
                    }}
                    style={styles.pickerTrigger}
                >
                    <View style={styles.pickerIcon}>
                        <MaterialCommunityIcons name="calendar-range" size={24} color={colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.pickerLabel}>Periode Rekap</Text>
                        <Text style={styles.pickerValue}>{months[month - 1]} {year}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.exportBtn, { backgroundColor: colors.error }]}
                    onPress={() => setPunishmentModal({ ...punishmentModal, visible: true })}
                >
                    <MaterialCommunityIcons name="alert-decagram-outline" size={22} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.exportBtn} onPress={() => console.log('Export')}>
                    <MaterialCommunityIcons name="file-download-outline" size={22} color="white" />
                </TouchableOpacity>
            </Surface>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAttendance} colors={[colors.primary]} />}
            >
                {/* User Profile Header */}
                <Surface style={styles.profileHeaderCard} elevation={1}>
                    <View style={styles.profileHeaderLeft}>
                        <View style={[styles.profileAvatar, { backgroundColor: `${colors.primary}15` }]}>
                            <Text style={styles.profileAvatarText}>{userName?.substring(0, 2).toUpperCase()}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{userName}</Text>
                            <View style={styles.profileBadgeRow}>
                                <View style={styles.roleBadge}>
                                    <Text style={styles.roleBadgeText}>{userProfile?.role || 'Karyawan'}</Text>
                                </View>
                                {pointsData !== null && (
                                    <View style={[styles.pointsBadge, { backgroundColor: pointsData.totalPoints < 0 ? '#FEE2E2' : '#DCFCE7' }]}>
                                        <Text style={[styles.pointsBadgeText, { color: pointsData.totalPoints < 0 ? colors.error : colors.success }]}>
                                            {pointsData.totalPoints} Poin
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    {userProfile?.Position && (
                        <View style={styles.positionBadge}>
                            <Text style={styles.positionText}>{userProfile.Position.name}</Text>
                        </View>
                    )}
                </Surface>

                {/* Monthly Summary Chart for Owner */}
                {!loading && items.length > 0 && (
                    <Surface style={styles.summaryChartCard} elevation={2}>
                        <View style={styles.chartTitleContainer}>
                            <Text style={styles.chartTitleText}>Ringkasan {months[month - 1]}</Text>
                        </View>
                        <View style={styles.chartWrapper}>
                            <PieChart
                                data={[
                                    {
                                        value: items.filter((i: any) => i.checkIn && !i.isLate && !i.isAlpha).length,
                                        color: colors.success,
                                        gradientCenterColor: colors.success
                                    },
                                    {
                                        value: items.filter((i: any) => i.isLate).length,
                                        color: colors.warning,
                                        gradientCenterColor: colors.warning
                                    },
                                    {
                                        value: items.filter((i: any) => i.isAlpha).length,
                                        color: colors.error,
                                        gradientCenterColor: colors.error
                                    },
                                    {
                                        value: items.filter((i: any) => i.isPermit || i.isSick).length,
                                        color: colors.textMuted,
                                        gradientCenterColor: '#94A3B8'
                                    },
                                ]}
                                donut
                                radius={60}
                                innerRadius={45}
                                innerCircleColor={'#FFFFFF'}
                                centerLabelComponent={() => {
                                    const total = items.length;
                                    return (
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary }}>{total}</Text>
                                            <Text style={{ fontSize: 8, color: colors.textSecondary }}>HARI</Text>
                                        </View>
                                    );
                                }}
                            />
                            <View style={styles.chartLegend}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                                    <Text style={styles.legendText}>Tepat Waktu: {items.filter((i: any) => i.checkIn && !i.isLate && !i.isAlpha).length}</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                                    <Text style={styles.legendText}>Terlambat: {items.filter((i: any) => i.isLate).length}</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                                    <Text style={styles.legendText}>Alpha: {items.filter((i: any) => i.isAlpha).length}</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
                                    <Text style={styles.legendText}>Izin/Sakit: {items.filter((i: any) => i.isPermit || i.isSick).length}</Text>
                                </View>
                            </View>
                        </View>
                    </Surface>
                )}

                {loading && items.length === 0 ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="calendar-blank-outline" size={80} color={`${colors.primary}20`} />
                        <Text style={styles.emptyTitle}>Data Tidak Ditemukan</Text>
                        <Text style={styles.emptySubtitle}>Tidak ada absensi untuk periode {months[month - 1]} {year}</Text>
                    </View>
                ) : (
                    <>
                        {items.slice(0, visibleCount).map((item: any, index) => {
                            // Deteksi anomali: Ada check-out tapi tidak ada check-in
                            const hasCheckOutOnly = !item.checkIn && item.checkOut;

                            // Cek apakah check-out adalah Alpha marker (jam 23:55)
                            let isAlphaCheckout = false;
                            if (hasCheckOutOnly && item.checkOut) {
                                const checkOutTime = new Date(item.checkOut);
                                const hours = checkOutTime.getHours();
                                const minutes = checkOutTime.getMinutes();
                                isAlphaCheckout = (hours === 23 && minutes === 55);
                            }

                            return (
                                <Surface key={index} style={styles.itemCard} elevation={1}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.dateBadge}>
                                            <Text style={styles.dateDayText}>{new Date(item.date).getDate()}</Text>
                                            <Text style={styles.dateMonthText}>{months[new Date(item.date).getMonth()].substring(0, 3)}</Text>
                                        </View>
                                        <View style={styles.cardInfo}>
                                            <Text style={styles.dayText}>
                                                {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long' })}
                                            </Text>
                                            <Text style={styles.fullDateText}>
                                                {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                                            {item.isLate && <View style={styles.lateStatus}><Text style={styles.lateStatusText}>TERLAMBAT</Text></View>}
                                            {hasCheckOutOnly && !item.isAlpha && !item.isPermit && !item.isSick && (
                                                <View style={[styles.anomalyBadge, { marginTop: item.isLate ? 4 : 0 }]}>
                                                    <Text style={styles.anomalyBadgeText}>🚫 DATA TIDAK VALID</Text>
                                                </View>
                                            )}
                                            {item.isAlpha && (
                                                <View style={[styles.alphaBadgeOwner, { marginTop: item.isLate ? 4 : 0 }]}>
                                                    <Text style={styles.alphaBadgeOwnerText}>🔴 ALPHA</Text>
                                                </View>
                                            )}
                                            {item.isPermit && (
                                                <View style={[styles.permitBadge, { marginTop: item.isLate ? 4 : 0 }]}>
                                                    <Text style={styles.permitText}>🟡 IZIN</Text>
                                                </View>
                                            )}
                                            {item.isSick && (
                                                <View style={[styles.sickBadge, { marginTop: item.isLate ? 4 : 0 }]}>
                                                    <Text style={styles.sickText}>🟢 SAKIT</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Alerts */}
                                    {item.isAlpha && (
                                        <View style={[styles.anomalyAlert, { backgroundColor: '#FEE2E2' }]}>
                                            <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                                            <Text style={styles.anomalyAlertText}>
                                                Tidak absen. Sistem menandai sebagai Alpha. {item.alphaNotes ? `Catatan: ${item.alphaNotes}` : ''}
                                            </Text>
                                        </View>
                                    )}

                                    {(item.isPermit || item.isSick) && (
                                        <View style={[styles.anomalyAlert, { backgroundColor: item.isSick ? '#DCFCE7' : '#FEF3C7' }]}>
                                            <MaterialCommunityIcons name="file-document-outline" size={14} color={item.isSick ? colors.success : colors.warning} />
                                            <Text style={[styles.anomalyAlertText, { color: item.isSick ? colors.success : colors.warning }]}>
                                                {item.isSick ? 'Sakit' : 'Izin'} {item.isSick ? item.sickNotes : item.permitNotes}
                                            </Text>
                                        </View>
                                    )}

                                    {hasCheckOutOnly && !item.isAlpha && !item.isPermit && !item.isSick && (
                                        <View style={styles.anomalyAlert}>
                                            <MaterialCommunityIcons name="alert-octagon" size={14} color={colors.error} />
                                            <Text style={styles.anomalyAlertText}>
                                                Data tidak valid: Tercatat absen pulang tanpa absen masuk.
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.cardDivider} />

                                    <View style={styles.timeRow}>
                                        <View style={[styles.timeSlot, { borderRightWidth: 1, borderRightColor: colors.divider }]}>
                                            <MaterialCommunityIcons name="clock-in" size={18} color={hasCheckOutOnly && !item.isAlpha ? colors.textMuted : colors.success} />
                                            <View style={{ marginLeft: 10 }}>
                                                <Text style={styles.slotLabel}>Masuk</Text>
                                                <Text style={[styles.slotValue, (hasCheckOutOnly || item.isAlpha) && styles.missingValue]}>
                                                    {item.checkInFormatted || (item.checkIn ? new Date(item.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                                                </Text>
                                                {item.isAlpha && <Text style={styles.missingLabel}>Absen</Text>}
                                            </View>
                                        </View>
                                        <View style={styles.timeSlot}>
                                            <MaterialCommunityIcons name="clock-out" size={18} color={colors.error} />
                                            <View style={{ marginLeft: 10 }}>
                                                <Text style={styles.slotLabel}>Pulang</Text>
                                                <Text style={styles.slotValue}>
                                                    {item.checkOutFormatted || (item.checkOut ? new Date(item.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Photo Buttons */}
                                    <View style={styles.photoButtonsRow}>
                                        <TouchableOpacity
                                            style={[styles.photoButton, { flex: 1, marginRight: 4 }]}
                                            onPress={() => setPhotoModal({
                                                visible: true,
                                                photoUrl: item.checkInPhoto,
                                                data: {
                                                    type: 'CHECK-IN',
                                                    time: item.checkIn,
                                                    location: item.checkInLocation,
                                                    notes: item.checkInNotes
                                                }
                                            })}
                                        >
                                            <MaterialCommunityIcons
                                                name={item.checkInPhoto ? "camera" : "camera-off"}
                                                size={16}
                                                color={item.checkInPhoto ? colors.primary : colors.textMuted}
                                            />
                                            <Text style={[styles.photoButtonText, !item.checkInPhoto && { color: colors.textMuted }]}>
                                                {item.checkIn ? 'Foto Masuk' : 'Tidak Masuk'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.photoButton, { flex: 1, marginLeft: 4 }]}
                                            onPress={() => setPhotoModal({
                                                visible: true,
                                                photoUrl: item.checkOutPhoto,
                                                data: {
                                                    type: 'CHECK-OUT',
                                                    time: item.checkOut,
                                                    location: item.checkOutLocation,
                                                    notes: item.checkOutNotes
                                                }
                                            })}
                                        >
                                            <MaterialCommunityIcons
                                                name={item.checkOutPhoto ? "camera" : "camera-off"}
                                                size={16}
                                                color={item.checkOutPhoto ? colors.error : colors.textMuted}
                                            />
                                            <Text style={[styles.photoButtonText, !item.checkOutPhoto && { color: colors.textMuted }]}>
                                                {item.checkOut ? 'Foto Pulang' : 'Tidak Pulang'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </Surface>
                            );
                        })}

                        {visibleCount < items.length && (
                            <TouchableOpacity
                                style={styles.loadMoreBtn}
                                onPress={() => setVisibleCount(items.length)}
                            >
                                <MaterialCommunityIcons name="chevron-double-down" size={24} color={colors.primary} />
                                <Text style={styles.loadMoreText}>Tampilkan {items.length - visibleCount} Data Lainnya (Satu Bulan)</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Modern Selection Modal */}
            <Portal>
                <Dialog visible={showMonthPicker} onDismiss={() => setShowMonthPicker(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Pilih Periode</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogLabel}>Tahun</Text>
                        <View style={styles.yearGrid}>
                            {years.map(y => (
                                <TouchableOpacity
                                    key={y}
                                    style={[styles.yearItem, tempYear === y && styles.yearItemActive]}
                                    onPress={() => setTempYear(y)}
                                >
                                    <Text style={[styles.yearText, tempYear === y && styles.yearTextActive]}>{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.dialogLabel, { marginTop: 20 }]}>Bulan</Text>
                        <View style={styles.monthGrid}>
                            {months.map((m, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.monthItem, tempMonth === i + 1 && styles.monthItemActive]}
                                    onPress={() => setTempMonth(i + 1)}
                                >
                                    <Text style={[styles.monthText, tempMonth === i + 1 && styles.monthTextActive]}>{m.substring(0, 3)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button onPress={() => setShowMonthPicker(false)} textColor={colors.textMuted}>Batal</Button>
                        <Button
                            mode="contained"
                            onPress={() => {
                                setMonth(tempMonth);
                                setYear(tempYear);
                                setShowMonthPicker(false);
                            }}
                            style={styles.applyBtn}
                        >
                            Terapkan
                        </Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Photo Modal */}
                <Modal
                    visible={photoModal.visible}
                    onDismiss={() => setPhotoModal({ visible: false, photoUrl: null, data: null })}
                    contentContainerStyle={styles.photoModalContainer}
                >
                    <View style={styles.photoModalContent}>
                        <View style={styles.photoModalHeader}>
                            <MaterialCommunityIcons name="face-recognition" size={24} color={colors.primary} />
                            <Text style={styles.photoModalTitle}>Verifikasi Wajah</Text>
                        </View>

                        <View style={styles.auditContainer}>
                            {/* Profile Photo (Reference) */}
                            <View style={styles.auditItem}>
                                <Text style={styles.auditLabel}>Foto Profil Terdaftar</Text>
                                {userProfile?.profile_picture ? (
                                    <Image source={{ uri: userProfile.profile_picture }} style={styles.auditImage} />
                                ) : (
                                    <View style={[styles.auditImage, styles.noProfile]}>
                                        <MaterialCommunityIcons name="account-question" size={40} color={colors.textMuted} />
                                        <Text style={{ fontSize: 10, color: colors.textMuted }}>Belum Set Foto</Text>
                                    </View>
                                )}
                            </View>

                            <MaterialCommunityIcons name="compare-horizontal" size={24} color={colors.divider} style={{ marginTop: 30 }} />

                            {/* Attendance Photo (Target) */}
                            <View style={styles.auditItem}>
                                <Text style={styles.auditLabel}>Foto Saat Absen</Text>
                                <Image source={{ uri: photoModal.photoUrl || '' }} style={styles.auditImage} />
                            </View>
                        </View>

                        <View style={styles.photoDetails}>
                            <View style={[styles.photoTypeBadge, { backgroundColor: photoModal.data?.type === 'CHECK-IN' ? '#DCFCE7' : '#FEF2F2' }]}>
                                <MaterialCommunityIcons
                                    name={photoModal.data?.type === 'CHECK-IN' ? 'login' : 'logout'}
                                    size={16}
                                    color={photoModal.data?.type === 'CHECK-IN' ? colors.success : colors.error}
                                />
                                <Text style={[styles.photoTypeText, { color: photoModal.data?.type === 'CHECK-IN' ? colors.success : colors.error }]}>
                                    {photoModal.data?.type}
                                </Text>
                            </View>

                            <View style={styles.photoDetailRow}>
                                <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textSecondary} />
                                <Text style={styles.photoDetailLabel}>Waktu:</Text>
                                <Text style={styles.photoDetailValue}>
                                    {photoModal.data?.time ? new Date(photoModal.data.time).toLocaleString('id-ID') : '-'}
                                </Text>
                            </View>

                            {photoModal.data?.location && (
                                <View style={styles.photoDetailRow}>
                                    <MaterialCommunityIcons name="map-marker" size={18} color={colors.textSecondary} />
                                    <Text style={styles.photoDetailLabel}>Lokasi:</Text>
                                    <Text style={styles.photoDetailValue}>
                                        {photoModal.data.location.lat?.toFixed(6)}, {photoModal.data.location.lng?.toFixed(6)}
                                    </Text>
                                </View>
                            )}

                            {photoModal.data?.notes && (
                                <View style={[styles.photoDetailRow, { alignItems: 'flex-start' }]}>
                                    <MaterialCommunityIcons name="note-text" size={18} color={colors.textSecondary} />
                                    <Text style={styles.photoDetailLabel}>Catatan:</Text>
                                    <Text style={[styles.photoDetailValue, { flex: 1 }]}>
                                        {photoModal.data.notes}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Button
                            mode="contained"
                            onPress={() => setPhotoModal({ visible: false, photoUrl: null, data: null })}
                            style={styles.photoCloseButton}
                            labelStyle={{ fontWeight: 'bold' }}
                        >
                            Tutup
                        </Button>
                    </View>
                </Modal>

                {/* Punishment Modal */}
                <Dialog visible={punishmentModal.visible} onDismiss={() => setPunishmentModal({ ...punishmentModal, visible: false })} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Beri Sanksi / Poin</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ marginBottom: 15, color: colors.textSecondary }}>Berikan sanksi poin kepada {userName} (ID: {userId})</Text>
                        <TextInput
                            label="Jumlah Poin (Negatif)"
                            placeholder="Contoh: -10"
                            value={punishmentModal.points}
                            onChangeText={(t) => setPunishmentModal({ ...punishmentModal, points: t })}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.dialogInput}
                        />
                        <TextInput
                            label="Alasan Sanksi"
                            placeholder="Contoh: Foto tidak sesuai / Titip absen"
                            value={punishmentModal.reason}
                            onChangeText={(t) => setPunishmentModal({ ...punishmentModal, reason: t })}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.dialogInput}
                        />
                    </Dialog.Content>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button onPress={() => setPunishmentModal({ ...punishmentModal, visible: false })} textColor={colors.textMuted}>Batal</Button>
                        <Button
                            mode="contained"
                            disabled={punishmentLoading}
                            loading={punishmentLoading}
                            onPress={async () => {
                                if (!punishmentModal.points || !punishmentModal.reason) return;
                                setPunishmentLoading(true);
                                try {
                                    const token = await SecureStore.getItemAsync('authToken');
                                    await axios.post(`${API_CONFIG.BASE_URL}/admin/punishment`, {
                                        userId: userId,
                                        points: parseInt(punishmentModal.points),
                                        reason: punishmentModal.reason
                                    }, { headers: { Authorization: `Bearer ${token}` } });
                                    setPunishmentModal({ visible: false, points: '', reason: '' });
                                    alert('Sanksi berhasil diberikan');
                                } catch (e) {
                                    console.error(e);
                                    alert('Gagal memberikan sanksi');
                                } finally {
                                    setPunishmentLoading(false);
                                }
                            }}
                            buttonColor={colors.error}
                            style={styles.applyBtn}
                        >
                            Kirim Sanksi
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerSurface: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + spacing.sm : 20,
        backgroundColor: 'white',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginHorizontal: 2,
    },
    pickerTrigger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerIcon: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: `${colors.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pickerLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    pickerValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    exportBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        ...shadows.sm,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: spacing.md,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateBadge: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: `${colors.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    dateDayText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        lineHeight: 22,
    },
    dateMonthText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
        textTransform: 'uppercase',
    },
    cardInfo: {
        flex: 1,
    },
    dayText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        textTransform: 'capitalize',
    },
    fullDateText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    lateStatus: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    lateStatusText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.error,
    },
    cardDivider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 12,
    },
    timeRow: {
        flexDirection: 'row',
    },
    timeSlot: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 5,
    },
    slotLabel: {
        fontSize: 10,
        color: colors.textMuted,
        fontWeight: '600',
    },
    slotValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    dialog: {
        borderRadius: 25,
        backgroundColor: 'white',
    },
    dialogTitle: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
    },
    dialogInput: {
        backgroundColor: 'white',
        marginBottom: 12,
    },
    profileHeaderCard: {
        backgroundColor: 'white',
        margin: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.sm,
    },
    profileHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    profileAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    profileInfo: {
        gap: 2,
    },
    profileName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    profileBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    roleBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    pointsBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    pointsBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    positionBadge: {
        backgroundColor: `${colors.primary}10`,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    positionText: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: '700',
    },
    dialogLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: 10,
        marginLeft: 5,
    },
    yearGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    yearItem: {
        width: '31%',
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.divider,
        alignItems: 'center',
        marginBottom: 10,
    },
    yearItemActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    yearText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    yearTextActive: {
        color: 'white',
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    monthItem: {
        width: '23%',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.divider,
        alignItems: 'center',
        marginBottom: 10,
    },
    monthItemActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    monthText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    monthTextActive: {
        color: 'white',
    },
    dialogActions: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    applyBtn: {
        borderRadius: 12,
        paddingHorizontal: 20,
    },
    anomalyBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    anomalyBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.warning,
    },
    anomalyAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        padding: 8,
        borderRadius: 8,
        marginBottom: 10,
        marginTop: -4,
    },
    anomalyAlertText: {
        fontSize: 11,
        color: colors.error,
        marginLeft: 6,
        flex: 1,
        fontWeight: '600',
    },
    missingValue: {
        color: colors.textMuted,
        fontStyle: 'italic',
        textDecorationLine: 'line-through',
    },
    missingLabel: {
        fontSize: 9,
        color: colors.error,
        marginTop: 2,
        fontStyle: 'italic',
    },
    alphaBadgeOwner: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    alphaBadgeOwnerText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.error,
    },
    permitBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    permitText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.warning,
    },
    sickBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    sickText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.success,
    },
    // Photo Button Styles
    photoButtonsRow: {
        flexDirection: 'row',
        marginTop: 12,
        justifyContent: 'space-between',
    },
    photoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.divider,
    },
    photoButtonText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    noPhotoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    noPhotoText: {
        fontStyle: 'italic',
    },
    // Photo Modal Styles
    photoModalContainer: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 24,
        padding: 0,
        overflow: 'hidden',
    },
    photoModalContent: {
        padding: 20,
    },
    photoModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 10,
    },
    photoModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    photoTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginBottom: 12,
        alignSelf: 'center',
    },
    photoTypeText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    auditContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    auditItem: {
        flex: 1,
        alignItems: 'center',
    },
    auditLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    auditImage: {
        width: 120,
        height: 150,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    noProfile: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.divider,
        borderStyle: 'dashed',
    },
    photoDetails: {
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 16,
        marginBottom: 20,
    },
    photoDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    photoDetailLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginLeft: 8,
        width: 80,
    },
    photoDetailValue: {
        fontSize: 13,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    photoCloseButton: {
        borderRadius: 12,
        backgroundColor: colors.primary,
        height: 48,
        justifyContent: 'center',
    },
    // Monthly Summary Chart Styles
    summaryChartCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    chartTitleContainer: {
        marginBottom: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        paddingLeft: 10,
    },
    chartTitleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    chartWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    chartLegend: {
        flex: 1,
        marginLeft: 20,
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    loadMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
    },
    loadMoreText: {
        marginLeft: 8,
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
