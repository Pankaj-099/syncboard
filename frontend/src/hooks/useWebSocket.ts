import { useEffect, useRef, useCallback } from "react"
import type { WSEvent } from "../types"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const WS_URL = API_URL.replace(/^http/, "ws")

type Options = {
    orgId: string | undefined
    token: string | null | undefined
    onEvent: (event: WSEvent) => void
    enabled?: boolean
}

export function useWebSocket({ orgId, token, onEvent, enabled = true }: Options) {
    const wsRef = useRef<WebSocket | null>(null)
    const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const onEventRef = useRef(onEvent)
    onEventRef.current = onEvent

    const connect = useCallback(() => {
        if (!orgId || !token || !enabled) return

        const url = `${WS_URL}/ws/${orgId}?token=${token}`
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
            // Keep-alive ping every 25s
            pingRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) ws.send("ping")
            }, 25000)
        }

        ws.onmessage = (e) => {
            try {
                const event: WSEvent = JSON.parse(e.data)
                if (e.data !== "pong") onEventRef.current(event)
            } catch {}
        }

        ws.onclose = () => {
            if (pingRef.current) clearInterval(pingRef.current)
            // Auto-reconnect after 3s
            reconnectRef.current = setTimeout(connect, 3000)
        }

        ws.onerror = () => ws.close()
    }, [orgId, token, enabled])

    useEffect(() => {
        connect()
        return () => {
            if (pingRef.current) clearInterval(pingRef.current)
            if (reconnectRef.current) clearTimeout(reconnectRef.current)
            wsRef.current?.close()
        }
    }, [connect])
}
