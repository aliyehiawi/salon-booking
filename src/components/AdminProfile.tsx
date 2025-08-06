'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { X, Shield, Mail, Save, Eye, EyeOff, Settings, LogOut } from 'lucide-react'

interface AdminProfileProps {
  visible: boolean
  onClose: () => void
}

export default function AdminProfile({ visible, onClose }: AdminProfileProps) {
  const { user, token, logout } = useAuth()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  if (!visible || !user || user.type !== 'admin') return null

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

      if (formData.newPassword) {
        const response = await fetch('/api/admin/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword
          })
        })

        const data = await response.json()

        if (response.ok) {
          showToast('Password changed successfully', 'success')
          // Reset password fields
          setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
          setShowPasswordFields(false)
        } else {
          showToast(data.error || 'Failed to change password', 'error')
        }
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="font-heading text-xl font-semibold flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Admin Profile
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
              <h4 className="font-medium text-gray-900 mb-4">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value="Administrator"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Salon Management Access</p>
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

            {/* Admin Features */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Admin Features
              </h4>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-600 mr-3" />
                  <span className="text-sm text-blue-700">Full salon management access</span>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <Settings className="w-4 h-4 text-green-600 mr-3" />
                  <span className="text-sm text-green-700">Manage services, bookings, and customers</span>
                </div>
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <Mail className="w-4 h-4 text-purple-600 mr-3" />
                  <span className="text-sm text-purple-700">Access to admin dashboard and reports</span>
                </div>
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
                disabled={loading || (!showPasswordFields || !formData.newPassword)}
                className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
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