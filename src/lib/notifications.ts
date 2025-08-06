import nodemailer from 'nodemailer'
import twilio from 'twilio'

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// SMS configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface NotificationData {
  to: string
  name: string
  bookingId: string
  serviceName: string
  date: string
  time: string
  price: string
  phone?: string
  salonName?: string
  salonPhone?: string
  salonAddress?: string
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class NotificationService {
  private static instance: NotificationService

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Email Templates
  private getBookingConfirmationEmail(data: NotificationData): EmailTemplate {
    const subject = `Booking Confirmed - ${data.serviceName}`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Booking Confirmed!</h1>
              <p>Your appointment has been successfully scheduled</p>
            </div>
            <div class="content">
              <p>Hi ${data.name},</p>
              <p>Great news! Your booking has been confirmed. Here are the details:</p>
              
              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">Service:</span>
                  <span class="detail-value">${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(data.date).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${data.time}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Price:</span>
                  <span class="detail-value">${data.price}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">${data.bookingId}</span>
                </div>
              </div>

              ${data.salonName ? `
                <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #2563eb;">Salon Information</h3>
                  <p><strong>${data.salonName}</strong></p>
                  ${data.salonAddress ? `<p>📍 ${data.salonAddress}</p>` : ''}
                  ${data.salonPhone ? `<p>📞 ${data.salonPhone}</p>` : ''}
                </div>
              ` : ''}

              <p><strong>Important Reminders:</strong></p>
              <ul>
                <li>Please arrive 10 minutes before your appointment time</li>
                <li>Bring any necessary documents or information</li>
                <li>If you need to reschedule, please contact us at least 24 hours in advance</li>
              </ul>

              <p>We look forward to seeing you!</p>
              
              <div class="footer">
                <p>Thank you for choosing our services.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
    const text = `
      Booking Confirmed - ${data.serviceName}
      
      Hi ${data.name},
      
      Your booking has been confirmed. Here are the details:
      
      Service: ${data.serviceName}
      Date: ${new Date(data.date).toLocaleDateString()}
      Time: ${data.time}
      Price: ${data.price}
      Booking ID: ${data.bookingId}
      
      ${data.salonName ? `
      Salon Information:
      ${data.salonName}
      ${data.salonAddress ? `Address: ${data.salonAddress}` : ''}
      ${data.salonPhone ? `Phone: ${data.salonPhone}` : ''}
      ` : ''}
      
      Important Reminders:
      - Please arrive 10 minutes before your appointment time
      - Bring any necessary documents or information
      - If you need to reschedule, please contact us at least 24 hours in advance
      
      We look forward to seeing you!
      
      Thank you for choosing our services.
    `

    return { subject, html, text }
  }

  private getBookingReminderEmail(data: NotificationData): EmailTemplate {
    const subject = `Reminder: Your appointment tomorrow - ${data.serviceName}`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .reminder { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Appointment Reminder</h1>
              <p>Your appointment is tomorrow!</p>
            </div>
            <div class="content">
              <p>Hi ${data.name},</p>
              <p>This is a friendly reminder that you have an appointment tomorrow:</p>
              
              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">Service:</span>
                  <span class="detail-value">${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(data.date).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${data.time}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">${data.bookingId}</span>
                </div>
              </div>

              <div class="reminder">
                <h3 style="margin-top: 0; color: #92400e;">Don't Forget!</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Arrive 10 minutes early</li>
                  <li>Bring any required documents</li>
                  <li>Wear comfortable clothing if needed</li>
                </ul>
              </div>

              ${data.salonName ? `
                <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #2563eb;">Salon Information</h3>
                  <p><strong>${data.salonName}</strong></p>
                  ${data.salonAddress ? `<p>📍 ${data.salonAddress}</p>` : ''}
                  ${data.salonPhone ? `<p>📞 ${data.salonPhone}</p>` : ''}
                </div>
              ` : ''}

              <p>We're looking forward to seeing you tomorrow!</p>
              
              <div class="footer">
                <p>If you need to reschedule, please contact us as soon as possible.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
    const text = `
      Appointment Reminder - ${data.serviceName}
      
      Hi ${data.name},
      
      This is a friendly reminder that you have an appointment tomorrow:
      
      Service: ${data.serviceName}
      Date: ${new Date(data.date).toLocaleDateString()}
      Time: ${data.time}
      Booking ID: ${data.bookingId}
      
      Don't Forget:
      - Arrive 10 minutes early
      - Bring any required documents
      - Wear comfortable clothing if needed
      
      ${data.salonName ? `
      Salon Information:
      ${data.salonName}
      ${data.salonAddress ? `Address: ${data.salonAddress}` : ''}
      ${data.salonPhone ? `Phone: ${data.salonPhone}` : ''}
      ` : ''}
      
      We're looking forward to seeing you tomorrow!
      
      If you need to reschedule, please contact us as soon as possible.
    `

    return { subject, html, text }
  }

  private getBookingUpdateEmail(data: NotificationData, updateType: 'rescheduled' | 'cancelled'): EmailTemplate {
    const isCancelled = updateType === 'cancelled'
    const subject = isCancelled 
      ? `Appointment Cancelled - ${data.serviceName}`
      : `Appointment Rescheduled - ${data.serviceName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${isCancelled ? 'Appointment Cancelled' : 'Appointment Rescheduled'}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${isCancelled ? '#ef4444 0%, #dc2626 100%' : '#3b82f6 0%, #2563eb 100%'}); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .notice { background: ${isCancelled ? '#fee2e2' : '#dbeafe'}; border-left: 4px solid ${isCancelled ? '#ef4444' : '#3b82f6'}; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isCancelled ? '❌ Appointment Cancelled' : '🔄 Appointment Rescheduled'}</h1>
              <p>${isCancelled ? 'Your appointment has been cancelled' : 'Your appointment has been rescheduled'}</p>
            </div>
            <div class="content">
              <p>Hi ${data.name},</p>
              <p>${isCancelled ? 'Your appointment has been cancelled as requested.' : 'Your appointment has been rescheduled. Here are the new details:'}</p>
              
              ${!isCancelled ? `
                <div class="booking-details">
                  <div class="detail-row">
                    <span class="detail-label">Service:</span>
                    <span class="detail-value">${data.serviceName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">New Date:</span>
                    <span class="detail-value">${new Date(data.date).toLocaleDateString()}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">New Time:</span>
                    <span class="detail-value">${data.time}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Booking ID:</span>
                    <span class="detail-value">${data.bookingId}</span>
                  </div>
                </div>
              ` : `
                <div class="booking-details">
                  <div class="detail-row">
                    <span class="detail-label">Service:</span>
                    <span class="detail-value">${data.serviceName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Original Date:</span>
                    <span class="detail-value">${new Date(data.date).toLocaleDateString()}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Original Time:</span>
                    <span class="detail-value">${data.time}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Booking ID:</span>
                    <span class="detail-value">${data.bookingId}</span>
                  </div>
                </div>
              `}

              <div class="notice">
                <h3 style="margin-top: 0; color: ${isCancelled ? '#991b1b' : '#1e40af'};">
                  ${isCancelled ? 'Cancellation Notice' : 'Rescheduling Notice'}
                </h3>
                <p>${isCancelled 
                  ? 'Your appointment has been cancelled. If you would like to book a new appointment, please visit our website or contact us.'
                  : 'Your appointment has been successfully rescheduled. Please note the new date and time above.'
                }</p>
              </div>

              ${data.salonName ? `
                <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #2563eb;">Contact Information</h3>
                  <p><strong>${data.salonName}</strong></p>
                  ${data.salonPhone ? `<p>📞 ${data.salonPhone}</p>` : ''}
                </div>
              ` : ''}

              <div class="footer">
                <p>If you have any questions, please don't hesitate to contact us.</p>
                ${isCancelled ? '<p>We hope to see you again soon!</p>' : ''}
              </div>
            </div>
          </div>
        </body>
      </html>
    `
    const text = `
      ${isCancelled ? 'Appointment Cancelled' : 'Appointment Rescheduled'} - ${data.serviceName}
      
      Hi ${data.name},
      
      ${isCancelled ? 'Your appointment has been cancelled as requested.' : 'Your appointment has been rescheduled. Here are the new details:'}
      
      ${!isCancelled ? `
      Service: ${data.serviceName}
      New Date: ${new Date(data.date).toLocaleDateString()}
      New Time: ${data.time}
      Booking ID: ${data.bookingId}
      ` : `
      Service: ${data.serviceName}
      Original Date: ${new Date(data.date).toLocaleDateString()}
      Original Time: ${data.time}
      Booking ID: ${data.bookingId}
      `}
      
      ${isCancelled 
        ? 'Your appointment has been cancelled. If you would like to book a new appointment, please visit our website or contact us.'
        : 'Your appointment has been successfully rescheduled. Please note the new date and time above.'
      }
      
      ${data.salonName ? `
      Contact Information:
      ${data.salonName}
      ${data.salonPhone ? `Phone: ${data.salonPhone}` : ''}
      ` : ''}
      
      If you have any questions, please don't hesitate to contact us.
      ${isCancelled ? 'We hope to see you again soon!' : ''}
    `

    return { subject, html, text }
  }

  // SMS Templates
  private getBookingConfirmationSMS(data: NotificationData): string {
    return `Hi ${data.name}! Your ${data.serviceName} appointment is confirmed for ${new Date(data.date).toLocaleDateString()} at ${data.time}. Booking ID: ${data.bookingId}. See you soon!`
  }

  private getBookingReminderSMS(data: NotificationData): string {
    return `Hi ${data.name}! Reminder: Your ${data.serviceName} appointment is tomorrow at ${data.time}. Please arrive 10 minutes early. Booking ID: ${data.bookingId}`
  }

  private getBookingUpdateSMS(data: NotificationData, updateType: 'rescheduled' | 'cancelled'): string {
    if (updateType === 'cancelled') {
      return `Hi ${data.name}! Your ${data.serviceName} appointment for ${new Date(data.date).toLocaleDateString()} at ${data.time} has been cancelled. Booking ID: ${data.bookingId}`
    } else {
      return `Hi ${data.name}! Your ${data.serviceName} appointment has been rescheduled to ${new Date(data.date).toLocaleDateString()} at ${data.time}. Booking ID: ${data.bookingId}`
    }
  }

  // Public methods
  async sendBookingConfirmation(data: NotificationData, sendSMS: boolean = false): Promise<boolean> {
    try {
      const template = this.getBookingConfirmationEmail(data)
      
      // Send email
      await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@salon.com',
        to: data.to,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      // Send SMS if requested and phone number is available
      if (sendSMS && data.phone) {
        await this.sendSMS(data.phone, this.getBookingConfirmationSMS(data))
      }

      return true
    } catch (error) {
      console.error('Error sending booking confirmation:', error)
      return false
    }
  }

  async sendBookingReminder(data: NotificationData, sendSMS: boolean = false): Promise<boolean> {
    try {
      const template = this.getBookingReminderEmail(data)
      
      // Send email
      await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@salon.com',
        to: data.to,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      // Send SMS if requested and phone number is available
      if (sendSMS && data.phone) {
        await this.sendSMS(data.phone, this.getBookingReminderSMS(data))
      }

      return true
    } catch (error) {
      console.error('Error sending booking reminder:', error)
      return false
    }
  }

  async sendBookingUpdate(data: NotificationData, updateType: 'rescheduled' | 'cancelled', sendSMS: boolean = false): Promise<boolean> {
    try {
      const template = this.getBookingUpdateEmail(data, updateType)
      
      // Send email
      await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@salon.com',
        to: data.to,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      // Send SMS if requested and phone number is available
      if (sendSMS && data.phone) {
        await this.sendSMS(data.phone, this.getBookingUpdateSMS(data, updateType))
      }

      return true
    } catch (error) {
      console.error('Error sending booking update:', error)
      return false
    }
  }

  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      })
    } catch (error) {
      console.error('Error sending SMS:', error)
      throw error
    }
  }
}

export default NotificationService.getInstance() 