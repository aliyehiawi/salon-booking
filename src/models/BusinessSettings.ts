import mongoose from 'mongoose'

// Business hours schema
const businessHoursSchema = new mongoose.Schema({
  monday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isOpen: { type: Boolean, default: true }
  },
  tuesday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isOpen: { type: Boolean, default: true }
  },
  wednesday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isOpen: { type: Boolean, default: true }
  },
  thursday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isOpen: { type: Boolean, default: true }
  },
  friday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isOpen: { type: Boolean, default: true }
  },
  saturday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '15:00' },
    isOpen: { type: Boolean, default: true }
  },
  sunday: {
    open: { type: String, default: '10:00' },
    close: { type: String, default: '14:00' },
    isOpen: { type: Boolean, default: false }
  }
})

// Holiday schema
const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  isClosed: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ''
  }
})

// Main business settings schema
const businessSettingsSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    default: 'Salon Booking System'
  },
  businessHours: {
    type: businessHoursSchema,
    default: () => ({})
  },
  holidays: [holidaySchema],
  bookingSettings: {
    maxBookingsPerDay: {
      type: Number,
      default: 20,
      min: 1
    },
    maxBookingsPerCustomer: {
      type: Number,
      default: 3,
      min: 1
    },
    bookingAdvanceDays: {
      type: Number,
      default: 30,
      min: 1
    },
    bookingAdvanceHours: {
      type: Number,
      default: 2,
      min: 0
    },
    timeSlotDuration: {
      type: Number,
      default: 15,
      min: 5,
      max: 60
    },
    breakMinutes: {
      type: Number,
      default: 15,
      min: 0
    },
    allowSameDayBooking: {
      type: Boolean,
      default: true
    },
    allowCancellation: {
      type: Boolean,
      default: true
    },
    cancellationNoticeHours: {
      type: Number,
      default: 24,
      min: 0
    },
    allowRescheduling: {
      type: Boolean,
      default: true
    },
    rescheduleNoticeHours: {
      type: Number,
      default: 2,
      min: 0
    }
  },
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: true
    },
    reminderHours: {
      type: Number,
      default: 24,
      min: 0
    },
    confirmationEmail: {
      type: Boolean,
      default: true
    },
    reminderEmail: {
      type: Boolean,
      default: true
    },
    cancellationEmail: {
      type: Boolean,
      default: true
    },
    rescheduleEmail: {
      type: Boolean,
      default: true
    }
  },
  paymentSettings: {
    requirePaymentConfirmation: {
      type: Boolean,
      default: true
    },
    allowPartialPayment: {
      type: Boolean,
      default: false
    },
    depositPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    acceptedPaymentMethods: [{
      type: String,
      enum: ['card', 'cash', 'bank_transfer', 'paypal'],
      default: ['card']
    }],
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    taxInclusive: {
      type: Boolean,
      default: false
    }
  },
  loyaltySettings: {
    pointsPerDollar: {
      type: Number,
      default: 1,
      min: 0
    },
    pointsRedemptionRate: {
      type: Number,
      default: 100,
      min: 1
    },
    pointsExpiryMonths: {
      type: Number,
      default: 12,
      min: 0
    },
    enableTiers: {
      type: Boolean,
      default: true
    },
    enableBadges: {
      type: Boolean,
      default: true
    },
    enableMilestones: {
      type: Boolean,
      default: true
    }
  },
  appearanceSettings: {
    primaryColor: {
      type: String,
      default: '#667eea'
    },
    secondaryColor: {
      type: String,
      default: '#764ba2'
    },
    logoUrl: {
      type: String,
      default: ''
    },
    faviconUrl: {
      type: String,
      default: ''
    },
    customCss: {
      type: String,
      default: ''
    }
  },
  integrationSettings: {
    googleCalendar: {
      enabled: {
        type: Boolean,
        default: false
      },
      calendarId: {
        type: String,
        default: ''
      },
      apiKey: {
        type: String,
        default: ''
      }
    },
    stripe: {
      enabled: {
        type: Boolean,
        default: true
      },
      publishableKey: {
        type: String,
        default: ''
      },
      secretKey: {
        type: String,
        default: ''
      },
      webhookSecret: {
        type: String,
        default: ''
      }
    },
    email: {
      provider: {
        type: String,
        enum: ['smtp', 'sendgrid', 'mailgun', 'aws_ses'],
        default: 'smtp'
      },
      smtpHost: {
        type: String,
        default: ''
      },
      smtpPort: {
        type: Number,
        default: 587
      },
      smtpUser: {
        type: String,
        default: ''
      },
      smtpPass: {
        type: String,
        default: ''
      },
      fromEmail: {
        type: String,
        default: 'noreply@salon.com'
      },
      fromName: {
        type: String,
        default: 'Salon Booking System'
      }
    },
    sms: {
      provider: {
        type: String,
        enum: ['twilio', 'aws_sns', 'nexmo'],
        default: 'twilio'
      },
      twilioAccountSid: {
        type: String,
        default: ''
      },
      twilioAuthToken: {
        type: String,
        default: ''
      },
      twilioPhoneNumber: {
        type: String,
        default: ''
      }
    }
  },
  maintenanceSettings: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'We are currently under maintenance. Please check back later.'
    },
    maintenanceStartTime: {
      type: Date,
      default: null
    },
    maintenanceEndTime: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
businessSettingsSchema.index({ businessName: 1 })

// Virtual for checking if business is open today
businessSettingsSchema.virtual('isOpenToday').get(function() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return this.businessHours[today]?.isOpen || false
})

// Virtual for getting today's hours
businessSettingsSchema.virtual('todayHours').get(function() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return this.businessHours[today] || null
})

