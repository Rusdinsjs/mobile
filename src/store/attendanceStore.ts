// Attendance Store using Zustand
import { create } from 'zustand';

interface Attendance {
    id: string;
    user_id: string;
    check_in_time: string | null;
    check_out_time: string | null;
    check_in_lat: number | null;
    check_in_long: number | null;
    is_late: boolean;
    is_mock_location: boolean;
}

interface AttendanceState {
    todayAttendance: Attendance | null;
    history: Attendance[];
    isCheckedIn: boolean;
    isCheckedOut: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setTodayAttendance: (attendance: Attendance | null) => void;
    setHistory: (history: Attendance[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    checkIn: (attendance: Attendance) => void;
    checkOut: (attendance: Attendance) => void;
    reset: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
    todayAttendance: null,
    history: [],
    isCheckedIn: false,
    isCheckedOut: false,
    isLoading: false,
    error: null,

    setTodayAttendance: (attendance) =>
        set({
            todayAttendance: attendance,
            isCheckedIn: Boolean(attendance && attendance.check_in_time),
            isCheckedOut: Boolean(attendance && attendance.check_out_time),
        }),

    setHistory: (history) => set({ history }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    checkIn: (attendance) =>
        set({
            todayAttendance: attendance,
            isCheckedIn: true,
            isLoading: false,
        }),

    checkOut: (attendance) =>
        set({
            todayAttendance: attendance,
            isCheckedOut: true,
            isLoading: false,
        }),

    reset: () =>
        set({
            todayAttendance: null,
            history: [],
            isCheckedIn: false,
            isCheckedOut: false,
            isLoading: false,
            error: null,
        }),
}));
