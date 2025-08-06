# Salon Booking System

A modern salon booking system built with Next.js, MongoDB, and Tailwind CSS.

## 🚀 Features

### Core Booking System
- **Customer Registration & Login**: Secure authentication with JWT tokens
- **Service Booking**: Easy appointment scheduling with time slot selection
- **Booking Management**: View, cancel, and reschedule appointments
- **Customer Profiles**: Manage personal information and preferences

### Admin Panel
- **Dashboard Analytics**: Revenue tracking, popular services, booking statistics
- **Appointment Management**: View and manage all bookings
- **Calendar View**: Visual calendar interface for appointments
- **Customer Management**: Database of customers with booking history
- **Service Management**: Add, edit, and manage salon services

### Configuration & Business Management
- **Environment Configuration**: Centralized config management with validation
- **Salon Information Management**: Complete business profile management
- **Business Hours**: Flexible scheduling for each day of the week
- **Social Media Integration**: Links to Facebook, Instagram, Twitter, TikTok

### Payment & Loyalty System
- **Stripe Integration**: Secure payment processing with saved payment methods
- **Customer Tiers**: Bronze, Silver, Gold, Platinum, Diamond levels
- **Badge System**: Achievement badges for customer milestones
- **Discount Codes**: Percentage, fixed amount, and free service discounts
- **Loyalty Tracking**: Automatic tier progression based on usage
- **Milestone Rewards**: Special rewards for reaching booking/spending thresholds
- **Points System**: Earn points for payments, convert to discounts
- **Auto-Approval**: Paid appointments are automatically confirmed

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd salon-booking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npm run setup
   ```
   This will create a `.env` file with all necessary variables. Update the following with your actual values:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `STRIPE_SECRET_KEY`: Your Stripe secret key from the dashboard
   - `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

4. **Seed the database**
   ```bash
   npm run seed:all
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 📊 Database Seeding

The system includes seed scripts to populate the database with initial data:

- **Salon Information**: `npm run seed:salon`
- **Discount Codes**: `npm run seed:discounts`
- **All Data**: `npm run seed:all`

## 🎯 Configuration Features

### Environment Configuration
- Centralized config management in `src/lib/config.ts`
- Environment variable validation
- Feature flags for future functionality
- Security settings and rate limiting

### Salon Information Management
- **Basic Info**: Name, phone, email, website, description
- **Address**: Complete address with street, city, state, zip, country
- **Social Media**: Links to all major platforms
- **Business Hours**: Flexible scheduling for each day
- **Business Settings**: Timezone, currency, tax rate

### Loyalty Program
- **Tier System**: 5 customer tiers with automatic progression
- **Badge System**: Achievement badges for various milestones
- **Points System**: Track customer points and spending
- **Rewards**: Automatic rewards for reaching thresholds

### Discount Management
- **Multiple Types**: Percentage, fixed amount, free service
- **Usage Limits**: Set maximum usage per code
- **Customer Restrictions**: New/existing customers, minimum requirements
- **Validity Periods**: Set start and end dates for promotions

## 🔧 Admin Features

### Dashboard
- Revenue analytics and trends
- Popular services tracking
- Booking status overview
- Recent activity feed

### Customer Management
- Complete customer database
- Booking history and statistics
- Loyalty tier tracking
- Contact information management

### Service Management
- Add and edit services
- Set pricing and duration
- Service categories and descriptions
- Availability management

## 🎨 Frontend Features

### Dynamic Content
- **Hero Section**: Displays salon name, description, and contact info
- **Footer**: Complete business information with hours and social links
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live data from database

### User Experience
- **Unified Login**: Single login for customers and admins
- **Auto-fill**: Customer information auto-fills in booking forms
- **Toast Notifications**: User-friendly feedback messages
- **Loading States**: Smooth loading experiences

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Separate customer and admin permissions
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Comprehensive error management

## 📱 API Endpoints

### Authentication
- `POST /api/auth/unified-login` - Unified login for customers and admins
- `POST /api/auth/register` - Customer registration
- `GET /api/auth/me` - Get current user profile
- `GET /api/auth/loyalty` - Get customer loyalty information

### Payment APIs
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `GET /api/payments/methods` - Get customer's saved payment methods
- `POST /api/payments/methods` - Save new payment method
- `PATCH /api/payments/methods` - Update payment method (set default)
- `DELETE /api/payments/methods` - Remove payment method
- `POST /api/stripe-webhook` - Handle Stripe webhook events

### Admin APIs
- `GET /api/admin/dashboard` - Dashboard analytics
- `GET /api/admin/bookings` - Manage bookings
- `GET /api/admin/customers` - Customer management
- `GET /api/admin/services` - Service management
- `GET /api/admin/salon-info` - Salon information
- `GET /api/admin/discounts` - Discount management
- `GET /api/admin/loyalty` - Loyalty program data

### Public APIs
- `GET /api/salon-info` - Public salon information
- `GET /api/services` - Available services
- `POST /api/bookings` - Create bookings

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📝 License

This project is licensed under the MIT License.
