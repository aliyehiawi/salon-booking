'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react'

type Service = {
  _id?: string
  name: string
  description: string
  duration: string
  price: string
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<Omit<Service, '_id'>>({
    name: '',
    description: '',
    duration: '60 min',
    price: '$0',
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const { showToast } = useToast()

  const getToken = () => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('adminToken')
      : null
    if (!token) {
      throw new Error('Missing token')
    }
    return token
  }

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const token = getToken()
        const res = await fetch('/api/admin/services', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Fetch failed')
        setServices(await res.json())
      } catch {
        showToast('⚠️ Failed to load services', 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [showToast])

  const openNew = () => {
    setEditingId(null)
    setForm({ name: '', description: '', duration: '60 min', price: '$0', })
    setModalOpen(true)
  }

  const openEdit = (svc: Service) => {
    setEditingId(svc._id!)                
    setForm({ name: svc.name, description: svc.description, duration: svc.duration, price: svc.price, })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      setServices(s => s.filter(x => x._id !== id))
      showToast('Service deleted', 'success')
    } catch {
      showToast('Delete failed', 'error')
    }
  }

  const handleSubmit = async () => {
    try {
      const token = getToken()
      const url = editingId
        ? `/api/admin/services/${editingId}`
        : '/api/admin/services'
      const method = editingId ? 'PATCH' : 'POST'

      const payload = { ...form }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Save failed')
      }
      const saved = await res.json()
      if (editingId) {
        setServices(s => s.map(x => x._id === editingId ? saved : x))
        showToast('Service updated', 'success')
      } else {
        setServices(s => [saved, ...s])
        showToast('Service created', 'success')
      }
      setModalOpen(false)
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage salon services and pricing</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No services found. Create your first service to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(svc => (
            <div key={svc._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{svc.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEdit(svc)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(svc._id!)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{svc.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {svc.duration}
                </div>
                <div className="flex items-center font-semibold text-secondary-600">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {svc.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="font-semibold text-lg text-gray-900">
                {editingId ? 'Edit Service' : 'New Service'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-secondary-300 focus:border-secondary-300"
                  placeholder="e.g., Haircut & Style"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-secondary-300 focus:border-secondary-300"
                  placeholder="Describe the service..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-secondary-300 focus:border-secondary-300"
                    placeholder="e.g., 60 min"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-secondary-300 focus:border-secondary-300"
                    placeholder="e.g., $65"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600"
              >
                {editingId ? 'Update' : 'Create'} Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
