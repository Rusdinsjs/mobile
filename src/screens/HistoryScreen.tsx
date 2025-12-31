// History Screen with Monthly Tabs and Recaps
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useAttendanceStore } from '../store/attendanceStore';
import { useColors } from '../store/themeStore';
import { attendanceAPI } from '../api/client';

interface AttendanceRecord {
    id: string;
    check_in_time: string | null;
    check_out_time?: string | null;
    is_late?: boolean;
    is_early_leave?: boolean;
}

type TabType = 'two_months_ago' | 'last_month' | 'this_month';

export default function HistoryScreen() {
    const colors = useColors();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('this_month');
    const { history, setHistory } = useAttendanceStore();

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            const response = await attendanceAPI.getHistory(90); // 3 months of data
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

    // Calculate date ranges for each tab
    const getDateRanges = () => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        // This month: 1st of current month to yesterday
        const thisMonthStart = new Date(thisYear, thisMonth, 1);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);

        // Last month: 1st to last day of previous month
        const lastMonthStart = new Date(thisYear, thisMonth - 1, 1);
        const lastMonthEnd = new Date(thisYear, thisMonth, 0, 23, 59, 59, 999);

        // Two months ago
        const twoMonthsStart = new Date(thisYear, thisMonth - 2, 1);
        const twoMonthsEnd = new Date(thisYear, thisMonth - 1, 0, 23, 59, 59, 999);

        return {
            this_month: { start: thisMonthStart, end: yesterday },
            last_month: { start: lastMonthStart, end: lastMonthEnd },
            two_months_ago: { start: twoMonthsStart, end: twoMonthsEnd },
        };
    };

    const dateRanges = getDateRanges();

    // Get month names for tabs
    const getTabLabels = () => {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const thisMonth = now.getMonth();

        return {
            this_month: months[thisMonth],
            last_month: months[(thisMonth - 1 + 12) % 12],
            two_months_ago: months[(thisMonth - 2 + 12) % 12],
        };
    };

    const tabLabels = getTabLabels();

    // Filter history by selected tab
    const filteredHistory = useMemo(() => {
        const range = dateRanges[activeTab];
        return history.filter((item) => {
            if (!item.check_in_time) return false;
            const date = new Date(item.check_in_time);
            return date >= range.start && date <= range.end;
        });
    }, [history, activeTab, dateRanges]);

    // Calculate recap for current tab
    const recap = useMemo(() => {
        const data = filteredHistory;
        const totalHadir = data.length;
        const totalTerlambat = data.filter(d => d.is_late).length;

        const totalCepatPulang = data.filter(d => d.is_early_leave).length;

        return {
            hadir: totalHadir,
            terlambat: totalTerlambat,
            tepatWaktu: totalHadir - totalTerlambat,
            cepatPulang: totalCepatPulang,
        };
    }, [filteredHistory]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hari Ini';
        if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
        return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const calculateDuration = (checkIn: string | null, checkOut?: string | null) => {
        if (!checkIn || !checkOut) return null;
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
                {item.is_early_leave && <View style={[styles.lateBadge, { backgroundColor: colors.warning + '20' }]}><Text style={[styles.lateText, { color: colors.warning }]}>Cepat Pulang</Text></View>}
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
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                {(['two_months_ago', 'last_month', 'this_month'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            { backgroundColor: activeTab === tab ? colors.accent : colors.surface },
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab ? colors.primary : colors.textMuted }
                        ]}>
                            {tabLabels[tab]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Recap Summary */}
            {(activeTab === 'this_month' || activeTab === 'last_month' || activeTab === 'two_months_ago') && (
                <View style={[styles.recapCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.recapTitle, { color: colors.textMuted }]}>Rekap {tabLabels[activeTab]}</Text>
                    <View style={styles.recapGrid}>
                        <View style={styles.recapItem}>
                            <Text style={[styles.recapValue, { color: colors.success }]}>{recap.hadir}</Text>
                            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>Hadir</Text>
                        </View>
                        <View style={styles.recapItem}>
                            <Text style={[styles.recapValue, { color: colors.accent }]}>{recap.tepatWaktu}</Text>
                            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>Tepat Waktu</Text>
                        </View>
                        <View style={styles.recapItem}>
                            <Text style={[styles.recapValue, { color: colors.error }]}>{recap.terlambat}</Text>
                            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>Terlambat</Text>
                        </View>
                        <View style={styles.recapItem}>
                            <Text style={[styles.recapValue, { color: colors.warning }]}>{recap.cepatPulang}</Text>
                            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>Cepat Pulang</Text>
                        </View>
                    </View>
                </View>
            )}

            <FlatList
                data={filteredHistory}
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
    header: { padding: spacing.lg, paddingTop: spacing.xxl + 10, paddingBottom: spacing.sm },
    title: { ...typography.h1 },
    tabContainer: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
    tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
    tabText: { ...typography.bodySmall, fontWeight: '600' },
    recapCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg },
    recapTitle: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
    recapGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    recapItem: { alignItems: 'center' },
    recapValue: { fontSize: 20, fontWeight: '700' },
    recapLabel: { ...typography.caption, marginTop: 2 },
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
