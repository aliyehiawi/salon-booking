// src/components/Header.tsx
'use client'
import BookingModal from './BookingModal'
import Image from 'next/image'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function Header() {
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
          <Link
            href="/admin/login"
            className="bg-secondary-500 hover:bg-secondary-600 text-white rounded-full font-medium transition-colors duration-200 px-4 py-2 flex items-center space-x-2"
            title="Admin Login"
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </Link>
        </div>
      </nav>
    </header>
  )
}
