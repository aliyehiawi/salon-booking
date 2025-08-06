'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { 
  Crown, 
  Star, 
  Trophy,
  Users,
  Award
} from 'lucide-react'

interface CustomerLoyalty {
  _id: string
  customerId: {
    _id: string
    name: string
    email: string
  }
  points: number
  totalSpent: number
  totalBookings: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  badges: Array<{
    name: string
    description: string
    icon: string
    earnedAt: string
    category: string
  }>
  milestones: Array<{
    name: string
    type: string
    threshold: number
    reward: string
    rewardValue: number
    achievedAt: string
    isRedeemed: boolean
  }>
}

const tierColors = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-100 text-gray-800',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-blue-100 text-blue-800',
  diamond: 'bg-purple-100 text-purple-800'
}

const tierIcons = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑'
}

export default function AdminLoyaltyPage() {
  const [loyaltyData, setLoyaltyData] = useState<CustomerLoyalty[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/loyalty', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!response.ok) throw new Error('Failed to fetch loyalty data')
        
        const data = await response.json()
        setLoyaltyData(data)
      } catch (error) {
        console.error('Error fetching loyalty data:', error)
        showToast('Failed to load loyalty data', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchLoyaltyData()
  }, [showToast])

  const getTierStats = () => {
    const stats = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0
    }
    
    loyaltyData.forEach(customer => {
      stats[customer.tier]++
    })
    
    return stats
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading loyalty data...</p>
        </div>
      </div>
    )
  }

  const tierStats = getTierStats()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Loyalty</h1>
        <p className="text-gray-600 mt-1">Manage customer tiers, badges, and loyalty programs</p>
      </div>

      {/* Tier Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(tierStats).map(([tier, count]) => (
          <div key={tier} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 capitalize">{tier}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
              <div className="text-2xl">{tierIcons[tier as keyof typeof tierIcons]}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Loyalty Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Badges
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loyaltyData.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.customerId.name}</div>
                      <div className="text-sm text-gray-500">{customer.customerId.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{tierIcons[customer.tier]}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${tierColors[customer.tier]}`}>
                        {customer.tier}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.points.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      ${customer.totalSpent.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.totalBookings}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {customer.badges.slice(0, 3).map((badge, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          title={badge.description}
                        >
                          {badge.icon} {badge.name}
                        </span>
                      ))}
                      {customer.badges.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{customer.badges.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loyaltyData.length === 0 && (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No loyalty data found. Customer loyalty will be tracked automatically.</p>
          </div>
        )}
      </div>

      {/* Loyalty Program Info */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Loyalty Program Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Tier Requirements</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>🥉 Bronze</span>
                <span>0+ bookings, $0+ spent</span>
              </div>
              <div className="flex justify-between">
                <span>🥈 Silver</span>
                <span>5+ bookings, $200+ spent</span>
              </div>
              <div className="flex justify-between">
                <span>🥇 Gold</span>
                <span>15+ bookings, $500+ spent</span>
              </div>
              <div className="flex justify-between">
                <span>💎 Platinum</span>
                <span>30+ bookings, $1000+ spent</span>
              </div>
              <div className="flex justify-between">
                <span>👑 Diamond</span>
                <span>50+ bookings, $2000+ spent</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Available Badges</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="mr-2">🎉</span>
                <span>First Timer - Completed first booking</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">⭐</span>
                <span>Regular - Completed 5 bookings</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">💎</span>
                <span>Loyal - Completed 10 bookings</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">💰</span>
                <span>Big Spender - Spent over $500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 