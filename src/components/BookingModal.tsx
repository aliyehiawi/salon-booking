'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import clsx from 'classnames'

const steps = ['Service', 'Date & Time', 'Your Info', 'Confirm']

export default function BookingModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(1)

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
            <div className="p-6 text-gray-700">
              <p className="text-center text-lg text-gray-400">
                Step {step}: {step === 1 && (
                  <div>
                    <h4 className="font-heading text-lg font-semibold mb-4">
                      Select a Service
                    </h4>
                    <div className="space-y-4">
                      {[
                        { id: 'haircut', label: 'Haircut & Style', duration: '60 min', price: '$65' },
                        { id: 'color', label: 'Full Color', duration: '120 min', price: '$120' },
                        { id: 'treatment', label: 'Hair Treatment', duration: '45 min', price: '$55' },
                        { id: 'balayage', label: 'Balayage', duration: '180 min', price: '$200' },
                      ].map((service) => (
                        <label
                          key={service.id}
                          className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-secondary-300 transition-colors duration-200"
                        >
                          <input
                            type="radio"
                            name="service"
                            value={service.id}
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

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setStep(2)}
                        className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
