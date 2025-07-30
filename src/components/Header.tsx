// src/components/Header.tsx
'use client'
import BookingModal from './BookingModal'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, User } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import AuthModal from './AuthModal'
import CustomerProfile from './CustomerProfile'
import BookingHistory from './BookingHistory'

export default function Header() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showBookingHistory, setShowBookingHistory] = useState(false)
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Image
            src="https://picsum.photos/40?random=101"
            alt="Bliss Hair Studio Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="font-heading text-xl font-semibold text-primary-800">
            Bliss Hair Studio
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <BookingModal />
          
          {/* User Authentication */}
          {user ? (
            <div className="flex items-center space-x-2">
              {user.type === 'customer' ? (
                <>
                  <button
                    onClick={() => setShowBookingHistory(true)}
                    className="text-secondary-600 hover:text-secondary-700 font-medium transition-colors duration-200 px-3 py-2"
                  >
                    My Bookings
                  </button>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="bg-secondary-500 hover:bg-secondary-600 text-white rounded-full font-medium transition-colors duration-200 px-4 py-2 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>{user.name?.split(' ')[0] || 'Customer'}</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/admin"
                  className="bg-secondary-500 hover:bg-secondary-600 text-white rounded-full font-medium transition-colors duration-200 px-4 py-2 flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-secondary-500 hover:bg-secondary-600 text-white rounded-full font-medium transition-colors duration-200 px-4 py-2 flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}


        </div>
      </nav>

      {/* Modals */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="login"
      />
      
      <CustomerProfile
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      
      <BookingHistory
        visible={showBookingHistory}
        onClose={() => setShowBookingHistory(false)}
      />
    </header>
  )
}
