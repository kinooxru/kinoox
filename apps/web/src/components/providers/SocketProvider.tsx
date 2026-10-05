'use client'

import React from 'react'
import { io, type Socket } from 'socket.io-client'

const SocketContext = React.createContext<Socket | null>(null)

/**
 * Провайдер Socket.io: одно соединение на всё приложение.
 * Используется для уведомлений о новых сериях и совместного просмотра.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = React.useState<Socket | null>(null)

  React.useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001'
    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem('kinoox.accessToken') : null

    const instance = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: false,
    })

    // В dev-режиме React монтирует эффект дважды. Подключаемся с задержкой в тик,
    // чтобы первый (отменяемый) монтаж не открывал и не обрывал соединение.
    const timer = setTimeout(() => instance.connect(), 0)
    setSocket(instance)

    return () => {
      clearTimeout(timer)
      instance.disconnect()
      setSocket(null)
    }
  }, [])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

/** Доступ к Socket.io-соединению */
export function useSocket(): Socket | null {
  return React.useContext(SocketContext)
}

/** Подписка на событие Socket.io с автоматической отпиской */
export function useSocketEvent<T>(event: string, handler: (payload: T) => void): void {
  const socket = useSocket()
  const handlerRef = React.useRef(handler)
  handlerRef.current = handler

  React.useEffect(() => {
    if (!socket) return

    const listener = (payload: T) => handlerRef.current(payload)
    socket.on(event, listener)

    return () => {
      socket.off(event, listener)
    }
  }, [socket, event])
}