// Virtual for checking if in maintenance mode
businessSettingsSchema.virtual('inMaintenance').get(function() {
  if (!this.maintenanceSettings.maintenanceMode) return false
  
  const now = new Date()
  const startTime = this.maintenanceSettings.maintenanceStartTime
  const endTime = this.maintenanceSettings.maintenanceEndTime
  
  if (!startTime || !endTime) return true
  
  return now >= startTime && now <= endTime
})

// Method to check if a specific date is a holiday
businessSettingsSchema.methods.isHoliday = function(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0]
  return this.holidays.some((holiday: any) => {
    const holidayDate = holiday.date.toISOString().split('T')[0]
    return holidayDate === dateString && holiday.isClosed
  })
}

// Method to check if business is open on a specific date and time
businessSettingsSchema.methods.isOpenOn = function(date: Date, time?: string): boolean {
  // Check if it's a holiday
  if (this.isHoliday(date)) {
    return false
  }

  // Check if in maintenance mode
  if (this.inMaintenance) {
    return false
  }

  // Get day of week
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const dayHours = this.businessHours[dayOfWeek]

  if (!dayHours || !dayHours.isOpen) {
    return false
  }

  // If no specific time provided, just check if the day is open
  if (!time) {
    return true
  }

  // Check if time is within business hours
  const timeMinutes = this.timeToMinutes(time)
  const openMinutes = this.timeToMinutes(dayHours.open)
  const closeMinutes = this.timeToMinutes(dayHours.close)

  return timeMinutes >= openMinutes && timeMinutes <= closeMinutes
}

// Method to get available time slots for a specific date
businessSettingsSchema.methods.getAvailableTimeSlots = function(date: Date): string[] {
  if (!this.isOpenOn(date)) {
    return []
  }

  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const dayHours = this.businessHours[dayOfWeek]
  
  if (!dayHours || !dayHours.isOpen) {
    return []
  }

  const slots = []
  const slotDuration = this.bookingSettings.timeSlotDuration
  const openMinutes = this.timeToMinutes(dayHours.open)
  const closeMinutes = this.timeToMinutes(dayHours.close)
  const breakMinutes = this.bookingSettings.breakMinutes

  for (let minutes = openMinutes; minutes <= closeMinutes - slotDuration; minutes += slotDuration + breakMinutes) {
    slots.push(this.minutesToTime(minutes))
  }

  return slots
}

// Method to get next available date
businessSettingsSchema.methods.getNextAvailableDate = function(): Date {
  const today = new Date()
  let checkDate = new Date(today)
  
  // Check up to 30 days ahead
  for (let i = 0; i < 30; i++) {
    if (this.isOpenOn(checkDate)) {
      return checkDate
    }
    checkDate.setDate(checkDate.getDate() + 1)
  }
  
  return today // Fallback to today
}

// Method to validate booking time
businessSettingsSchema.methods.validateBookingTime = function(date: Date, time: string): { valid: boolean; message?: string } {
  // Check if business is open
  if (!this.isOpenOn(date, time)) {
    return { valid: false, message: 'Business is closed at this time' }
  }

  // Check advance booking restrictions
  const now = new Date()
  const bookingDateTime = new Date(date)
  const [hours, minutes] = time.split(':').map(Number)
  bookingDateTime.setHours(hours, minutes, 0, 0)

  const advanceHours = this.bookingSettings.bookingAdvanceHours
  const advanceDate = new Date(now)
  advanceDate.setHours(advanceDate.getHours() + advanceHours)

  if (bookingDateTime < advanceDate) {
    return { valid: false, message: `Bookings must be made at least ${advanceHours} hours in advance` }
  }

  // Check advance days restrictions
  const advanceDays = this.bookingSettings.bookingAdvanceDays
  const maxDate = new Date(now)
  maxDate.setDate(maxDate.getDate() + advanceDays)

  if (bookingDateTime > maxDate) {
    return { valid: false, message: `Bookings can only be made up to ${advanceDays} days in advance` }
  }

  return { valid: true }
}

// Helper method to convert time string to minutes
businessSettingsSchema.methods.timeToMinutes = function(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper method to convert minutes to time string
businessSettingsSchema.methods.minutesToTime = function(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Method to get business hours for a specific day
businessSettingsSchema.methods.getDayHours = function(dayOfWeek: string) {
  const day = dayOfWeek.toLowerCase()
  return this.businessHours[day] || null
}

// Method to update business hours
businessSettingsSchema.methods.updateBusinessHours = function(dayOfWeek: string, hours: { open: string; close: string; isOpen: boolean }) {
  const day = dayOfWeek.toLowerCase()
  if (this.businessHours[day]) {
    this.businessHours[day] = { ...this.businessHours[day], ...hours }
  }
  return this.save()
}

// Method to add holiday
businessSettingsSchema.methods.addHoliday = function(holiday: { name: string; date: Date; isClosed: boolean; description?: string }) {
  this.holidays.push(holiday)
  return this.save()
}

// Method to remove holiday
businessSettingsSchema.methods.removeHoliday = function(holidayId: string) {
  this.holidays = this.holidays.filter((holiday: any) => holiday._id.toString() !== holidayId)
  return this.save()
}

// Static method to get settings (singleton pattern)
businessSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne()
  
  if (!settings) {
    settings = new this()
    await settings.save()
  }
  
  return settings
}

// Static method to update settings
businessSettingsSchema.statics.updateSettings = async function(updates: any) {
  const settings = await this.getSettings()
  
  Object.assign(settings, updates)
  await settings.save()
  
  return settings
}

export default mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', businessSettingsSchema) 