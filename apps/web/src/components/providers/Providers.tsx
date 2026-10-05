'use client'

import React from 'react'
import { AuthProvider } from './AuthProvider'
import { SocketProvider } from './SocketProvider'

/** Все клиентские провайдеры сайта */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>{children}</SocketProvider>
    </AuthProvider>
  )
}