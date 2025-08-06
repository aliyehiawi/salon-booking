'use client'

import { useState, useEffect } from 'react'
import { X, User, Mail, Phone, Settings, LogOut, Star, Award, Crown, Gift } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

interface CustomerProfileProps {
  visible: boolean
  onClose: () => void
}

interface LoyaltyData {
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
  activeDiscounts: Array<{
    code: string
    discountType: string
    value: number
    expiresAt: string
    isUsed: boolean
  }>
}

const tierInfo = {
  bronze: { name: 'Bronze', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: '🥉' },
  silver: { name: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-50', icon: '🥈' },
  gold: { name: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: '🥇' },
  platinum: { name: 'Platinum', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: '💎' },
  diamond: { name: 'Diamond', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: '👑' }
}

export default function CustomerProfile({ visible, onClose }: CustomerProfileProps) {
  const { user, logout, updateProfile } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [loadingLoyalty, setLoadingLoyalty] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'loyalty'>('profile')

  const [formData, setFormData] = useState({
    name: user?.type === 'customer' ? user.name || '' : '',
    phone: user?.type === 'customer' ? user.phone || '' : '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    preferences: {
      notifications: user?.type === 'customer' ? user.preferences?.notifications ?? true : true,
      marketing: user?.type === 'customer' ? user.preferences?.marketing ?? false : false
    }
  })

  // Fetch loyalty data when component mounts
  useEffect(() => {
    if (visible && user?.type === 'customer') {
      fetchLoyaltyData()
    }
  }, [visible, user])

  const fetchLoyaltyData = async () => {
    setLoadingLoyalty(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/auth/loyalty', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLoyaltyData(data)
      } else {
        showToast('Failed to load loyalty data', 'error')
      }
    } catch {
      showToast('Failed to load loyalty data', 'error')
    } finally {
      setLoadingLoyalty(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate password change
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        showToast('New passwords do not match', 'error')
        return
      }

      if (formData.newPassword && formData.newPassword.length < 6) {
        showToast('New password must be at least 6 characters', 'error')
        return
      }

      const updateData: {
        name: string
        phone: string
        preferences: { notifications: boolean; marketing: boolean }
        currentPassword?: string
        newPassword?: string
      } = {
        name: formData.name,
        phone: formData.phone,
        preferences: formData.preferences
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const result = await updateProfile(updateData)

      if (result.success) {
        showToast('Profile updated successfully!', 'success')
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        showToast(result.error || 'Failed to update profile', 'error')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    onClose()
    showToast('Successfully logged out', 'success')
  }

  if (!visible || !user || user.type !== 'customer') return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="font-heading text-xl font-semibold flex items-center">
            <User className="w-5 h-5 mr-2" />
            My Profile
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'loyalty'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Loyalty & Rewards
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        value={user.email}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Change Password</h4>
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="text-secondary-600 hover:text-secondary-700 text-sm font-medium"
                  >
                    {showPasswordFields ? 'Cancel' : 'Change Password'}
                  </button>
                </div>
                
                {showPasswordFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
                        placeholder="Enter new password"
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Preferences */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Preferences
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferences.notifications}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, notifications: e.target.checked }
                      }))}
                      className="h-4 w-4 text-secondary-500 focus:ring-secondary-300 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Receive booking notifications</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferences.marketing}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, marketing: e.target.checked }
                      }))}
                      className="h-4 w-4 text-secondary-500 focus:ring-secondary-300 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Receive marketing emails</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center text-red-600 hover:text-red-700 font-medium"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {loadingLoyalty ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading loyalty data...</p>
                </div>
              ) : loyaltyData ? (
                <>
                  {/* Loyalty Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Points */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Loyalty Points</p>
                          <p className="text-3xl font-bold text-blue-900">{loyaltyData.points.toLocaleString()}</p>
                        </div>
                        <Star className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">Earn 1 point per $1 spent</p>
                    </div>

                    {/* Tier */}
                    <div className={`bg-gradient-to-br ${tierInfo[loyaltyData.tier].bgColor} p-6 rounded-lg`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Current Tier</p>
                          <p className={`text-3xl font-bold ${tierInfo[loyaltyData.tier].color}`}>
                            {tierInfo[loyaltyData.tier].name}
                          </p>
                        </div>
                        <span className="text-3xl">{tierInfo[loyaltyData.tier].icon}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Unlock exclusive benefits</p>
                    </div>

                    {/* Total Spent */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Total Spent</p>
                          <p className="text-3xl font-bold text-green-900">
                            ${loyaltyData.totalSpent.toLocaleString()}
                          </p>
                        </div>
                        <Crown className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">{loyaltyData.totalBookings} bookings</p>
                    </div>
                  </div>

                  {/* Badges */}
                  {loyaltyData.badges.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Award className="w-4 h-4 mr-2" />
                        Badges Earned
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loyaltyData.badges.map((badge, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{badge.icon}</span>
                              <div>
                                <p className="font-medium text-gray-900">{badge.name}</p>
                                <p className="text-sm text-gray-600">{badge.description}</p>
                                <p className="text-xs text-gray-500">
                                  Earned {new Date(badge.earnedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones */}
                  {loyaltyData.milestones.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Gift className="w-4 h-4 mr-2" />
                        Milestones & Rewards
                      </h4>
                      <div className="space-y-3">
                        {loyaltyData.milestones.map((milestone, index) => (
                          <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-yellow-900">{milestone.name}</p>
                                <p className="text-sm text-yellow-700">
                                  {milestone.reward === 'points' 
                                    ? `${milestone.rewardValue} points` 
                                    : `${milestone.rewardValue}% discount`
                                  }
                                </p>
                                <p className="text-xs text-yellow-600">
                                  Achieved {new Date(milestone.achievedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                {milestone.isRedeemed ? (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    Redeemed
                                  </span>
                                ) : (
                                  <button className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full hover:bg-yellow-200">
                                    Redeem
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Discounts */}
                  {loyaltyData.activeDiscounts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Active Discounts</h4>
                      <div className="space-y-3">
                        {loyaltyData.activeDiscounts.map((discount, index) => (
                          <div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-purple-900">Code: {discount.code}</p>
                                <p className="text-sm text-purple-700">
                                  {discount.discountType === 'percentage' 
                                    ? `${discount.value}% off` 
                                    : `$${discount.value} off`
                                  }
                                </p>
                                <p className="text-xs text-purple-600">
                                  Expires {new Date(discount.expiresAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                {discount.isUsed ? (
                                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                    Used
                                  </span>
                                ) : (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                    Available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* How to Earn Points */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">How to Earn Points</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Make Bookings</p>
                          <p className="text-gray-600">Earn 1 point for every $1 spent</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Reach Milestones</p>
                          <p className="text-gray-600">Get bonus points for booking milestones</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Tier Upgrades</p>
                          <p className="text-gray-600">Higher tiers earn more points per dollar</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">4</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Redeem Points</p>
                          <p className="text-gray-600">Use points for discounts on future bookings</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Loyalty Data</h4>
                  <p className="text-gray-600">Start booking to earn loyalty points and rewards!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 