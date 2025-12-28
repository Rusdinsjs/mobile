// WebSocket hook for realtime updates in React Native
import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { API_BASE_URL } from '../api/client';
import { useAuthStore } from '../store/authStore';

type EventHandler = (data: any) => void;

interface WebSocketMessage {
    type: string;
    payload?: any;
}

export function useWebSocket() {
    const wsRef = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const eventHandlersRef = useRef<Map<string, EventHandler[]>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const accessToken = useAuthStore((state) => state.accessToken);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        if (!accessToken) return;

        // Convert http to ws
        const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws/dashboard?type=mobile';

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('[WS] Connected');
                setConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    const handlers = eventHandlersRef.current.get(message.type) || [];
                    handlers.forEach((handler) => handler(message.payload));
                } catch (e) {
                    console.log('[WS] Parse error:', e);
                }
            };

            ws.onerror = (error) => {
                console.log('[WS] Error:', error);
            };

            ws.onclose = () => {
                console.log('[WS] Disconnected');
                setConnected(false);
                // Auto-reconnect after 5 seconds
                reconnectTimeoutRef.current = setTimeout(connect, 5000);
            };

            wsRef.current = ws;
        } catch (e) {
            console.log('[WS] Connection error:', e);
        }
    }, [accessToken]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        wsRef.current?.close();
        wsRef.current = null;
        setConnected(false);
    }, []);

    // Subscribe to an event type
    const subscribe = useCallback((eventType: string, handler: EventHandler) => {
        if (!eventHandlersRef.current.has(eventType)) {
            eventHandlersRef.current.set(eventType, []);
        }
        eventHandlersRef.current.get(eventType)!.push(handler);

        // Return unsubscribe function
        return () => {
            const handlers = eventHandlersRef.current.get(eventType) || [];
            const idx = handlers.indexOf(handler);
            if (idx > -1) handlers.splice(idx, 1);
        };
    }, []);

    // Handle app state changes (foreground/background)
    useEffect(() => {
        const handleAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                connect();
            } else if (nextState === 'background') {
                disconnect();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Connect on mount
        connect();

        return () => {
            subscription.remove();
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        connected,
        subscribe,
        disconnect,
        reconnect: connect,
    };
}

// Convenience hook for listening to user updates
export function useUserUpdates(onUpdate: () => void) {
    const { subscribe, connected } = useWebSocket();

    useEffect(() => {
        const unsubscribe = subscribe('user:updated', () => {
            onUpdate();
        });
        return unsubscribe;
    }, [subscribe, onUpdate]);

    return { connected };
}

// Convenience hook for listening to attendance updates
export function useAttendanceUpdates(onUpdate: () => void) {
    const { subscribe, connected } = useWebSocket();

    useEffect(() => {
        const unsubscribe = subscribe('attendance_update', () => {
            onUpdate();
        });
        return unsubscribe;
    }, [subscribe, onUpdate]);

    return { connected };
}
