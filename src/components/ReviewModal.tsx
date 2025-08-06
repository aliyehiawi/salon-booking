'use client'

import { useState } from 'react'
import { X, Star, MessageSquare, ThumbsUp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

interface ReviewModalProps {
  visible: boolean
  onClose: () => void
  bookingId: string
  serviceName: string
  serviceId: string
}

export default function ReviewModal({ visible, onClose, bookingId, serviceName, serviceId }: ReviewModalProps) {
  const { token } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  if (!visible) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      showToast('Please select a rating', 'error')
      return
    }

    if (!title.trim()) {
      showToast('Please enter a review title', 'error')
      return
    }

    if (!comment.trim()) {
      showToast('Please enter a review comment', 'error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          rating,
          title: title.trim(),
          comment: comment.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        showToast('Review submitted successfully!', 'success')
        onClose()
        // Reset form
        setRating(0)
        setTitle('')
        setComment('')
      } else {
        showToast(data.error || 'Failed to submit review', 'error')
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      // Reset form
      setRating(0)
      setTitle('')
      setComment('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="font-heading text-xl font-semibold flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Write a Review
          </h3>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Service</h4>
            <p className="text-gray-600">{serviceName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Your Rating *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl focus:outline-none"
                    disabled={loading}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
                placeholder="Brief summary of your experience"
                maxLength={100}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
                placeholder="Share your experience with this service..."
                maxLength={1000}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 characters</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0 || !title.trim() || !comment.trim()}
                className="px-6 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 