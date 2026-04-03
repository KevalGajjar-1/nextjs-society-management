# NoBrokerHood - Residential Community Management SaaS

A modern, production-ready SaaS application for managing residential communities, built with Next.js 16, Supabase, and Tailwind CSS.

## Features

### 🏘️ Core Functionality
- **Role-Based Access Control**: ADMIN, COMMITTEE, and MEMBER roles
- **Approval Workflow**: Pending user approvals before dashboard access
- **Residential Units**: Track flats and shops in your community
- **Resident Management**: Manage tenants, owners, and family members
- **Financial Tracking**: Income and expense management with summaries
- **Vehicle Registry**: Track 2-wheelers and 4-wheelers with sticker numbers
- **Notice Board**: Community announcements and updates
- **Committee Management**: Designate committee members

### 📱 Responsive Design
- **Mobile First**: Bottom tab navigation on mobile
- **Desktop Optimized**: Left sidebar with expanded menu on desktop
- **Seamless Transitions**: Automatic layout switch at 768px breakpoint

### 🔐 Security
- JWT-based authentication with 7-day expiry
- HttpOnly secure cookies
- Bcrypt password hashing
- Row Level Security (RLS) at database level
- Server-side route protection
- Role-based endpoint authorization

### 💾 Data Management
- PostgreSQL with strict ENUM types
- Referential integrity with foreign keys
- Indexed queries for performance
- Transaction history with financial year filtering

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT + Cookies
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: React hooks + SWR
- **Form Handling**: React Hook Form + Zod

## Project Structure

```
├── app/
│   ├── auth/                 # Auth pages (login, signup, waiting)
│   ├── dashboard/            # Main dashboard
│   │   ├── layout.tsx        # Dashboard layout with nav
│   │   ├── page.tsx          # Home page
│   │   ├── finance/          # Finance tracking
│   │   ├── units/            # Units listing
│   │   ├── people/           # Residents listing
│   │   ├── vehicles/         # Vehicle registry
│   │   ├── profile/          # User profile
│   │   └── admin/            # Admin pages
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── dashboard/            # Dashboard components
├── lib/
│   ├── types.ts              # TypeScript types
│   ├── auth.ts               # Auth utilities
│   ├── api.ts                # API helpers
│   └── supabase.ts           # Supabase client
├── hooks/
│   ├── use-auth.ts           # Auth hook
│   └── use-toast.ts          # Toast notifications
├── middleware.ts             # Route protection
└── SETUP_GUIDE.md            # Detailed setup instructions
```

## Quick Start

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your-jwt-secret
```

### 3. Database Setup

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed SQL setup instructions.

### 4. Run

```bash
npm run dev
```

Visit `http://localhost:3000`

## User Flows

### Signup Flow
1. User visits `/auth/signup`
2. Selects unit and resident type
3. Account created with PENDING status
4. Redirected to `/auth/waiting`
5. Admin approves at `/dashboard/admin/users`
6. User receives approval and can login

### Member Dashboard
1. Login at `/auth/login`
2. Access 6 main tabs: Home, Finance, Units, People, Vehicles, Profile
3. View community notices and financial summaries
4. Manage profile and vehicle registrations

### Admin Dashboard
1. Login with ADMIN role
2. Access `/dashboard/admin` for overview
3. **Users Page**: Approve/reject registrations, change roles
4. **Notices Page**: Create and manage community announcements
5. **Settings Page**: Configure community preferences

## API Reference

### Authentication Endpoints
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Register new account
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Get current session

### Data Endpoints
- `GET /api/users` - List all approved users
- `PATCH /api/users/:id` - Update user (admin only)
- `GET /api/units` - List all units
- `GET /api/transactions` - List financial transactions
- `GET /api/vehicles` - List registered vehicles
- `GET /api/notices` - List community notices
- `POST /api/notices/post` - Create notice (admin only)

## Key Business Rules

1. **Unit is Mandatory**: Every user must select a unit during signup
2. **Approval Gate**: Users can't access dashboard until APPROVED
3. **Unique Vehicles**: Each vehicle sticker number is unique
4. **Admin Protection**: Committee can't delete or demote admin users
5. **Financial Year**: India FY format (April-March)
6. **Role Hierarchy**: ADMIN > COMMITTEE > MEMBER

## Database Schema

### Tables
- **users**: All residents with roles and statuses
- **units**: Flats and shops with details
- **transactions**: Income/expense entries
- **vehicles**: Registered vehicles with sticker numbers
- **notices**: Community announcements
- **expense_groups**: Categorized expense groups
- **committee_members**: Committee designations

### Enums
- `user_role`: ADMIN, COMMITTEE, MEMBER
- `user_status`: PENDING, APPROVED, REJECTED
- `unit_type`: FLAT, SHOP
- `resident_type`: OWNER, TENANT, FAMILY
- `transaction_type`: INCOME, EXPENSE
- `vehicle_type`: TWO_WHEELER, FOUR_WHEELER
- `payment_mode`: CASH, UPI, BANK

## Deployment

### Vercel (Recommended)

```bash
git push origin main
```

Automatic deployment with environment variables from Vercel dashboard.

### Manual Deployment

```bash
npm run build
npm start
```

## Performance Optimizations

- Server-side rendering for auth pages
- Client components for interactive dashboards
- Indexed database queries
- Optimized image loading
- CSS-in-JS minimization
- Code splitting via dynamic imports

## Security Considerations

- Keep `SUPABASE_SERVICE_ROLE_KEY` secret (server-side only)
- Enable RLS policies in Supabase
- Regularly rotate JWT_SECRET
- Monitor failed login attempts
- Use strong passwords for admin accounts
- Keep dependencies updated

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m "Add feature"`
3. Push: `git push origin feature/name`
4. Create pull request

## License

MIT License - See LICENSE file

## Support

- **Documentation**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Issues**: Check existing issues or create new one
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## Roadmap

- [ ] CSV import/export for transactions
- [ ] Advanced financial reporting
- [ ] Email notifications for approvals
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Two-factor authentication
- [ ] Audit logging

---

Built with ❤️ for residential communities
