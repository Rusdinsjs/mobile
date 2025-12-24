// History Screen with Dynamic Theming
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useAttendanceStore } from '../store/attendanceStore';
import { useColors } from '../store/themeStore';
import { attendanceAPI } from '../api/client';

interface AttendanceRecord {
    id: string;
    check_in_time: string;
    check_out_time?: string;
    is_late?: boolean;
}

export default function HistoryScreen() {
    const colors = useColors();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { history, setHistory } = useAttendanceStore();

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            const response = await attendanceAPI.getHistory(30);
            setHistory(response.data.attendances || []);
        } catch (error) {
            console.log('Failed to fetch history');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchHistory();
        setRefreshing(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hari Ini';
        if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
        return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const calculateDuration = (checkIn: string, checkOut?: string) => {
        if (!checkOut) return null;
        const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return `${hours}j ${mins}m`;
    };

    const styles = createStyles(colors);

    const renderItem = ({ item }: { item: AttendanceRecord }) => (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.cardDate, { color: colors.textPrimary }]}>{formatDate(item.check_in_time)}</Text>
                {item.is_late && <View style={[styles.lateBadge, { backgroundColor: colors.error + '20' }]}><Text style={[styles.lateText, { color: colors.error }]}>Terlambat</Text></View>}
                {!item.check_out_time && <View style={[styles.activeBadge, { backgroundColor: colors.success + '20' }]}><Text style={[styles.activeText, { color: colors.success }]}>Aktif</Text></View>}
            </View>
            <View style={styles.cardBody}>
                <View style={styles.timeBlock}>
                    <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Masuk</Text>
                    <Text style={[styles.timeValue, { color: colors.success }]}>{formatTime(item.check_in_time)}</Text>
                </View>
                <View style={[styles.timeDivider, { backgroundColor: colors.surfaceLight }]} />
                <View style={styles.timeBlock}>
                    <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Keluar</Text>
                    <Text style={[styles.timeValue, { color: item.check_out_time ? colors.accent : colors.textMuted }]}>{item.check_out_time ? formatTime(item.check_out_time) : '--:--'}</Text>
                </View>
                {item.check_out_time && (
                    <View style={styles.durationBlock}>
                        <Text style={[styles.durationValue, { color: colors.textPrimary }]}>{calculateDuration(item.check_in_time, item.check_out_time)}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    if (loading) {
        return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Riwayat</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>{history.length} catatan kehadiran</Text>
            </View>
            <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Belum ada riwayat kehadiran</Text>
                    </View>
                }
            />
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: spacing.lg, paddingTop: spacing.xxl + 10, paddingBottom: spacing.md },
    title: { ...typography.h1 },
    subtitle: { ...typography.bodySmall, marginTop: spacing.xs },
    list: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm },
    card: { borderRadius: borderRadius.lg, padding: spacing.md },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
    cardDate: { ...typography.body, fontWeight: '600', flex: 1 },
    lateBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
    lateText: { ...typography.caption, fontWeight: '600' },
    activeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
    activeText: { ...typography.caption, fontWeight: '600' },
    cardBody: { flexDirection: 'row', alignItems: 'center' },
    timeBlock: { flex: 1, alignItems: 'center' },
    timeLabel: { ...typography.caption, marginBottom: 2 },
    timeValue: { fontSize: 18, fontWeight: '600' },
    timeDivider: { width: 1, height: 30, marginHorizontal: spacing.sm },
    durationBlock: { paddingLeft: spacing.md },
    durationValue: { ...typography.bodySmall, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyText: { ...typography.body },
});
