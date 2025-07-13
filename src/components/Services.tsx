'use client'

import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisH, faClock } from '@fortawesome/free-solid-svg-icons'

type Service = {
  _id: string
  name: string
  description: string
  duration: string
  price: string
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services')
        if (!res.ok) throw new Error('Failed to load services')
        const data = await res.json()
        setServices(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container text-center text-gray-500">Loading services…</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container text-center text-red-500">{error}</div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold text-center text-primary-800 mb-12">
          Our Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map(service => {
            const Icon = faEllipsisH
            return (
              <div
                key={service._id}
                className="bg-primary-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-secondary-100 p-3 rounded-full mr-4">
                    <FontAwesomeIcon icon={Icon} className="text-secondary-500 text-xl" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-primary-800">
                    {service.name}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                    <span>{service.duration} min</span>  
                  </div>
                  <span className="font-medium text-primary-700">
                    ${service.price}             
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
