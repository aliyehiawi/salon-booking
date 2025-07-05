'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import clsx from 'classnames'

const steps = ['Service', 'Date & Time', 'Your Info', 'Confirm']

export default function BookingModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(1)

  const [booking, setBooking] = useState({
    service: '',
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
  })

  const services = [
    { id: 'haircut', label: 'Haircut & Style', duration: '60 min', price: '$65' },
    { id: 'color', label: 'Full Color', duration: '120 min', price: '$120' },
    { id: 'treatment', label: 'Hair Treatment', duration: '45 min', price: '$55' },
    { id: 'balayage', label: 'Balayage', duration: '180 min', price: '$200' },
  ]

  return (
    <>
      <button
        className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-full font-medium transition-colors duration-200"
        onClick={() => setVisible(true)}
      >
        Book Now
      </button>

      {visible && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="font-heading text-xl font-semibold">
                Book Your Appointment
              </h3>
              <button onClick={() => setVisible(false)}>
                <X className="text-gray-500 hover:text-gray-700 w-6 h-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between max-w-md mx-auto">
                {steps.map((label, i) => (
                  <div key={label} className="relative text-center flex-1">
                    <div
                      className={clsx(
                        'w-8 h-8 mx-auto rounded-full flex items-center justify-center font-medium',
                        step > i ? 'bg-secondary-500 text-white' : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {i + 1}
                    </div>
                    <p className="text-xs mt-1">{label}</p>
                    {i < steps.length - 1 && (
                      <div
                        className={clsx(
                          'absolute top-1/2 left-full w-8 h-0.5',
                          step > i + 1 ? 'bg-secondary-500' : 'bg-gray-300'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 text-gray-700 space-y-6">
              {step === 1 && (
                <>
                  <h4 className="font-heading text-lg font-semibold">Select a Service</h4>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className={clsx(
                          'flex items-center p-4 border rounded-lg cursor-pointer hover:border-secondary-300 transition-colors duration-200',
                          booking.service === service.id && 'border-secondary-400'
                        )}
                      >
                        <input
                          type="radio"
                          name="service"
                          value={service.id}
                          checked={booking.service === service.id}
                          onChange={(e) =>
                            setBooking({ ...booking, service: e.target.value })
                          }
                          className="h-5 w-5 text-secondary-500 focus:ring-secondary-300"
                        />
                        <div className="ml-3">
                          <span className="block font-medium">{service.label}</span>
                          <span className="block text-sm text-gray-500">
                            {service.duration} • {service.price}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button
                      disabled={!booking.service}
                      onClick={() => setStep(2)}
                      className="mt-6 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h4 className="font-heading text-lg font-semibold">Select Date & Time</h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      value={booking.date}
                      onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-secondary-300 focus:border-secondary-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <select
                      value={booking.time}
                      onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-secondary-300 focus:border-secondary-300"
                    >
                      <option value="">Select a time</option>
                      <option>10:00 AM</option>
                      <option>11:00 AM</option>
                      <option>12:00 PM</option>
                      <option>1:00 PM</option>
                    </select>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="text-secondary-500 hover:text-secondary-700 font-medium"
                    >
                      ← Back
                    </button>
                    <button
                      disabled={!booking.date || !booking.time}
                      onClick={() => setStep(3)}
                      className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h4 className="font-heading text-lg font-semibold">Your Information</h4>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={booking.name}
                      onChange={(e) => setBooking({ ...booking, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={booking.email}
                      onChange={(e) => setBooking({ ...booking, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={booking.phone}
                      onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <textarea
                      placeholder="Special Requests (Optional)"
                      value={booking.notes}
                      onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="text-secondary-500 hover:text-secondary-700 font-medium"
                    >
                      ← Back
                    </button>
                    <button
                      disabled={!booking.name || !booking.email || !booking.phone}
                      onClick={() => setStep(4)}
                      className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h4 className="font-heading text-lg font-semibold mb-4">Confirm Details</h4>
                  <div className="bg-primary-50 p-4 rounded-lg space-y-2">
                    <p><strong>Service:</strong> {booking.service}</p>
                    <p><strong>Date:</strong> {booking.date}</p>
                    <p><strong>Time:</strong> {booking.time}</p>
                    <p><strong>Name:</strong> {booking.name}</p>
                    <p><strong>Email:</strong> {booking.email}</p>
                    <p><strong>Phone:</strong> {booking.phone}</p>
                    {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <input type="checkbox" id="agree" className="h-4 w-4" />
                    <label htmlFor="agree" className="text-sm text-gray-600">
                      I agree to the Terms and Cancellation Policy
                    </label>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setStep(3)}
                      className="text-secondary-500 hover:text-secondary-700 font-medium"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => {
                        alert('✅ Booking submitted!')
                        setVisible(false)
                        setStep(1)
                        setBooking({
                          service: '',
                          date: '',
                          time: '',
                          name: '',
                          email: '',
                          phone: '',
                          notes: '',
                        })
                      }}
                      className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
