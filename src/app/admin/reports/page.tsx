'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/context/ToastContext'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star, 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'

interface ReportData {
  summary?: any
  dailyRevenue?: any[]
  paymentMethods?: any
  topCustomers?: any[]
  growth?: any
}

export default function AdminReportsPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('financial')
  const [reportData, setReportData] = useState<ReportData>({})
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const reportTypes = [
    { id: 'financial', name: 'Financial', icon: DollarSign, color: 'text-green-600' },
    { id: 'bookings', name: 'Bookings', icon: Calendar, color: 'text-blue-600' },
    { id: 'customers', name: 'Customers', icon: Users, color: 'text-purple-600' },
    { id: 'reviews', name: 'Reviews', icon: Star, color: 'text-yellow-600' },
    { id: 'performance', name: 'Performance', icon: TrendingUp, color: 'text-indigo-600' }
  ]

  useEffect(() => {
    fetchReport()
  }, [reportType, dateRange])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(
        `/api/admin/reports?type=${reportType}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      if (!response.ok) throw new Error('Failed to fetch report data')
      
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      showToast('Failed to load report data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'csv') => {
    try {
      showToast(`Exporting ${format.toUpperCase()} report...`, 'info')
      // Implementation for export functionality
    } catch (error) {
      showToast('Failed to export report', 'error')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const renderFinancialReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.summary?.totalRevenue || 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(reportData.summary?.confirmedRevenue || 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-purple-600">
                {reportData.summary?.totalBookings || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Booking Value</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(reportData.summary?.averageBookingValue || 0)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {reportData.dailyRevenue && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Daily Revenue Trend</h3>
          <div className="space-y-2">
            {reportData.dailyRevenue.map((day: any) => (
              <div key={day.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">{day.date}</span>
                <div className="flex items-center space-x-4">
                  <span>{day.bookings} bookings</span>
                  <span className="font-semibold text-green-600">{formatCurrency(day.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Reports</h1>
          <p className="text-gray-600">Comprehensive business analytics and insights</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </button>
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {reportTypes.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === type.id
                  ? 'border-secondary-500 bg-secondary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Icon className={`w-6 h-6 ${type.color}`} />
                <span className="text-sm font-medium text-gray-700">{type.name}</span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      ) : (
        renderFinancialReport()
      )}
    </div>
  )
} 