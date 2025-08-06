// src/components/Hero.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Phone, Mail, MapPin } from 'lucide-react'
import BookingModal from './BookingModal'

interface SalonInfo {
  name: string
  phone: string
  email: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  description: string
}

export default function Hero() {
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null)

  useEffect(() => {
    const fetchSalonInfo = async () => {
      try {
        const response = await fetch('/api/salon-info')
        if (response.ok) {
          const data = await response.json()
          setSalonInfo(data)
        }
      } catch (error) {
        console.error('Error fetching salon info:', error)
      }
    }

    fetchSalonInfo()
  }, [])

  return (
    <section className="relative bg-gradient-to-r from-primary-100 to-primary-200 py-16 md:py-24">
      <div className="container flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-800 mb-4">
            {salonInfo?.name || 'Your Best Hair Day Awaits'}
          </h1>
          <p className="text-lg text-primary-700 mb-6">
            {salonInfo?.description || 'Experience premium hair care in our relaxing studio with expert stylists.'}
          </p>
          
          {/* Contact Information */}
          {salonInfo && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center text-primary-700">
                <Phone className="w-4 h-4 mr-2" />
                <span>{salonInfo.phone}</span>
              </div>
              <div className="flex items-center text-primary-700">
                <Mail className="w-4 h-4 mr-2" />
                <span>{salonInfo.email}</span>
              </div>
              <div className="flex items-center text-primary-700">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{salonInfo.address.street}, {salonInfo.address.city}, {salonInfo.address.state} {salonInfo.address.zipCode}</span>
              </div>
            </div>
          )}
          
          {/* Pass a larger size only for Hero */}
          <BookingModal buttonClassName="px-6 py-3 text-lg" />
        </div>
        <div className="md:w-1/2 flex justify-center">
          <Image
            src="https://picsum.photos/500/400?random=102"
            alt="Salon interior with happy client"
            width={500}
            height={400}
            className="rounded-lg shadow-xl h-auto w-auto max-w-full"
          />
        </div>
      </div>
    </section>
  )
}