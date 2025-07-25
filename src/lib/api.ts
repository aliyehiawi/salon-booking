// src/lib/api.ts
export async function submitBooking(data: any) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.message || 'Failed to submit booking')
  }

  return res.json()
}

export async function getServices() {
  const res = await fetch('/api/services')
  if (!res.ok) {
    throw new Error('Failed to fetch services')
  }
  return res.json()
}

export async function getAvailableSlots(date: string, serviceId: string) {
  const res = await fetch(`/api/bookings/available-slots?date=${date}&serviceId=${serviceId}`)
  if (!res.ok) {
    throw new Error('Failed to fetch available slots')
  }
  return res.json()
}
