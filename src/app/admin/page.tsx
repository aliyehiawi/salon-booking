'use client'

import { useEffect, useState } from 'react'
import Toast from '@/components/Toast'
import { useToast } from '@/context/ToastContext'
const { showToast } = useToast()

type Booking = {
    _id: string
    name: string
    email: string
    phone: string
    service: string
    date: string
    time: string
    status: string
}

export default function AdminPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('all')
    const [authenticated, setAuthenticated] = useState(false)
    const [postponeTarget, setPostponeTarget] = useState<Booking | null>(null)

    useEffect(() => {
        const pass = prompt('Enter admin password:')
        if (pass === 'bliss123') {
            setAuthenticated(true)
        }
    }, [])

    useEffect(() => {
        if (!authenticated) return

        const fetchBookings = async () => {
            try {
                const res = await fetch('http://localhost:4000/api/bookings')
                const data = await res.json()
                if (Array.isArray(data)) {
                    setBookings(data.reverse())
                } else {
                    console.error('Unexpected response:', data)
                }
            } catch (err) {
                console.error('Error fetching bookings:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchBookings()
    }, [authenticated])

    const updateStatus = async (id: string, status: string, newDate?: string) => {
        const res = await fetch(`http://localhost:4000/api/bookings/${id}/status/${status}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: newDate }),
        })

        const updated = await res.json()

        setBookings((prev) =>
            prev.map((b) => (b._id === id ? updated : b))
        )

        showToast(`✅ Booking ${status}`, 'success')
    }

    if (!authenticated) return <main className="p-8">🔒 Access denied</main>

    return (
        <main className="min-h-screen bg-primary-50 p-8">
            <h1 className="font-heading text-2xl font-bold mb-6">Admin Dashboard</h1>

            <div className="mb-6 flex flex-wrap items-center gap-4 justify-between">
                <div>
                    <label className="text-sm text-gray-700 mr-2">Filter:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="postponed">Postponed</option>
                    </select>
                </div>

                <button
                    onClick={() => {
                        const header = 'Client,Service,Date,Time,Status\n'
                        const rows = bookings
                            .map(b => `${b.name},${b.service},${b.date},${b.time},${b.status}`)
                            .join('\n')

                        const blob = new Blob([header + rows], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'bookings.csv'
                        a.click()
                        URL.revokeObjectURL(url)
                    }}
                    className="bg-secondary-500 text-white px-4 py-2 rounded text-sm"
                >
                    Export CSV
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading bookings...</p>
            ) : bookings.length === 0 ? (
                <p className="text-gray-400">No bookings yet.</p>
            ) : (
                <div className="overflow-x-auto bg-white shadow rounded-lg">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-primary-100 text-primary-800">
                            <tr>
                                <th className="p-4">Client</th>
                                <th className="p-4">Service</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings
                                .filter((b) => filterStatus === 'all' || b.status === filterStatus)
                                .map((b) => (
                                    <tr key={b._id} className="border-b">
                                        <td className="p-4">{b.name}</td>
                                        <td className="p-4">{b.service}</td>
                                        <td className="p-4">{b.date}</td>
                                        <td className="p-4">{b.time}</td>
                                        <td className="p-4">
                                            <span
                                                className={
                                                    b.status === 'cancelled'
                                                        ? 'text-red-500'
                                                        : b.status === 'confirmed'
                                                            ? 'text-green-600'
                                                            : b.status === 'postponed'
                                                                ? 'text-yellow-600'
                                                                : 'text-gray-600'
                                                }
                                            >
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="p-4 space-x-2">
                                            {b.status !== 'confirmed' && (
                                                <button
                                                    onClick={() => updateStatus(b._id, 'confirmed')}
                                                    className="text-green-600 hover:underline text-sm"
                                                >
                                                    Confirm
                                                </button>
                                            )}
                                            {b.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => updateStatus(b._id, 'cancelled')}
                                                    className="text-red-500 hover:underline text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            {b.status !== 'postponed' && (
                                                <button
                                                    onClick={() => setPostponeTarget(b)}
                                                    className="text-yellow-600 hover:underline text-sm"
                                                >
                                                    Postpone
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Postpone Date Input Overlay */}
            {postponeTarget && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-lg font-semibold mb-4">New date for {postponeTarget.name}</h2>
                        <input
                            type="date"
                            defaultValue={postponeTarget.date}
                            className="w-full border rounded px-4 py-2 mb-4"
                            onChange={(e) => setPostponeTarget({ ...postponeTarget, date: e.target.value })}
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 text-sm bg-gray-200 rounded"
                                onClick={() => setPostponeTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-sm bg-yellow-500 text-white rounded"
                                onClick={() => {
                                    updateStatus(postponeTarget._id, 'postponed', postponeTarget.date)
                                    setPostponeTarget(null)
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
