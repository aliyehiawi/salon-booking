'use client'

import { useState } from 'react'
import { X, User, Mail, Phone, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

interface CustomerProfileProps {
  visible: boolean
  onClose: () => void
}

export default function CustomerProfile({ visible, onClose }: CustomerProfileProps) {
  const { user, logout, updateProfile } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)

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

      const updateData: any = {
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
        setEditing(false)
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
    } catch (error) {
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

        {/* Content */}
        <div className="p-6">
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
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Change Password</h4>
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
        </div>
      </div>
    </div>
  )
} 