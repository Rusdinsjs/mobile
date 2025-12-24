// Transfer Request Screen - Mobile
// Allows employee to request office location transfer
import React, { useState } from 'react';
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
import apiClient from '../api/client';

interface TransferRequestScreenProps {
    navigation: any;
}

export default function TransferRequestScreen({ navigation }: TransferRequestScreenProps) {
    const colors = useColors();
    const user = useAuthStore((state) => state.user);

    const [requestedLat, setRequestedLat] = useState('');
    const [requestedLong, setRequestedLong] = useState('');
    const [requestedRadius, setRequestedRadius] = useState('50');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!requestedLat || !requestedLong) {
            Alert.alert('Error', 'Harap isi koordinat lokasi baru');
            return;
        }

        const lat = parseFloat(requestedLat);
        const lng = parseFloat(requestedLong);
        const radius = parseInt(requestedRadius) || 50;

        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Error', 'Koordinat tidak valid');
            return;
        }

        setIsSubmitting(true);

        try {
            await apiClient.post('/api/users/transfer-requests', {
                requested_office_lat: lat,
                requested_office_long: lng,
                requested_radius: radius,
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

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        Pindah Lokasi Kantor
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                        Ajukan permintaan untuk pindah ke lokasi kantor lain
                    </Text>
                </View>

                {/* Current Location */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                        Lokasi Saat Ini
                    </Text>
                    <Text style={[styles.coordText, { color: colors.textMuted }]}>
                        Lat: {user?.office_lat?.toFixed(6) || 'N/A'}
                    </Text>
                    <Text style={[styles.coordText, { color: colors.textMuted }]}>
                        Long: {user?.office_long?.toFixed(6) || 'N/A'}
                    </Text>
                    <Text style={[styles.coordText, { color: colors.textMuted }]}>
                        Radius: {user?.allowed_radius || 50}m
                    </Text>
                </View>

                {/* New Location Form */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                        Lokasi Baru
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Latitude</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
                            value={requestedLat}
                            onChangeText={setRequestedLat}
                            placeholder="-6.200000"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Longitude</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
                            value={requestedLong}
                            onChangeText={setRequestedLong}
                            placeholder="106.800000"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Radius (meter)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
                            value={requestedRadius}
                            onChangeText={setRequestedRadius}
                            placeholder="50"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Alasan (opsional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.textPrimary }]}
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Contoh: Pindah ke kantor cabang Jakarta Selatan..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.accent }, isSubmitting && styles.disabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        <Text style={[styles.submitText, { color: colors.primary }]}>
                            Kirim Permintaan
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
    cardTitle: { ...typography.h3, marginBottom: spacing.md },
    coordText: { ...typography.body, fontFamily: 'monospace', marginBottom: spacing.xs },
    inputGroup: { marginBottom: spacing.md },
    label: { ...typography.caption, marginBottom: spacing.xs, marginLeft: spacing.xs },
    input: { padding: spacing.md, borderRadius: borderRadius.md, ...typography.body },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    submitButton: { padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.md, ...shadows.glow },
    submitText: { ...typography.h3, fontWeight: '700' },
    disabled: { opacity: 0.5 },
    cancelButton: { padding: spacing.md, alignItems: 'center' },
    cancelText: { ...typography.body },
});
