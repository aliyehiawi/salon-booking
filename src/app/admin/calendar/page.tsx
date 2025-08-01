'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

interface Booking {
  _id: string
  name: string
  email: string
  phone: string
  serviceName: string
  date: string
  time: string
  status: string
  price: string
}

export default function AdminCalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([])
  const { showToast } = useToast()

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!response.ok) throw new Error('Failed to fetch bookings')
        
        const data = await response.json()
        setBookings(data)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        showToast('Failed to load bookings', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [showToast])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date)
      return isSameDay(bookingDate, date)
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedBookings(getBookingsForDate(date))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar View</h1>
        <p className="text-gray-600 mt-1">View all appointments in calendar format</p>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {monthDays.map((day, index) => {
            const dayBookings = getBookingsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`
                  min-h-[100px] p-2 border border-gray-200 cursor-pointer transition-colors
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                  ${isSelected ? 'bg-secondary-50 border-secondary-300' : ''}
                  hover:bg-gray-50
                `}
              >
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map(booking => (
                    <div
                      key={booking._id}
                      className={`
                        text-xs p-1 rounded truncate ${getStatusColor(booking.status)}
                      `}
                      title={`${booking.name} - ${booking.serviceName} at ${booking.time}`}
                    >
                      {booking.time} - {booking.name}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Bookings */}
      {selectedDate && selectedBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Appointments for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <div className="space-y-4">
            {selectedBookings.map(booking => (
              <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{booking.name}</h4>
                    <p className="text-sm text-gray-600">{booking.serviceName}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {booking.time}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(new Date(booking.date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {booking.email}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {booking.phone}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-green-600">{booking.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedBookings.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Appointments for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <p className="text-gray-500">No appointments scheduled for this date.</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Status Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  )
} 