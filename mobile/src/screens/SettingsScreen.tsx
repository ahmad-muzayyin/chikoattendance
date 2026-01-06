import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Animated, StatusBar, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { TextInput, Button, Surface, Avatar, useTheme, IconButton, Text, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { useAuth } from '../hooks/useAuth';

export default function SettingsScreen() {
    const { user, checkAuth } = useAuth();
    const navigation = useNavigation();

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Owner specific settings
    const [maxPunishment, setMaxPunishment] = useState('');
    const [loadingSettings, setLoadingSettings] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (user?.name && !name) {
            setName(user.name);
        }

        if (user?.role === 'OWNER') {
            fetchSettings();
        }

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, [user?.name]);

    const fetchSettings = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const res = await axios.get(`${API_CONFIG.BASE_URL}${ENDPOINTS.SETTINGS}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.max_punishment_points) {
                setMaxPunishment(res.data.max_punishment_points.toString());
            }
        } catch (error) {
            console.log('Error fetching settings', error);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0].base64) {
            handleUpdatePhoto(result.assets[0].base64);
        }
    };

    const handleUpdatePhoto = async (base64Image: string) => {
        setUploading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const imageUri = `data:image/jpeg;base64,${base64Image}`;

            await axios.put(
                `${API_CONFIG.BASE_URL}/auth/profile`,
                { profile_picture: imageUri },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await checkAuth();
            Alert.alert('✅ Berhasil', 'Foto profil telah diperbarui');
        } catch (error) {
            Alert.alert('❌ Gagal', 'Tidak dapat memperbarui foto profil');
        } finally {
            setUploading(false);
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

            Alert.alert('✅ Berhasil', 'Pengaturan sistem disimpan');
        } catch (error) {
            Alert.alert('❌ Gagal', 'Terjadi kesalahan saat menyimpan pengaturan');
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (password && password !== confirmPassword) {
            Alert.alert('⚠️ Perhatian', 'Konfirmasi password tidak sesuai');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const payload: any = { name };
            if (password) payload.password = password;

            await axios.put(`${API_CONFIG.BASE_URL}/auth/profile`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await SecureStore.setItemAsync('userName', name);
            await checkAuth();

            Alert.alert('✅ Berhasil', 'Profil anda telah diperbarui');
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            Alert.alert('❌ Gagal', error?.response?.data?.message || 'Update profil gagal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

                {/* Compact Header */}
                <View style={styles.header}>
                    <View style={styles.watermarkContainer}>
                        <Image
                            source={require('../../assets/hc.png')}
                            style={styles.watermarkLogo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.headerContent}>

                        <View style={styles.avatarRow}>
                            <TouchableOpacity
                                onPress={pickImage}
                                disabled={uploading}
                                activeOpacity={0.8}
                                style={styles.avatarWrapper}
                            >
                                {user?.profile_picture ? (
                                    <Avatar.Image
                                        size={50}
                                        source={{ uri: user.profile_picture }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <Avatar.Text
                                        size={50}
                                        label={(name || user?.name || '?').substring(0, 2).toUpperCase()}
                                        style={styles.avatarPlaceholder}
                                        labelStyle={styles.avatarLabel}
                                        color={colors.primary}
                                    />
                                )}

                                {uploading && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator color="#FFF" size="small" />
                                    </View>
                                )}

                                <View style={styles.cameraIcon}>
                                    <MaterialCommunityIcons name="camera" size={14} color="#FFF" />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.userInfo}>
                                <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
                                <View style={styles.roleBadge}>
                                    <Text style={styles.roleText}>{user?.role}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <Animated.ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    style={{ opacity: fadeAnim }}
                >
                    <Surface style={styles.formCard} elevation={2}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="account-details" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Data Pribadi</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nama Lengkap</Text>
                            <TextInput
                                mode="outlined"
                                dense
                                value={name}
                                onChangeText={setName}
                                placeholder="Nama Lengkap"
                                style={styles.input}
                                outlineColor={colors.border}
                                activeOutlineColor={colors.primary}
                                theme={{ roundness: 10 }}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                mode="outlined"
                                dense
                                value={user?.email || ''}
                                disabled
                                style={[styles.input, styles.disabledInput]}
                                outlineColor={colors.border}
                                theme={{ roundness: 10 }}
                            />
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="shield-lock" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Keamanan</Text>
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.inputLabel}>Password Baru</Text>
                                <TextInput
                                    mode="outlined"
                                    dense
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                    placeholder="********"
                                    outlineColor={colors.border}
                                    activeOutlineColor={colors.primary}
                                    theme={{ roundness: 10 }}
                                    right={<TextInput.Icon icon="eye" size={20} onPress={() => setShowPassword(!showPassword)} />}
                                />
                            </View>
                            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.inputLabel}>Konfirmasi</Text>
                                <TextInput
                                    mode="outlined"
                                    dense
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    style={styles.input}
                                    placeholder="********"
                                    outlineColor={colors.border}
                                    activeOutlineColor={colors.primary}
                                    theme={{ roundness: 10 }}
                                    right={<TextInput.Icon icon="eye" size={20} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
                                />
                            </View>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleUpdateProfile}
                            loading={loading}
                            style={styles.saveButton}
                            labelStyle={styles.saveButtonLabel}
                        >
                            Simpan Perubahan
                        </Button>
                    </Surface>

                    {/* Owner Settings Card */}
                    {user?.role === 'OWNER' && (
                        <Surface style={[styles.formCard, { marginTop: spacing.md }]} elevation={2}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="cogs" size={20} color={colors.primary} />
                                <Text style={styles.sectionTitle}>Pengaturan Sistem</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Max Poin Pelanggaran</Text>
                                <TextInput
                                    mode="outlined"
                                    dense
                                    value={maxPunishment}
                                    onChangeText={setMaxPunishment}
                                    keyboardType="numeric"
                                    style={styles.input}
                                    outlineColor={colors.border}
                                    activeOutlineColor={colors.primary}
                                    theme={{ roundness: 10 }}
                                />
                                <Text style={styles.helperText}>Batas poin sebelum sanksi diterapkan (Reset per bulan).</Text>
                            </View>

                            <Button
                                mode="outlined"
                                onPress={handleSaveSettings}
                                loading={loadingSettings}
                                style={styles.outlineButton}
                                labelStyle={{ color: colors.primary, fontSize: 13 }}
                                compact
                            >
                                Simpan Config
                            </Button>
                        </Surface>
                    )}

                    <View style={{ height: 40 }} />
                </Animated.ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: colors.primary,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 30,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        position: 'relative',
        ...shadows.md,
    },
    watermarkContainer: {
        position: 'absolute',
        right: -30,
        top: -10,
        opacity: 0.15,
    },
    watermarkLogo: {
        width: 200,
        height: 200,
        transform: [{ rotate: '-15deg' }],
    },
    headerContent: {
        paddingHorizontal: spacing.lg,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 10,
        textAlign: 'center',
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xs,
    },
    avatarWrapper: {
        position: 'relative',
        padding: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 50,
        marginRight: spacing.md,
    },
    avatar: {
        backgroundColor: '#FFF',
    },
    avatarPlaceholder: {
        backgroundColor: '#FFF',
    },
    avatarLabel: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#1F2937',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
    },
    content: {
        padding: spacing.md,
        marginTop: -20, // Overlap
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: spacing.md,
        ...shadows.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
        marginLeft: 8,
    },
    inputContainer: {
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
        marginLeft: 2,
    },
    input: {
        backgroundColor: '#FFFFFF',
        fontSize: 14,
        height: 40,
    },
    disabledInput: {
        backgroundColor: '#F9FAFB',
        color: colors.textMuted,
    },
    divider: {
        marginVertical: 16,
        backgroundColor: colors.divider,
    },
    helperText: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
        fontStyle: 'italic',
    },
    saveButton: {
        marginTop: 8,
        borderRadius: 10,
        backgroundColor: colors.primary,
    },
    saveButtonLabel: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    outlineButton: {
        marginTop: 8,
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 10,
    }
});
