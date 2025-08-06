'use client'

import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faInstagram, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { faMapMarkerAlt, faPhoneAlt, faEnvelope } from '@fortawesome/free-solid-svg-icons'

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
  socialMedia: {
    facebook?: string
    instagram?: string
    twitter?: string
    tiktok?: string
  }
  businessHours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
}

export default function Footer() {
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

  const formatBusinessHours = () => {
    if (!salonInfo) return []
    
    const days = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' }
    ]

    return days.map(({ key, label }) => {
      const hours = salonInfo.businessHours[key as keyof typeof salonInfo.businessHours]
      if (hours.closed) {
        return `${label}: Closed`
      }
      return `${label}: ${hours.open} - ${hours.close}`
    })
  }

  return (
    <footer className="bg-primary-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img
                src="https://picsum.photos/40?random=103"
                alt={`${salonInfo?.name || 'Salon'} Logo`}
                className="h-10 w-10 rounded-full"
              />
              <span className="font-heading text-xl font-semibold">
                {salonInfo?.name || 'Bliss Hair Studio'}
              </span>
            </div>
            <p className="text-primary-200 mb-4">
              {salonInfo?.description || 'Professional hair care services in a relaxing atmosphere.'}
            </p>
            <div className="flex space-x-4">
              {salonInfo?.socialMedia?.facebook && (
                <a href={salonInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-primary-200 hover:text-white">
                  <FontAwesomeIcon icon={faFacebookF} />
                </a>
              )}
              {salonInfo?.socialMedia?.instagram && (
                <a href={salonInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-primary-200 hover:text-white">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
              )}
              {salonInfo?.socialMedia?.twitter && (
                <a href={salonInfo.socialMedia.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-primary-200 hover:text-white">
                  <FontAwesomeIcon icon={faTwitter} />
                </a>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-2">
              <p className="flex items-center text-primary-200">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                {salonInfo ? 
                  `${salonInfo.address.street}, ${salonInfo.address.city}, ${salonInfo.address.state} ${salonInfo.address.zipCode}` :
                  '123 Beauty St, Salon City, SC 12345'
                }
              </p>
              <p className="flex items-center text-primary-200">
                <FontAwesomeIcon icon={faPhoneAlt} className="mr-2" />
                {salonInfo?.phone || '(555) 123-4567'}
              </p>
              <p className="flex items-center text-primary-200">
                <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                {salonInfo?.email || 'hello@blisshairstudio.com'}
              </p>
            </div>
            <button
              id="callNowBtn"
              className="mt-4 bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-full font-medium transition-colors duration-200"
              onClick={() => salonInfo?.phone && window.open(`tel:${salonInfo.phone}`)}
            >
              <FontAwesomeIcon icon={faPhoneAlt} className="mr-2" /> Call Now
            </button>
          </div>

          {/* Hours & Map */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Hours</h4>
            <div className="space-y-2 text-primary-200">
              {salonInfo ? (
                formatBusinessHours().map((hours, index) => (
                  <p key={index}>{hours}</p>
                ))
              ) : (
                <>
                  <p>Monday - Friday: 9:00 AM - 7:00 PM</p>
                  <p>Saturday: 9:00 AM - 5:00 PM</p>
                  <p>Sunday: Closed</p>
                </>
              )}
            </div>
            <div className="mt-4 h-48">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215373510928!2d-73.9878449242396!3d40.74844097138959!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1687209345833!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Bottom Legal Links */}
        <div className="border-t border-primary-700 mt-8 pt-8 text-center text-primary-300 text-sm">
          <p>&copy; 2024 {salonInfo?.name || 'Bliss Hair Studio'}. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Cancellation Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
