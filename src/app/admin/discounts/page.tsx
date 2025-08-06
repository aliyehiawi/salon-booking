'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { Plus, Tag } from 'lucide-react'

interface Discount {
  _id?: string
  code: string
  name: string
  type: 'percentage' | 'fixed' | 'free_service'
  value: number
  isActive: boolean
  usedCount: number
  usageLimit: number | null
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/discounts', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!response.ok) throw new Error('Failed to fetch discounts')
        
        const data = await response.json()
        setDiscounts(data)
      } catch (error) {
        console.error('Error fetching discounts:', error)
        showToast('Failed to load discounts', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchDiscounts()
  }, [showToast])

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading discounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Discount Management</h1>
        <p className="text-gray-600 mt-1">Manage discount codes and loyalty programs</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          {discounts.length} discount code{discounts.length !== 1 ? 's' : ''}
        </div>
        <button className="flex items-center bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Add Discount
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discounts.map((discount) => (
                <tr key={discount._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {discount.code}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      discount.type === 'percentage' ? 'bg-blue-100 text-blue-800' :
                      discount.type === 'fixed' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {discount.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {discount.type === 'percentage' ? `${discount.value}%` :
                       discount.type === 'fixed' ? `$${discount.value}` :
                       'Free Service'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {discount.usedCount} / {discount.usageLimit || '∞'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      discount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {discount.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {discounts.length === 0 && (
          <div className="text-center py-8">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No discount codes found. Create your first discount to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
} 