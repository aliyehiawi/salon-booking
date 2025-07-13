// src/components/Hero.tsx
'use client'

import Image from 'next/image'
import BookingModal from './BookingModal'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-r from-primary-100 to-primary-200 py-16 md:py-24">
      <div className="container flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-800 mb-4">
            Your Best Hair Day Awaits
          </h1>
          <p className="text-lg text-primary-700 mb-6">
            Experience premium hair care in our relaxing studio with expert stylists.
          </p>
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