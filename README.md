# PG Management System

A complete PG (Paying Guest) management solution built with Next.js 14, Prisma, and PostgreSQL.

## Features (Phase 1)

### ✅ Authentication
- Admin and tenant login with phone number
- Secure password hashing with bcrypt
- JWT-based session management

### ✅ Property Management
- Add/edit properties with amenities and house rules
- Multi-property support for future scaling

### ✅ Room Management
- Create rooms with type (single/double/triple/dormitory)
- Track room features (AC, attached bath)
- Floor-wise organization

### ✅ Bed Management
- Individual bed tracking with pricing
- Visual bed status (Available, Occupied, Maintenance, Reserved)
- Automatic status updates on tenant assignment

### ✅ Tenant Management
- Complete tenant profiles with personal info
- Emergency contact details
- Work/college information
- Check-in/check-out management
- Notice period tracking

### ✅ Manual Billing
- Monthly bill generation
- Add line items (rent, electricity, maintenance, etc.)
- Payment recording (Cash, UPI, Bank Transfer, etc.)
- Bill status tracking (Draft, Sent, Partial, Paid, Overdue)
- Electricity reading to billing conversion

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **UI Components**: shadcn/ui style components
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   cd pg-management
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database URL and secrets:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/pg_management"
   NEXTAUTH_SECRET="generate-a-secure-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with sample data
   npm run db:seed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

After seeding, use these credentials to log in:
- **Phone**: 9999999999
- **Password**: admin123

## Project Structure

```
pg-management/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   │   └── login/           
│   ├── (dashboard)/         # Admin dashboard
│   │   ├── properties/      # Property management
│   │   ├── rooms/           # Room management
│   │   ├── beds/            # Bed management
│   │   ├── tenants/         # Tenant management
│   │   └── billing/         # Billing management
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── dashboard/           # Dashboard-specific components
│   └── forms/               # Form components
├── lib/
│   ├── db.ts               # Prisma client
│   ├── auth.ts             # NextAuth configuration
│   ├── utils.ts            # Utility functions
│   └── validations.ts      # Zod schemas
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
└── types/                   # TypeScript types
```

## Database Schema

Key entities:
- **User**: Admin, Staff, Tenant accounts
- **Property**: PG properties with amenities
- **Room**: Rooms within properties
- **Bed**: Individual beds with pricing
- **Tenant**: Tenant profiles linked to users
- **Bill**: Monthly bills with line items
- **Payment**: Payment records

## Upcoming Phases

### Phase 2: Online Booking & Payments
- Public booking website
- Online payment integration (Razorpay)
- Automated billing

### Phase 3: Food & Maintenance
- Meal plan subscriptions
- Meal opt-out tracking
- Maintenance request system
- Announcements

### Phase 4: Reports & Notifications
- Occupancy reports
- Revenue analytics
- SMS/WhatsApp notifications
- Tenant mobile app

## API Endpoints

The application uses Next.js Server Actions for most operations. Key actions:

- `createProperty`, `updateProperty` - Property CRUD
- `createRoom`, `updateRoom` - Room CRUD
- `createBed`, `updateBedStatus` - Bed management
- `createTenant`, `checkoutTenant`, `giveNotice` - Tenant lifecycle
- `createBill`, `addLineItem`, `recordPayment` - Billing operations

## Contributing

This is a custom solution. Feel free to fork and modify for your needs.

## License

MIT License
