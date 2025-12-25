// Home Screen with Dynamic Theming
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { spacing, borderRadius, shadows, typography } from '../styles/theme';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useColors } from '../store/themeStore';
import { attendanceAPI, commonAPI } from '../api/client';
import { useLocation } from '../hooks/useLocation';
import { calculateDistance, formatDistance } from '../utils/geofence';

interface HomeScreenProps { navigation: any; }

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const colors = useColors();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [companyName, setCompanyName] = useState('AttendX');

    const user = useAuthStore((state) => state.user);
    const { todayAttendance, isCheckedIn, isCheckedOut, setTodayAttendance } = useAttendanceStore();
    const { latitude, longitude, isMockLocation, error: locationError } = useLocation();

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
                <View>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>Selamat datang di {companyName},</Text>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name?.split(' ')[0] || 'User'}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: getStatusColor() + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                    <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
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

            {/* Action Button */}
            <TouchableOpacity
                style={[
                    styles.actionButton,
                    { backgroundColor: isCheckedOut ? colors.success : colors.accent },
                    isCheckedOut && styles.actionButtonCompleted
                ]}
                onPress={() => !isCheckedOut && navigation.navigate('CheckIn')}
                disabled={isCheckedOut}
            >
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                    {isCheckedOut ? '✅ Selesai Hari Ini' : isCheckedIn ? '🚪 Check Out' : '✅ Check In'}
                </Text>
            </TouchableOpacity>

            {!isWithinOffice && !isCheckedOut && (
                <Text style={[styles.disabledHint, { color: colors.textMuted }]}>
                    Dekati area kantor untuk melakukan absensi
                </Text>
            )}
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
    actionButton: { borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md, ...shadows.glow },
    actionButtonCompleted: { opacity: 0.7 },
    actionButtonText: { ...typography.h3, fontWeight: '700' },
    disabledHint: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
});
