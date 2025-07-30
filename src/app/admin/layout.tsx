'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Settings, LogOut, Users, Clock, Home } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is authenticated and is admin
  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }
    
    if (user.type !== 'admin') {
      router.replace('/')
      return
    }
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  // Guard – render nothing until auth check completes
  if (!user || user.type !== 'admin') {
    return null
  }

  const navItems = [
    {
      href: '/admin',
      label: 'Appointments',
      icon: Calendar,
      description: 'View and manage bookings'
    },
    {
      href: '/admin/services',
      label: 'Services',
      icon: Settings,
      description: 'Manage salon services'
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      description: 'Business hours, holidays, limits'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Salon Admin</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-3 py-1 transition"
                title="Back to Website"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Website
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block p-6 bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                  isActive 
                    ? 'border-secondary-500 bg-secondary-50' 
                    : 'border-gray-200 hover:border-secondary-300'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${
                    isActive ? 'bg-secondary-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-medium ${
                      isActive ? 'text-secondary-700' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {children}
        </div>
      </div>
    </div>
  )
} 