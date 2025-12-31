// Profile Screen - With Theme Selection (Reorganized & Realtime)
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Image,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { spacing, borderRadius, shadows, typography, themes } from '../styles/theme';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useThemeStore, useColors } from '../store/themeStore';
import { userAPI, API_BASE_URL } from '../api/client';
import { useUserUpdates } from '../hooks/useWebSocket'; // Import WebSocket hook

interface ProfileScreenProps {
    navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
    const colors = useColors();
    const { currentTheme, setTheme } = useThemeStore();

    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser); // Needed to update user store
    const logout = useAuthStore((state) => state.logout);
    const resetAttendance = useAttendanceStore((state) => state.reset);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // WebSocket: Listen for user updates (e.g., office transfer)
    useUserUpdates(async () => {
        try {
            console.log('[Profile] User update received via WebSocket');
            const res = await userAPI.getProfile();
            if (res.data) {
                // Ensure office data is correctly structured
                const updatedUser = {
                    ...res.data,
                    photo: res.data.photo || res.data.avatar_url,
                    office_lat: res.data.office?.latitude || res.data.office_lat,
                    office_long: res.data.office?.longitude || res.data.office_long,
                    allowed_radius: res.data.office?.radius || res.data.allowed_radius,
                };
                setUser(updatedUser);
            }
        } catch (error) {
            console.log('[Profile] Failed to refresh profile:', error);
        }
    });

    // Fetch latest profile data on mount to get photo/avatar
    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await userAPI.getProfile();
                if (res.data) {
                    const updatedUser = {
                        ...res.data,
                        photo: res.data.photo || res.data.avatar_url,
                        office_lat: res.data.office?.latitude || res.data.office_lat,
                        office_long: res.data.office?.longitude || res.data.office_long,
                        allowed_radius: res.data.office?.radius || res.data.allowed_radius,
                    };
                    setUser(updatedUser);
                }
            } catch (error) {
                console.log('Failed to fetch profile on mount');
            }
        };
        fetchProfile();
    }, []);

    const getPhotoUrl = (path: string | undefined) => {
        if (!path) return undefined;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Yakin ingin keluar?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => { resetAttendance(); logout(); } },
        ]);
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Harap isi semua field'); return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password baru minimal 6 karakter'); return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Konfirmasi password tidak cocok'); return;
        }
        setIsChangingPassword(true);
        try {
            await userAPI.changePassword({ current_password: currentPassword, new_password: newPassword });
            Alert.alert('Sukses', 'Password berhasil diubah');
            closePasswordModal();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Gagal mengubah password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => (
        <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value || '-'}</Text>
        </View>
    );

    const ThemeOption = ({ themeKey, label, color }: { themeKey: string, label: string, color: string }) => (
        <TouchableOpacity
            style={[
                styles.themeOption,
                { borderColor: currentTheme.id === themeKey ? colors.accent : 'transparent', backgroundColor: colors.surface }
            ]}
            onPress={() => setTheme(themeKey)}
        >
            <View style={[styles.themeColor, { backgroundColor: color }]} />
            <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>{label}</Text>
            {currentTheme.id === themeKey && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
        </TouchableOpacity>
    );

    const styles = createStyles(colors);

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.sm, borderRadius: borderRadius.full, paddingHorizontal: spacing.md }}
                    onPress={handleLogout}
                >
                    <Text style={{ marginRight: spacing.xs, fontSize: 16 }}>🔴</Text>
                    <Text style={{ color: colors.error, fontWeight: '600' }}>Keluar</Text>
                </TouchableOpacity>
            </View>

            {/* Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.avatarContainer, { borderColor: colors.accent, overflow: 'hidden' }]}>
                    {user?.photo ? (
                        <Image
                            source={{ uri: getPhotoUrl(user.photo) }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={[styles.avatarText, { color: colors.accent }]}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name}</Text>
                <Text style={[styles.role, { color: colors.textSecondary }]}>{user?.role}</Text>

                {/* Office Badges */}
                <View style={styles.badgeContainer}>
                    <View style={[styles.badge, { backgroundColor: colors.accent + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.accent }]}>
                            {user?.office?.name || 'Kantor Pusat'}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: (user?.face_verification_status === 'verified' ? colors.success : colors.warning) + '20' }]}>
                        <Text style={[styles.badgeText, { color: (user?.face_verification_status === 'verified' ? colors.success : colors.warning) }]}>
                            {user?.face_verification_status === 'verified' ? 'Terverifikasi' : 'Belum Verifikasi'}
                        </Text>
                    </View>
                </View>

                {/* QR Code */}
                <View style={[styles.qrContainer, { backgroundColor: 'white' }]}>
                    <QRCode value={user?.id || 'unknown'} size={120} />
                </View>
                <Text style={[styles.qrLabel, { color: colors.textMuted }]}>ID: {user?.employee_id}</Text>
            </View>

            {/* Personal Info */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Informasi Pribadi</Text>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <InfoRow label="Email" value={user?.email} />
                    <View style={[styles.divider, { backgroundColor: colors.surfaceLight }]} />
                    <InfoRow label="NIK" value={user?.employee_id} />
                </View>
            </View>

            {/* Settings */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Pengaturan</Text>

                {/* Theme Selection */}
                <View style={[styles.card, { backgroundColor: colors.surface, padding: spacing.sm, marginBottom: spacing.md }]}>
                    <Text style={[styles.infoLabel, { color: colors.textMuted, marginLeft: spacing.sm, marginBottom: spacing.sm }]}>Tema Aplikasi</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}>
                        {themes.map((theme) => (
                            <TouchableOpacity
                                key={theme.id}
                                style={[
                                    styles.themeOption,
                                    { borderColor: currentTheme.id === theme.id ? colors.accent : 'transparent', backgroundColor: colors.surface }
                                ]}
                                onPress={() => setTheme(theme.id)}
                            >
                                <View style={[styles.themeColor, { backgroundColor: theme.colors.accent }]} />
                                <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>{theme.name}</Text>
                                {currentTheme.id === theme.id && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.surface, marginTop: spacing.sm }, user?.face_verification_status === 'verified' && { opacity: 0.7 }]}
                    onPress={() => navigation.navigate('FaceRegistration')}
                    disabled={user?.face_verification_status === 'verified'}
                >
                    <View>
                        <Text style={[styles.menuText, { color: colors.textPrimary }]}>Registrasi Wajah</Text>
                        {user?.face_verification_status === 'verified' && (
                            <Text style={{ fontSize: 11, color: colors.success, marginTop: 2 }}>Terverifikasi ✓</Text>
                        )}
                    </View>
                    {user?.face_verification_status !== 'verified' && (
                        <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.surface, marginTop: spacing.md }]}
                    onPress={() => setShowPasswordModal(true)}
                >
                    <Text style={[styles.menuText, { color: colors.textPrimary }]}>Ubah Password</Text>
                    <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Password Modal */}
            <Modal
                visible={showPasswordModal}
                transparent={true}
                animationType="slide"
                onRequestClose={closePasswordModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Ubah Password</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Password Saat Ini</Text>
                            <View style={[styles.passwordContainer, { borderColor: colors.surfaceLight }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry={!showCurrentPassword}
                                    placeholderTextColor={colors.textMuted}
                                />
                                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeIcon}>
                                    <Text style={{ color: colors.textMuted }}>{showCurrentPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Password Baru</Text>
                            <View style={[styles.passwordContainer, { borderColor: colors.surfaceLight }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showNewPassword}
                                    placeholderTextColor={colors.textMuted}
                                />
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                                    <Text style={{ color: colors.textMuted }}>{showNewPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Konfirmasi Password Baru</Text>
                            <View style={[styles.passwordContainer, { borderColor: colors.surfaceLight }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showNewPassword}
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.surfaceLight }]} onPress={closePasswordModal}>
                                <Text style={{ color: colors.textSecondary }}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                                onPress={handleChangePassword}
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Simpan</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    profileCard: { borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg, ...shadows.md },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
    avatarText: { fontSize: 32, fontWeight: 'bold' },
    name: { ...typography.h2, marginBottom: 2 },
    role: { ...typography.caption, textTransform: 'capitalize', marginBottom: spacing.md },
    badgeContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    badge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.full },
    badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    qrContainer: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
    qrLabel: { ...typography.caption, fontFamily: 'monospace' },
    section: { marginBottom: spacing.lg },
    sectionTitle: { ...typography.caption, marginBottom: spacing.sm, marginLeft: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
    card: { borderRadius: borderRadius.lg, padding: spacing.md },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
    infoLabel: { fontSize: 14 },
    infoValue: { fontSize: 14, fontWeight: '500' },
    divider: { height: 1, marginVertical: spacing.xs },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.xs },
    menuText: { fontSize: 15, fontWeight: '500' },
    menuArrow: { fontSize: 20 },
    logoutButton: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
    logoutText: { fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
    modalContent: { borderRadius: borderRadius.xl, padding: spacing.xl },
    modalTitle: { ...typography.h3, marginBottom: spacing.lg, textAlign: 'center' },
    inputGroup: { marginBottom: spacing.md },
    label: { ...typography.caption, marginBottom: spacing.xs },
    input: { borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 16, flex: 1 },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md },
    eyeIcon: { padding: spacing.sm },
    modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    modalButton: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
    themeOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, paddingRight: spacing.md, borderRadius: borderRadius.full, marginRight: spacing.sm, borderWidth: 1 },
    themeColor: { width: 16, height: 16, borderRadius: 8, marginRight: spacing.sm },
    themeLabel: { fontSize: 12, fontWeight: '600', marginRight: spacing.xs },
    activeDot: { width: 6, height: 6, borderRadius: 3, marginLeft: spacing.xs },
});
