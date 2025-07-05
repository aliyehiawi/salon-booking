const express = require('express')
const router = express.Router()
const Booking = require('../models/Booking')

router.post('/', async (req, res) => {
  try {
    const booking = new Booking(req.body)
    await booking.save()
    res.status(201).json({ message: 'Booking saved', booking })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
router.patch('/:id/cancel', async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    )
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
router.patch('/:id/status/:value', async (req, res) => {
  const { id, value } = req.params
  const { date } = req.body

  const allowed = ['pending', 'confirmed', 'cancelled', 'postponed']
  if (!allowed.includes(value)) {
    return res.status(400).json({ error: 'Invalid status value' })
  }

  try {
    const updateFields = { status: value }
    if (date) updateFields.date = date

    const updated = await Booking.findByIdAndUpdate(id, updateFields, { new: true })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



module.exports = router
