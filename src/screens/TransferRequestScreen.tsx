// Transfer Request Screen - Mobile
// Allows employee to request office location transfer
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { spacing, borderRadius, typography, shadows } from '../styles/theme';
import { useColors } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import apiClient, { commonAPI } from '../api/client';

interface TransferRequestScreenProps {
    navigation: any;
}

interface Office {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius: number;
}

export default function TransferRequestScreen({ navigation }: TransferRequestScreenProps) {
    const colors = useColors();
    const user = useAuthStore((state) => state.user);

    const [offices, setOffices] = useState<Office[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Offices on Mount
    useEffect(() => {
        const fetchOffices = async () => {
            try {
                const response = await commonAPI.getOffices();
                // Filter out current office if needed, or just show list
                const allOffices = response.data.offices || [];
                // Exclude current office from options
                const availableOffices = allOffices.filter((o: Office) => o.id !== user?.office_id);
                setOffices(availableOffices);
            } catch (error) {
                console.error('Failed to fetch offices:', error);
                Alert.alert('Error', 'Gagal memuat daftar kantor');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOffices();
    }, [user?.office_id]);

    const handleSubmit = async () => {
        if (!selectedOffice) {
            Alert.alert('Error', 'Harap pilih kantor tujuan');
            return;
        }

        if (!reason.trim()) {
            Alert.alert('Error', 'Harap isi alasan kepindahan');
            return;
        }

        setIsSubmitting(true);

        try {
            await apiClient.post('/api/users/transfer-requests', {
                requested_office_lat: selectedOffice.latitude,
                requested_office_long: selectedOffice.longitude,
                requested_radius: selectedOffice.radius,
                reason: reason,
            });

            Alert.alert(
                'Berhasil! 📍',
                'Permintaan pindah lokasi telah dikirim dan menunggu persetujuan admin.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Gagal mengirim permintaan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const styles = createStyles(colors);

    // Simple Dropdown Implementation
    const renderOfficeItem = (office: Office) => (
        <TouchableOpacity
            key={office.id}
            style={[
                styles.officeItem,
                selectedOffice?.id === office.id && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
            ]}
            onPress={() => setSelectedOffice(office)}
        >
            <View>
                <Text style={[styles.officeName, { color: colors.textPrimary }]}>{office.name}</Text>
                <Text style={[styles.officeAddress, { color: colors.textSecondary }]}>{office.address}</Text>
            </View>
            {selectedOffice?.id === office.id && (
                <View style={[styles.checkMark, { backgroundColor: colors.primary }]} />
            )}
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        Pindah Lokasi Kantor
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                        Ajukan perpindahan ke kantor cabang lain
                    </Text>
                </View>

                {/* 1. Lokasi Kantor Lama */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        1. LOKASI KANTOR SAAT INI
                    </Text>
                    <View style={styles.currentInfo}>
                        <Text style={[styles.currentName, { color: colors.textPrimary }]}>
                            {user?.office?.name || 'Kantor Pusat'}
                        </Text>
                        <Text style={[styles.currentAddress, { color: colors.textMuted }]}>
                            {user?.office?.address || 'Alamat tidak tersedia'}
                        </Text>
                    </View>
                </View>

                {/* 2. Lokasi Kantor Yang Dituju */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        2. LOKASI KANTOR TUJUAN
                    </Text>

                    {isLoading ? (
                        <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} />
                    ) : offices.length === 0 ? (
                        <Text style={{ color: colors.textMuted, padding: spacing.md }}>Tidak ada kantor lain tersedia.</Text>
                    ) : (
                        <View style={styles.officeList}>
                            {selectedOffice ? (
                                <TouchableOpacity
                                    style={[styles.selectedBox, { borderColor: colors.primary }]}
                                    onPress={() => setSelectedOffice(null)}
                                >
                                    <View>
                                        <Text style={[styles.officeName, { color: colors.textPrimary }]}>{selectedOffice.name}</Text>
                                        <Text style={[styles.officeAddress, { color: colors.textSecondary }]}>{selectedOffice.address}</Text>
                                    </View>
                                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Ubah</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.listContainer}>
                                    <Text style={[styles.helperText, { color: colors.textMuted }]}>Pilih salah satu:</Text>
                                    {offices.map(renderOfficeItem)}
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* 3. Alasan Pindah */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        3. ALASAN PINDAH
                    </Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.textPrimary }]}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Contoh: Mutasi ke kantor cabang..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.accent }, (isSubmitting || !selectedOffice) && styles.disabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || !selectedOffice}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        <Text style={[styles.submitText, { color: colors.primary }]}>
                            Kirim Pengajuan
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.cancelText, { color: colors.textMuted }]}>Batal</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing.lg, paddingTop: spacing.xxl },
    header: { marginBottom: spacing.xl },
    title: { ...typography.h2, marginBottom: spacing.xs },
    subtitle: { ...typography.body },

    card: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg, ...shadows.sm },
    sectionLabel: { ...typography.caption, marginBottom: spacing.sm, fontWeight: 'bold', letterSpacing: 1 },

    currentInfo: { padding: spacing.sm },
    currentName: { ...typography.h3, marginBottom: spacing.xs },
    currentAddress: { ...typography.body },

    officeList: { marginTop: spacing.xs },
    listContainer: { gap: spacing.sm },
    officeItem: {
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: colors.background,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedBox: {
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        backgroundColor: colors.background,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    officeName: { ...typography.body, fontWeight: 'bold' },
    officeAddress: { ...typography.caption, marginTop: 2 },
    checkMark: { width: 12, height: 12, borderRadius: 6 },
    helperText: { ...typography.caption, marginBottom: spacing.sm },

    input: { padding: spacing.md, borderRadius: borderRadius.md, ...typography.body },
    textArea: { minHeight: 100, textAlignVertical: 'top' },

    submitButton: { padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.md, ...shadows.glow, marginTop: spacing.md },
    submitText: { ...typography.h3, fontWeight: '700' },
    disabled: { opacity: 0.5 },
    cancelButton: { padding: spacing.md, alignItems: 'center' },
    cancelText: { ...typography.body },
});
