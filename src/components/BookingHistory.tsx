'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, Phone, Mail, Edit, XCircle, CheckCircle, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

interface Booking {
  _id: string
  serviceId: {
    _id: string
    name: string
    description: string
    duration: string
    price: string
  }
  serviceName: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'postponed'
  createdAt: string
}

interface BookingHistoryProps {
  visible: boolean
  onClose: () => void
}

export default function BookingHistory({ visible, onClose }: BookingHistoryProps) {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [rescheduleModal, setRescheduleModal] = useState<{ visible: boolean; booking: Booking | null }>({
    visible: false,
    booking: null
  })
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (visible && token && user?.type === 'customer') {
      fetchBookings()
    }
  }, [visible, token, user])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/auth/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      } else {
        showToast('Failed to fetch bookings', 'error')
      }
    } catch (error) {
      showToast('Network error while fetching bookings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async (date: string, serviceId: string) => {
    setLoadingSlots(true)
    try {
      const response = await fetch(`/api/bookings/available-slots?date=${date}&serviceId=${serviceId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      } else {
        setAvailableSlots([])
      }
    } catch (error) {
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const response = await fetch(`/api/auth/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'cancel' })
      })

      if (response.ok) {
        showToast('Booking cancelled successfully', 'success')
        fetchBookings() // Refresh the list
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to cancel booking', 'error')
      }
    } catch (error) {
      showToast('Network error while cancelling booking', 'error')
    }
  }

  const handleRescheduleBooking = async () => {
    if (!rescheduleModal.booking || !newDate || !newTime) {
      showToast('Please select a new date and time', 'error')
      return
    }

    try {
      const response = await fetch(`/api/auth/bookings/${rescheduleModal.booking._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'reschedule',
          newDate,
          newTime
        })
      })

      if (response.ok) {
        showToast('Booking rescheduled successfully', 'success')
        setRescheduleModal({ visible: false, booking: null })
        setNewDate('')
        setNewTime('')
        fetchBookings() // Refresh the list
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to reschedule booking', 'error')
      }
    } catch (error) {
      showToast('Network error while rescheduling booking', 'error')
    }
  }

  const openRescheduleModal = (booking: Booking) => {
    setRescheduleModal({ visible: true, booking })
    setNewDate('')
    setNewTime('')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'postponed':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'postponed':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  if (!visible) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="font-heading text-xl font-semibold flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              My Bookings
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h4>
                <p className="text-gray-600">You haven't made any bookings yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{booking.serviceName}</h4>
                        <p className="text-sm text-gray-600">{booking.serviceId?.price} • {booking.serviceId?.duration}</p>
                      </div>
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {booking.time}
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{booking.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {booking.status !== 'cancelled' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openRescheduleModal(booking)}
                          className="flex items-center px-3 py-1 text-sm text-secondary-600 hover:text-secondary-700 border border-secondary-300 rounded hover:bg-secondary-50"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal.visible && rescheduleModal.booking && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="font-heading text-lg font-semibold">Reschedule Booking</h3>
              <button
                onClick={() => setRescheduleModal({ visible: false, booking: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value)
                    if (e.target.value && rescheduleModal.booking) {
                      fetchAvailableSlots(e.target.value, rescheduleModal.booking.serviceId._id)
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                {loadingSlots ? (
                  <div className="text-center py-2 text-gray-500">Loading available slots...</div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setNewTime(slot)}
                        className={`py-2 px-3 text-sm rounded border ${
                          newTime === slot
                            ? 'bg-secondary-500 text-white border-secondary-500'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : newDate ? (
                  <div className="text-center py-2 text-gray-500">No available slots for this date</div>
                ) : (
                  <div className="text-center py-2 text-gray-500">Select a date first</div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setRescheduleModal({ visible: false, booking: null })}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleBooking}
                  disabled={!newDate || !newTime}
                  className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50"
                >
                  Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 