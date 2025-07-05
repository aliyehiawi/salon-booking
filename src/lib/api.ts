// src/lib/api.ts
export async function submitBooking(data: any) {
  const res = await fetch('http://localhost:4000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to submit booking')
  }

  return res.json()
}
