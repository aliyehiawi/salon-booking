'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Toast from '@/components/Toast'

type ToastContextType = {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const [type, setType] = useState<'success' | 'error' | 'info'>('success')

  const showToast = (msg: string, t: 'success' | 'error' | 'info' = 'success') => {
    setMessage(msg)
    setType(t)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && <Toast message={message} type={type} onClose={() => setMessage(null)} />}
    </ToastContext.Provider>
  )
}
