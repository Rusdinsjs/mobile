// Home Screen with Dynamic Theming
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, Alert } from 'react-native';
import { spacing, borderRadius, shadows, typography } from '../styles/theme';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useColors } from '../store/themeStore';
import { BlurView } from 'expo-blur';
import { attendanceAPI, commonAPI } from '../api/client';
import { useLocation } from '../hooks/useLocation';
import { useAttendanceUpdates } from '../hooks/useWebSocket';
import { calculateDistance, formatDistance } from '../utils/geofence';

interface HomeScreenProps { navigation: any; }

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const colors = useColors();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [companyName, setCompanyName] = useState('AttendX');

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { todayAttendance, isCheckedIn, isCheckedOut, setTodayAttendance, reset: resetAttendance } = useAttendanceStore();
    const { latitude, longitude, isMockLocation, error: locationError } = useLocation();

    // WebSocket: Listen for attendance updates
    const { connected } = useAttendanceUpdates(() => {
        console.log('[Home] Attendance update received via WebSocket');
        fetchTodayStatus();
    });

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        commonAPI.getSettings().then(res => {
            if (res.data.company_name) setCompanyName(res.data.company_name);
        }).catch(() => { });
        return () => clearInterval(interval);
    }, []);

    useEffect(() => { fetchTodayStatus(); }, []);

    const fetchTodayStatus = async () => {
        try {
            const response = await attendanceAPI.getTodayStatus();
            setTodayAttendance(response.data.attendance);
        } catch (error) { console.log('No attendance today'); }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTodayStatus();
        setRefreshing(false);
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Yakin ingin keluar?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => { resetAttendance(); logout(); } },
        ]);
    };

    const distance = user && latitude && longitude ? calculateDistance(user.office_lat, user.office_long, latitude, longitude) : null;
    const isWithinOffice = distance !== null && distance <= (user?.allowed_radius || 50);

    const formatTime = (date: Date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const formatSeconds = (date: Date) => date.toLocaleTimeString('id-ID', { second: '2-digit' }).slice(-2);

    const getStatusText = () => {
        if (isCheckedOut) return 'Selesai Hari Ini';
        if (isCheckedIn) return 'Sudah Check In';
        return 'Belum Check In';
    };

    const getStatusColor = () => {
        if (isCheckedOut) return colors.success;
        if (isCheckedIn) return colors.warning;
        return colors.textMuted;
    };

    const styles = createStyles(colors);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>Selamat datang di {companyName},</Text>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name?.split(' ')[0] || 'User'}</Text>
                </View>

                <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {connected && (
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 8 }} />
                        )}
                        <View style={[styles.statusPill, { backgroundColor: getStatusColor() + '15', borderColor: getStatusColor() + '30', borderWidth: 1 }]}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText().toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Clock */}
            <View style={[styles.clockCard, { backgroundColor: colors.surface }]}>
                <View style={styles.clockRow}>
                    <Text style={[styles.clockTime, { color: colors.textPrimary }]}>{formatTime(currentTime)}</Text>
                    <Text style={[styles.clockSeconds, { color: colors.accent }]}>{formatSeconds(currentTime)}</Text>
                </View>
                <Text style={[styles.clockDate, { color: colors.textMuted }]}>
                    {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
            </View>

            {/* Today's Attendance */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Kehadiran Hari Ini</Text>
                <View style={[styles.attendanceCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.attendanceRow}>
                        <View style={styles.attendanceItem}>
                            <Text style={[styles.attendanceLabel, { color: colors.textMuted }]}>Check In</Text>
                            <Text style={[styles.attendanceTime, { color: colors.success }]}>
                                {todayAttendance?.check_in_time ? new Date(todayAttendance.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </Text>
                        </View>
                        <View style={[styles.attendanceDivider, { backgroundColor: colors.surfaceLight }]} />
                        <View style={styles.attendanceItem}>
                            <Text style={[styles.attendanceLabel, { color: colors.textMuted }]}>Check Out</Text>
                            <Text style={[styles.attendanceTime, { color: todayAttendance?.check_out_time ? colors.accent : colors.textMuted }]}>
                                {todayAttendance?.check_out_time ? new Date(todayAttendance.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Lokasi</Text>
                <View style={[styles.locationCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.locationRow}>
                        <View style={styles.locationItem}>
                            <Text style={styles.locationIcon}>{isWithinOffice ? '✅' : '📍'}</Text>
                            <Text style={[styles.locationLabel, { color: colors.textMuted }]}>Jarak ke Kantor</Text>
                            <Text style={[styles.locationValue, { color: isWithinOffice ? colors.success : colors.warning }]}>
                                {distance !== null ? formatDistance(distance) : 'Memuat...'}
                            </Text>
                        </View>
                        <View style={styles.locationItem}>
                            <Text style={styles.locationIcon}>{isMockLocation ? '⚠️' : '🛰️'}</Text>
                            <Text style={[styles.locationLabel, { color: colors.textMuted }]}>GPS Status</Text>
                            <Text style={[styles.locationValue, { color: isMockLocation ? colors.error : colors.success }]}>
                                {isMockLocation ? 'Mock' : 'Valid'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Action Section */}
            <View style={styles.actionWrapper}>
                {isCheckedOut ? (
                    <BlurView intensity={20} tint="light" style={styles.glassCard}>
                        <View style={[styles.infoCardInner, { borderColor: colors.success + '40' }]}>
                            <Text style={[styles.infoText, { color: colors.success }]}>
                                ✨ Selesai Hari Ini
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                                Kerja bagus! Sampai jumpa besok.
                            </Text>
                        </View>
                    </BlurView>
                ) : (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('CheckIn')}
                        style={styles.actionButtonContainer}
                    >
                        <BlurView
                            intensity={40}
                            tint="default"
                            style={[
                                styles.glassButton,
                                { backgroundColor: isCheckedIn ? colors.warning + '20' : colors.accent + '20', borderColor: isCheckedIn ? colors.warning + '40' : colors.accent + '40' }
                            ]}
                        >
                            <View style={[styles.buttonContent, { backgroundColor: isCheckedIn ? colors.warning : colors.accent }]}>
                                <Text style={[styles.actionButtonText, { color: colors.white }]}>
                                    {isCheckedIn ? '🚪 CHECK OUT' : '✅ CHECK IN'}
                                </Text>
                            </View>
                        </BlurView>
                    </TouchableOpacity>
                )}
            </View>

            {!isWithinOffice && !isCheckedOut && (
                <Text style={[styles.disabledHint, { color: colors.textMuted }]}>
                    Dekati area kantor untuk melakukan absensi
                </Text>
            )}

            <TouchableOpacity
                onPress={handleLogout}
                style={{
                    alignSelf: 'flex-end',
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    padding: spacing.sm,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    marginBottom: 12,
                    marginTop: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.error + '20'
                }}
            >
                <Text style={{ marginRight: spacing.xs, fontSize: 14 }}>🔴</Text>
                <Text style={{ color: colors.error, fontWeight: '600', fontSize: 12 }}>Keluar</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing.lg, paddingTop: spacing.xxl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
    greeting: { ...typography.bodySmall },
    userName: { ...typography.h2 },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, gap: spacing.xs },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { ...typography.caption, fontWeight: '600' },
    clockCard: { borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
    clockRow: { flexDirection: 'row', alignItems: 'flex-end' },
    clockTime: { ...typography.clock },
    clockSeconds: { fontSize: 24, fontWeight: '300', marginLeft: spacing.xs, marginBottom: 6 },
    clockDate: { ...typography.bodySmall, marginTop: spacing.xs },
    section: { marginBottom: spacing.lg },
    sectionTitle: { ...typography.caption, marginBottom: spacing.sm, marginLeft: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
    attendanceCard: { borderRadius: borderRadius.lg, padding: spacing.md },
    attendanceRow: { flexDirection: 'row' },
    attendanceItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
    attendanceDivider: { width: 1, marginVertical: spacing.sm },
    attendanceLabel: { ...typography.caption, marginBottom: spacing.xs },
    attendanceTime: { fontSize: 20, fontWeight: '600' },
    locationCard: { borderRadius: borderRadius.lg, padding: spacing.md },
    locationRow: { flexDirection: 'row' },
    locationItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
    locationIcon: { fontSize: 20, marginBottom: spacing.xs },
    locationLabel: { ...typography.caption, marginBottom: 2 },
    locationValue: { ...typography.body, fontWeight: '600' },
    actionWrapper: { marginTop: spacing.md, overflow: 'hidden', borderRadius: borderRadius.xl },
    glassCard: { padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    infoCardInner: { alignItems: 'center', padding: spacing.sm },
    infoText: { ...typography.h3, fontWeight: '800', letterSpacing: 0.5 },
    actionButtonContainer: { borderRadius: borderRadius.xl, overflow: 'hidden' },
    glassButton: { padding: 6, borderRadius: borderRadius.xl, borderWidth: 1 },
    buttonContent: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center', ...shadows.md },
    actionButtonText: { ...typography.h3, fontWeight: '800', letterSpacing: 1.5 },
    disabledHint: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
});
