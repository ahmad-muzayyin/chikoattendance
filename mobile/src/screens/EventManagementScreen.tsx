import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, FAB, Dialog, Portal, TextInput, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { colors } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';

export default function EventManagementScreen() {
    const theme = useTheme();
    const navigation = useNavigation();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Dialog State
    const [visible, setVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [eventDescription, setEventDescription] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            // Assuming endpoint exists or mocking it if backend not ready
            const { data } = await axios.get(`${API_CONFIG.BASE_URL}/events`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(data);
        } catch (error) {
            console.log('Error fetching events', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!eventName) {
            Alert.alert('Error', 'Nama event wajib diisi');
            return;
        }

        try {
            const token = await SecureStore.getItemAsync('authToken');

            if (isEditMode && editId) {
                // Update Logic
                await axios.put(`${API_CONFIG.BASE_URL}/events/${editId}`, {
                    name: eventName,
                    date: eventDate.toISOString().split('T')[0],
                    description: eventDescription,
                    isSpecialEvent: true
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Alert.alert('Sukses', 'Event berhasil diperbarui');
            } else {
                // Create Logic
                await axios.post(`${API_CONFIG.BASE_URL}/events`, {
                    name: eventName,
                    date: eventDate.toISOString().split('T')[0],
                    description: eventDescription,
                    isSpecialEvent: true // Flag to bypass schedule
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Alert.alert('Sukses', 'Event berhasil dibuat');
            }
            setVisible(false);
            setEventName('');
            setEventDescription('');
            setIsEditMode(false);
            setEditId(null);
            fetchEvents();
        } catch (error: any) {
            Alert.alert('Gagal', error.response?.data?.message || 'Gagal menyimpan event. Pastikan backend mendukung fitur ini.');
        }
    };

    const openEditModal = (item: any) => {
        setEditId(item.id);
        setEventName(item.name);
        setEventDate(new Date(item.date));
        setEventDescription(item.description || '');
        setIsEditMode(true);
        setVisible(true);
    };

    const resetModal = () => {
        setVisible(false);
        setEventName('');
        setEventDate(new Date());
        setEventDescription('');
        setIsEditMode(false);
        setEditId(null);
    };

    const handleDelete = async (id: number) => {
        Alert.alert('Hapus Event', 'Yakin ingin menghapus event ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const token = await SecureStore.getItemAsync('authToken');
                        await axios.delete(`${API_CONFIG.BASE_URL}/events/${id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchEvents();
                    } catch (error) {
                        Alert.alert('Error', 'Gagal menghapus event');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: any }) => (
        <Surface style={styles.card} elevation={2}>
            <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>{new Date(item.date).getDate()}</Text>
                <Text style={styles.dateMonth}>
                    {new Date(item.date).toLocaleDateString('id-ID', { month: 'short' })}
                </Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDesc}>{item.description || 'Tidak ada deskripsi'}</Text>
                <View style={styles.tagContainer}>
                    <MaterialCommunityIcons name="clock-alert-outline" size={12} color="#EAB308" />
                    <Text style={styles.tagText}>Bypass Jadwal Shift</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                    <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.iconBtn, { marginTop: 8 }]}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                </TouchableOpacity>
            </View>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Kelola Event</Text>
                    <Text style={styles.headerSubtitle}>Atur jadwal khusus toko</Text>
                </View>
            </View>

            <FlatList
                data={events}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>Belum ada event khusus.</Text>
                        <Text style={styles.emptySub}>Buat event untuk mengizinkan absensi di luar jam shift normal (misal: Big Sale, Stock Opname).</Text>
                    </View>
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                label="Buat Event"
                onPress={() => setVisible(true)}
                color="white"
            />

            <Portal>
                <Dialog visible={visible} onDismiss={resetModal} style={{ backgroundColor: 'white', borderRadius: 16 }}>
                    <Dialog.Title>{isEditMode ? 'Edit Event' : 'Tambah Event Baru'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Nama Event"
                            value={eventName}
                            onChangeText={setEventName}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <TextInput
                                label="Tanggal"
                                value={eventDate.toLocaleDateString('id-ID')}
                                mode="outlined"
                                editable={false}
                                style={styles.input}
                                right={<TextInput.Icon icon="calendar" />}
                            />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={eventDate}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) setEventDate(date);
                                }}
                            />
                        )}

                        <TextInput
                            label="Keterangan (Opsional)"
                            value={eventDescription}
                            onChangeText={setEventDescription}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                        />

                        <View style={styles.infoBox}>
                            <MaterialCommunityIcons name="information" size={16} color="#3B82F6" />
                            <Text style={styles.infoText}>
                                Event ini akan mengizinkan karyawan check-in mulai jam 00:01 pada tanggal terpilih, mengabaikan aturan shift normal.
                            </Text>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={resetModal} textColor="#64748B">Batal</Button>
                        <Button onPress={handleCreateEvent} mode="contained" style={{ marginLeft: 8 }}>Simpan</Button>
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
    header: {
        backgroundColor: colors.primary,
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    listContent: {
        padding: 20,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateBadge: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        marginRight: 16,
    },
    dateDay: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    dateMonth: {
        fontSize: 10,
        color: '#64748B',
        textTransform: 'uppercase',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 8,
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF9C3',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 10,
        color: '#854D0E',
        marginLeft: 4,
        fontWeight: '600',
    },
    deleteBtn: {
        padding: 8,
    },
    iconBtn: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: colors.primary,
        borderRadius: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 13,
        color: '#CBD5E1',
        textAlign: 'center',
        lineHeight: 20,
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: 10,
        borderRadius: 8,
        marginTop: 8,
    },
    infoText: {
        fontSize: 11,
        color: '#1E40AF',
        marginLeft: 8,
        flex: 1,
        lineHeight: 16,
    },
});
