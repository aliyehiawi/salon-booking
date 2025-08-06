# Salon Booking System API Documentation

## Overview

The Salon Booking System API provides a comprehensive set of endpoints for managing salon bookings, services, customers, and administrative functions. The API follows RESTful principles and uses JWT authentication.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes
- **General API endpoints**: 100 requests per minute
- **Booking endpoints**: 10 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Remaining`: Number of requests remaining
- `X-RateLimit-Reset`: Timestamp when the rate limit resets

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": ["Detailed error information"]
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `429`: Too Many Requests
- `500`: Internal Server Error

---

## Authentication Endpoints

### Register Customer

**POST** `/auth/register`

Register a new customer account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePassword123"
}
```

**Response (201):**
```json
{
  "token": "jwt-token-here",
  "customer": {
    "id": "customer-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Validation Rules:**
- Name: 2-50 characters, no HTML tags
- Email: Valid email format
- Phone: 10-15 digits, may include +, spaces, parentheses, hyphens
- Password: Minimum 8 characters, must contain uppercase, lowercase, and number

### Login Customer

**POST** `/auth/login`

Authenticate a customer and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "token": "jwt-token-here",
  "customer": {
    "id": "customer-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

### Admin Login

**POST** `/admin/login`

Authenticate an admin user.

**Request Body:**
```json
{
  "email": "admin@salon.com",
  "password": "AdminPassword123"
}
```

**Response (200):**
```json
{
  "token": "jwt-token-here",
  "admin": {
    "id": "admin-id",
    "name": "Admin User",
    "email": "admin@salon.com"
  }
}
```

---

## Service Endpoints

### Get All Services (Public)

**GET** `/services`

Retrieve all available services.

**Response (200):**
```json
[
  {
    "_id": "service-id",
    "name": "Haircut & Style",
    "description": "Professional haircut and styling service",
    "duration": "60 min",
    "price": "$65"
  }
]
```

### Get All Services (Admin)

**GET** `/admin/services`

**Headers:** `Authorization: Bearer <admin-token>`

Retrieve all services with admin privileges.

### Create Service (Admin)

**POST** `/admin/services`

**Headers:** `Authorization: Bearer <admin-token>`

Create a new service.

**Request Body:**
```json
{
  "name": "New Service",
  "description": "Service description",
  "duration": 90,
  "price": "$85"
}
```

**Validation Rules:**
- Name: 2-100 characters, unique
- Description: 10-500 characters
- Duration: Positive number (minutes)
- Price: Valid currency format

### Update Service (Admin)

**PATCH** `/admin/services/{id}`

**Headers:** `Authorization: Bearer <admin-token>`

Update an existing service.

**Request Body:**
```json
{
  "name": "Updated Service Name",
  "price": "$95"
}
```

### Delete Service (Admin)

**DELETE** `/admin/services/{id}`

**Headers:** `Authorization: Bearer <admin-token>`

Delete a service (only if no bookings exist for it).

---

## Booking Endpoints

### Create Booking

**POST** `/bookings`

Create a new booking.

**Request Body:**
```json
{
  "serviceId": "service-id",
  "date": "2024-01-15",
  "time": "14:30",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "booking": {
    "_id": "booking-id",
    "serviceId": "service-id",
    "serviceName": "Haircut & Style",
    "date": "2024-01-15",
    "time": "14:30",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "status": "pending",
    "price": "$65"
  }
}
```

**Validation Rules:**
- ServiceId: Valid MongoDB ObjectId
- Date: Future date only
- Time: HH:MM format
- Name: 2-50 characters
- Email: Valid email format
- Phone: Valid phone format

### Get Available Time Slots

**GET** `/bookings/available-slots?date=2024-01-15&serviceId=service-id`

Get available time slots for a specific date and service.

**Response (200):**
```json
{
  "slots": ["9:00 AM", "9:15 AM", "9:30 AM"],
  "duration": 60
}
```

### Get Customer Bookings

**GET** `/auth/bookings`

**Headers:** `Authorization: Bearer <customer-token>`

Get all bookings for the authenticated customer.

**Response (200):**
```json
[
  {
    "_id": "booking-id",
    "serviceName": "Haircut & Style",
    "date": "2024-01-15",
    "time": "14:30",
    "status": "confirmed",
    "price": "$65"
  }
]
```

### Update Booking (Admin)

**PATCH** `/admin/bookings/{id}`

**Headers:** `Authorization: Bearer <admin-token>`

Update booking status or details.

**Request Body:**
```json
{
  "status": "confirmed",
  "date": "2024-01-16",
  "time": "15:00"
}
```

---

## Admin Endpoints

### Dashboard

**GET** `/admin/dashboard`

**Headers:** `Authorization: Bearer <admin-token>`

Get dashboard analytics.

**Query Parameters:**
- `timeRange`: `today`, `week`, `month`, `year` (default: `month`)

**Response (200):**
```json
{
  "totalBookings": 150,
  "totalRevenue": 9750,
  "averageRating": 4.8,
  "topServices": [
    {
      "name": "Haircut & Style",
      "bookings": 45,
      "revenue": 2925
    }
  ],
  "recentBookings": [...],
  "monthlyTrends": [...]
}
```

### Customers

**GET** `/admin/customers`

**Headers:** `Authorization: Bearer <admin-token>`

Get all customers with booking statistics.

**Query Parameters:**
- `search`: Search by name or email
- `status`: Filter by status (`active`, `inactive`)
- `sortBy`: Sort field (`name`, `email`, `totalSpent`, `lastBooking`)
- `sortOrder`: `asc` or `desc`

**Response (200):**
```json
[
  {
    "_id": "customer-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "totalSpent": 325,
    "totalBookings": 5,
    "lastBooking": "2024-01-10",
    "status": "active"
  }
]
```

### Discounts

**GET** `/admin/discounts`

**Headers:** `Authorization: Bearer <admin-token>`

Get all discount codes.

**POST** `/admin/discounts`

**Headers:** `Authorization: Bearer <admin-token>`

Create a new discount code.

**Request Body:**
```json
{
  "code": "WELCOME20",
  "name": "Welcome Discount",
  "description": "20% off for new customers",
  "discountType": "percentage",
  "value": 20,
  "maxDiscount": 50,
  "minimumAmount": 25,
  "usageLimit": 100,
  "validFrom": "2024-01-01",
  "validUntil": "2024-12-31"
}
```

### Business Settings

**GET** `/admin/settings`

**Headers:** `Authorization: Bearer <admin-token>`

Get business settings.

**POST** `/admin/settings`

**Headers:** `Authorization: Bearer <admin-token>`

Update business settings.

**Request Body:**
```json
{
  "businessName": "Elegant Salon",
  "businessHours": {
    "monday": {
      "isOpen": true,
      "open": "09:00",
      "close": "18:00"
    }
  },
  "bookingSettings": {
    "maxBookingsPerDay": 20,
    "timeSlotDuration": 15,
    "breakMinutes": 15
  }
}
```

---

## Customer Profile Endpoints

### Get Profile

**GET** `/auth/me`

**Headers:** `Authorization: Bearer <customer-token>`

Get customer profile information.

**Response (200):**
```json
{
  "id": "customer-id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

### Update Profile

**PATCH** `/auth/profile`

**Headers:** `Authorization: Bearer <customer-token>`

Update customer profile.

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567891"
}
```

### Get Loyalty Information

**GET** `/auth/loyalty`

**Headers:** `Authorization: Bearer <customer-token>`

Get customer loyalty data.

**Response (200):**
```json
{
  "points": 325,
  "totalSpent": 325,
  "totalBookings": 5,
  "tier": "silver",
  "badges": ["First Booking", "Loyal Customer"],
  "milestones": ["5 Bookings"],
  "activeDiscounts": [],
  "recentBookings": [...]
}
```

---

## Payment Endpoints

### Create Payment Intent

**POST** `/payments/create-intent`

**Headers:** `Authorization: Bearer <customer-token>`

Create a Stripe payment intent.

**Request Body:**
```json
{
  "amount": 6500,
  "currency": "usd",
  "bookingId": "booking-id",
  "discountCode": "WELCOME20"
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### Get Payment Methods

**GET** `/payments/methods`

**Headers:** `Authorization: Bearer <customer-token>`

Get customer's saved payment methods.

**Response (200):**
```json
[
  {
    "_id": "payment-method-id",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2025
    },
    "isDefault": true
  }
]
```

### Save Payment Method

**POST** `/payments/methods`

**Headers:** `Authorization: Bearer <customer-token>`

Save a new payment method.

**Request Body:**
```json
{
  "paymentMethodId": "pm_xxx",
  "saveForLater": true
}
```

---

## Discount Validation

### Validate Discount Code

**POST** `/discounts/validate`

**Headers:** `Authorization: Bearer <customer-token>`

Validate a discount code.

**Request Body:**
```json
{
  "discountCode": "WELCOME20",
  "bookingAmount": 65
}
```

**Response (200):**
```json
{
  "valid": true,
  "discountId": "discount-id",
  "discountAmount": 13,
  "discountType": "percentage",
  "discountValue": 20,
  "name": "Welcome Discount",
  "description": "20% off for new customers"
}
```

---

## Webhooks

### Stripe Webhook

**POST** `/webhooks/stripe`

Handle Stripe webhook events.

**Headers:** `Stripe-Signature: <signature>`

**Supported Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_method.attached`
- `payment_method.detached`

---

## Security Features

### Headers

All API responses include security headers:
- `Content-Security-Policy`: Restricts resource loading
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME type sniffing
- `X-XSS-Protection`: XSS protection
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts browser features

### CORS

Cross-Origin Resource Sharing is configured for:
- Development: `http://localhost:3000`, `http://localhost:3001`
- Production: Configurable via `ALLOWED_ORIGINS` environment variable

### Input Validation

All inputs are validated and sanitized:
- SQL injection prevention
- XSS prevention
- Input length limits
- Type validation
- Format validation

---

## Environment Variables

Required environment variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/salon-booking

# JWT
JWT_SECRET=your-secret-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@salon.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# App
NODE_ENV=development
APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
LOG_LEVEL=info
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Invalid or missing authentication |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RESOURCE_CONFLICT` | Resource already exists or conflict |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `PAYMENT_ERROR` | Payment processing error |
| `BOOKING_ERROR` | Booking-related error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

## SDKs and Libraries

### JavaScript/TypeScript

```javascript
// Example API client usage
const response = await fetch('/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(bookingData)
});

const booking = await response.json();
```

### cURL Examples

```bash
# Register a customer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "SecurePassword123"
  }'

# Create a booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "serviceId": "service-id",
    "date": "2024-01-15",
    "time": "14:30",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }'
```

---

## Support

For API support and questions:
- Email: support@salon.com
- Documentation: https://docs.salon.com
- Status Page: https://status.salon.com 