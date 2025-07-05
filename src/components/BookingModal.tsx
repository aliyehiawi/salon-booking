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
                Step {step}: UI content will go here.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
