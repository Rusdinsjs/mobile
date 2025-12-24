// Profile Screen - With Theme Selection (Reorganized)
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
} from 'react-native';
import { spacing, borderRadius, shadows, typography, themes } from '../styles/theme';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useThemeStore, useColors } from '../store/themeStore';
import { userAPI } from '../api/client';

interface ProfileScreenProps {
    navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
    const colors = useColors();
    const { currentTheme, setTheme } = useThemeStore();

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const resetAttendance = useAttendanceStore((state) => state.reset);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

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
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    };

    const InfoRow = ({ label, value }: { label: string; value: string }) => (
        <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
        </View>
    );

    const styles = createStyles(colors);

    return (
        <>
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Avatar */}
                <View style={styles.header}>
                    <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: colors.accent + '20' }]}>
                        <Text style={[styles.roleText, { color: colors.accent }]}>{user?.role?.toUpperCase() || 'EMPLOYEE'}</Text>
                    </View>

                    {/* Face Verification Status Banner */}
                    {user?.face_verification_status === 'pending' && (
                        <View style={[styles.statusBanner, { backgroundColor: colors.warning + '20' }]}>
                            <Text style={{ color: colors.warning, fontSize: 12 }}>⏳ Menunggu verifikasi wajah dari admin</Text>
                        </View>
                    )}
                    {user?.face_verification_status === 'verified' && (
                        <View style={[styles.statusBanner, { backgroundColor: colors.success + '20' }]}>
                            <Text style={{ color: colors.success, fontSize: 12 }}>✓ Wajah terverifikasi</Text>
                        </View>
                    )}
                    {user?.face_verification_status === 'rejected' && (
                        <View style={[styles.statusBanner, { backgroundColor: colors.error + '20' }]}>
                            <Text style={{ color: colors.error, fontSize: 12 }}>✗ Verifikasi ditolak - silakan upload ulang</Text>
                        </View>
                    )}
                </View>

                {/* Account Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Akun</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <InfoRow label="ID Karyawan" value={user?.employee_id || '-'} />
                        <View style={[styles.divider, { backgroundColor: colors.surfaceLight }]} />
                        <InfoRow label="Email" value={user?.email || '-'} />
                    </View>
                </View>

                {/* Office Location */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Lokasi Kantor</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <InfoRow label="Koordinat" value={`${user?.office_lat?.toFixed(4)}, ${user?.office_long?.toFixed(4)}`} />
                        <View style={[styles.divider, { backgroundColor: colors.surfaceLight }]} />
                        <InfoRow label="Radius" value={`${user?.allowed_radius || 50} meter`} />
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Aplikasi</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <InfoRow label="Versi" value="1.0.0" />
                        <View style={[styles.divider, { backgroundColor: colors.surfaceLight }]} />
                        <InfoRow label="Build" value="2024.12.24" />
                    </View>
                </View>

                {/* Theme Selection - MOVED TO BOTTOM */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Tema</Text>
                    <View style={styles.themeGrid}>
                        {themes.map((theme) => (
                            <TouchableOpacity
                                key={theme.id}
                                style={[
                                    styles.themeItem,
                                    { backgroundColor: colors.surface },
                                    currentTheme.id === theme.id && { borderColor: colors.accent, borderWidth: 2 },
                                ]}
                                onPress={() => setTheme(theme.id)}
                            >
                                <View style={[styles.themeSwatch, { backgroundColor: theme.colors.background }]}>
                                    <View style={[styles.themeAccent, { backgroundColor: theme.colors.accent }]} />
                                </View>
                                <Text style={styles.themeIcon}>{theme.icon}</Text>
                                <Text style={[styles.themeName, { color: colors.textPrimary }]}>{theme.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Security Section - MOVED TO BOTTOM */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Keamanan</Text>
                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: colors.surface }]}
                        onPress={() => setShowPasswordModal(true)}
                    >
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuIcon}>🔐</Text>
                            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Ubah Password</Text>
                        </View>
                        <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: colors.surface, marginTop: spacing.sm }]}
                        onPress={() => navigation.navigate('FaceRegistration')}
                    >
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuIcon}>😊</Text>
                            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Daftar Wajah</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <View style={[styles.faceStatus, { backgroundColor: user?.face_embeddings && user.face_embeddings.length > 0 ? colors.success + '20' : colors.warning + '20' }]}>
                                <Text style={{ fontSize: 10, color: user?.face_embeddings && user.face_embeddings.length > 0 ? colors.success : colors.warning }}>
                                    {user?.face_embeddings && user.face_embeddings.length > 0 ? `${user.face_embeddings.length}/5` : 'Belum'}
                                </Text>
                            </View>
                            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: colors.surface, marginTop: spacing.sm }]}
                        onPress={() => navigation.navigate('TransferRequest')}
                    >
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuIcon}>📍</Text>
                            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Pindah Lokasi Kantor</Text>
                        </View>
                        <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutIcon}>🚪</Text>
                    <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
                </TouchableOpacity>

                <Text style={[styles.footer, { color: colors.textMuted }]}>@by roesch</Text>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal visible={showPasswordModal} animationType="slide" transparent onRequestClose={closePasswordModal}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Ubah Password</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Password Saat Ini</Text>
                            <View style={[styles.passwordContainer, { backgroundColor: colors.surfaceLight }]}>
                                <TextInput style={[styles.passwordInput, { color: colors.textPrimary }]} placeholder="Password lama" placeholderTextColor={colors.textMuted} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showCurrentPassword} />
                                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowCurrentPassword(!showCurrentPassword)}><Text>{showCurrentPassword ? '👁️' : '🔒'}</Text></TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Password Baru</Text>
                            <View style={[styles.passwordContainer, { backgroundColor: colors.surfaceLight }]}>
                                <TextInput style={[styles.passwordInput, { color: colors.textPrimary }]} placeholder="Password baru" placeholderTextColor={colors.textMuted} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPassword} />
                                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPassword(!showNewPassword)}><Text>{showNewPassword ? '👁️' : '🔒'}</Text></TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Konfirmasi Password</Text>
                            <View style={[styles.passwordContainer, { backgroundColor: colors.surfaceLight }]}>
                                <TextInput style={[styles.passwordInput, { color: colors.textPrimary }]} placeholder="Ulangi password" placeholderTextColor={colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showNewPassword} />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.surfaceLight }]} onPress={closePasswordModal}>
                                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleChangePassword} disabled={isChangingPassword}>
                                {isChangingPassword ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={[styles.saveBtnText, { color: colors.primary }]}>Simpan</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing.lg, paddingTop: spacing.xxl + 10, paddingBottom: spacing.xxl },
    header: { alignItems: 'center', marginBottom: spacing.xl },
    avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, ...shadows.glow },
    avatarText: { fontSize: 28, fontWeight: '700' },
    userName: { ...typography.h2 },
    roleBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginTop: spacing.sm },
    roleText: { ...typography.caption, fontWeight: '600', letterSpacing: 0.5 },
    statusBanner: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, marginTop: spacing.md },
    section: { marginBottom: spacing.lg },
    sectionTitle: { ...typography.caption, marginBottom: spacing.sm, marginLeft: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    themeItem: { width: '31%', padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
    themeSwatch: { width: 48, height: 32, borderRadius: borderRadius.sm, marginBottom: spacing.xs, overflow: 'hidden' },
    themeAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 8 },
    themeIcon: { fontSize: 16, marginBottom: 2 },
    themeName: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
    card: { borderRadius: borderRadius.lg, padding: spacing.md },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: borderRadius.lg, padding: spacing.md },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    menuIcon: { fontSize: 18 },
    menuText: { ...typography.body },
    menuArrow: { fontSize: 20 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    infoLabel: { ...typography.bodySmall },
    infoValue: { ...typography.bodySmall, fontWeight: '500' },
    divider: { height: 1 },
    logoutButton: { flexDirection: 'row', borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, gap: spacing.sm, borderWidth: 1 },
    logoutIcon: { fontSize: 18 },
    logoutText: { ...typography.body, fontWeight: '600' },
    footer: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl, paddingBottom: spacing.xxl },
    modalTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing.xl },
    inputGroup: { marginBottom: spacing.lg },
    inputLabel: { ...typography.caption, marginBottom: spacing.xs, textTransform: 'uppercase' },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md },
    passwordInput: { flex: 1, padding: spacing.md, fontSize: 14 },
    eyeButton: { padding: spacing.md },
    modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    cancelBtn: { flex: 1, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
    cancelBtnText: { ...typography.body },
    saveBtn: { flex: 1, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
    saveBtnText: { ...typography.body, fontWeight: '600' },
    faceStatus: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
});
