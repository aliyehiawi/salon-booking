'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { Building2, Save } from 'lucide-react'

interface SalonInfo {
  _id?: string
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
  website: string
  description: string
}

export default function AdminSalonInfoPage() {
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const fetchSalonInfo = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/salon-info', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!response.ok) throw new Error('Failed to fetch salon info')
        
        const data = await response.json()
        setSalonInfo(data)
      } catch (error) {
        console.error('Error fetching salon info:', error)
        showToast('Failed to load salon information', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchSalonInfo()
  }, [showToast])

  const handleSave = async () => {
    if (!salonInfo) return
    
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/admin/salon-info', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(salonInfo)
      })
      
      if (!response.ok) throw new Error('Failed to save salon info')
      
      showToast('Salon information saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving salon info:', error)
      showToast('Failed to save salon information', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (!salonInfo) return
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setSalonInfo(prev => ({
        ...prev!,
        [parent]: {
          ...prev![parent as keyof SalonInfo] as Record<string, string>,
          [child]: value
        }
      }))
    } else {
      setSalonInfo(prev => ({
        ...prev!,
        [field]: value
      }))
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading salon information...</p>
        </div>
      </div>
    )
  }

  if (!salonInfo) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-400">No salon information available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Salon Information</h1>
        <p className="text-gray-600 mt-1">Manage your salon&apos;s business details</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Basic Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salon Name</label>
            <input
              type="text"
              value={salonInfo.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={salonInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={salonInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={salonInfo.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={salonInfo.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
          />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              value={salonInfo.address.street}
              onChange={(e) => handleInputChange('address.street', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={salonInfo.address.city}
              onChange={(e) => handleInputChange('address.city', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={salonInfo.address.state}
              onChange={(e) => handleInputChange('address.state', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              type="text"
              value={salonInfo.address.zipCode}
              onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={salonInfo.address.country}
              onChange={(e) => handleInputChange('address.country', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center bg-secondary-500 text-white px-6 py-2 rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
} 