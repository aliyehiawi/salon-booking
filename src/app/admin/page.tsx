'use client'

import { useEffect, useState } from 'react'
import ReactDatePicker from 'react-datepicker'
import { ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react'
import { format } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'
import { useToast } from '@/context/ToastContext'

type Booking = {
  _id: string
  name: string
  serviceName: string
  date: string    // "YYYY-MM-DD"
  time: string
  email: string
  phone: string
  status: string
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState<Date | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const { showToast } = useToast()

  // Load bookings
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('authToken')
        const res = await fetch('/api/admin/bookings', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (Array.isArray(data)) setBookings(data)
      } catch (err) {
        console.error('Error fetching bookings:', err)
        showToast('Failed to load bookings', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [showToast])

  // Format a Date as YYYY-MM-DD
  const toYYYYMMDD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Filter bookings by date and status
  const filtered = bookings.filter(b => {
    const dateMatch = !filterDate || b.date === toYYYYMMDD(filterDate)
    const statusMatch = filterStatus === 'all' || b.status === filterStatus
    return dateMatch && statusMatch
  })

  // Export CSV of filtered bookings
  const exportCSV = () => {
    const header = 'Client,Service,Date,Time,Email,Phone,Status\n'
    const rows = filtered
      .map(b => `${b.name},${b.serviceName},${b.date},${b.time},${b.email},${b.phone},${b.status}`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV exported successfully', 'success')
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!res.ok) throw new Error('Failed to update status')
      
      setBookings(prev => prev.map(b => 
        b._id === bookingId ? { ...b, status: newStatus } : b
      ))
      showToast('Status updated successfully', 'success')
    } catch (error) {
      showToast('Failed to update status', 'error')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage and view all salon bookings</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">Filters:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Date:</label>
          <ReactDatePicker
            selected={filterDate}
            onChange={date => setFilterDate(date)}
            placeholderText="All dates"
            dateFormat="yyyy-MM-dd"
            isClearable
            className="px-3 py-1 border rounded-md text-sm focus:ring-secondary-300 focus:border-secondary-300"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm focus:ring-secondary-300 focus:border-secondary-300"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
          <div className="text-sm text-blue-600">Total Bookings</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => b.status === 'pending').length}
          </div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'confirmed').length}
          </div>
          <div className="text-sm text-green-600">Confirmed</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {bookings.filter(b => b.status === 'cancelled').length}
          </div>
          <div className="text-sm text-red-600">Cancelled</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading bookings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No bookings found for the selected filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Service</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Time</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(b => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{b.name}</div>
                  </td>
                  <td className="p-4 text-gray-700">{b.serviceName}</td>
                  <td className="p-4 text-gray-700">{b.date}</td>
                  <td className="p-4 text-gray-700">{b.time}</td>
                  <td className="p-4">
                    <div className="text-gray-700">{b.email}</div>
                    <div className="text-sm text-gray-500">{b.phone}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      b.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={b.status}
                      onChange={(e) => updateBookingStatus(b._id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 focus:ring-secondary-300 focus:border-secondary-300"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="postponed">Postponed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
