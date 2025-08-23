# POSTERBAZAR - India's Premier Poster Marketplace

## Project Overview

POSTERBAZAR is a comprehensive digital platform that connects advertisers with billboard owners across India. The platform facilitates the discovery, booking, and management of outdoor advertising spaces with transparent pricing and verified listings.

### Key Features

- **For Advertisers**:
  - Browse and search billboards by location, size, and price
  - Book billboards with secure payment processing
  - Track campaign performance and analytics
  - Manage multiple bookings from a centralized dashboard

- **For Billboard Owners**:
  - List billboard properties with detailed specifications
  - Manage bookings and availability
  - Receive payments through a secure wallet system
  - Track performance metrics and revenue

- **For Administrators**:
  - Verify billboard listings and owner KYC
  - Manage user accounts and permissions
  - Configure system settings and commission rates
  - Generate reports and analytics

- **For Sub-Administrators**:
  - Conduct physical verification of billboards
  - Upload verification photos and documentation
  - Approve or reject billboard listings based on site visits

## Technical Stack

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.6.2
- **Routing**: React Router DOM 6.28.0
- **Styling**: TailwindCSS 3.4.14
- **Icons**: Lucide React 0.460.0
- **Build Tool**: Vite 5.4.10

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **API**: Supabase REST API

### Development Tools
- **Linting**: ESLint 9.13.0
- **Type Checking**: TypeScript 5.6.2
- **Package Manager**: npm

## Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/posterbazar.git
   cd posterbazar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

## Project Structure

```
posterbazar/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   ├── context/             # React context providers
│   ├── data/                # Mock data and constants
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── owner/           # Billboard owner pages
│   │   ├── subadmin/        # Sub-admin pages
│   │   └── user/            # Advertiser pages
│   ├── services/            # API and service functions
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles
│   └── main.tsx             # Application entry point
├── supabase/
│   └── migrations/          # Database migration files
├── .env                     # Environment variables
├── index.html               # HTML entry point
├── package.json             # Project dependencies
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Database Schema

The application uses a PostgreSQL database with the following main tables:

- **users**: User accounts with roles (user, owner, admin, sub_admin)
- **billboards**: Billboard listings with specifications and status
- **billboard_images**: Images associated with billboards
- **billboard_types**: Types of billboards (e.g., Digital, Static)
- **billboard_size_fees**: Fee structure based on billboard size
- **bookings**: Booking records for billboards
- **kyc_documents**: KYC documentation for billboard owners
- **wallet_transactions**: Financial transactions in user wallets
- **notifications**: User notifications
- **site_visits**: Records of physical verification visits
- **testimonials**: Client testimonials for the platform

## User Roles

1. **User (Advertiser)**
   - Can browse and book billboards
   - Manage their bookings and payments
   - View campaign analytics

2. **Owner (Billboard Owner)**
   - Can list billboards for rent
   - Manage their billboard inventory
   - Process booking requests
   - Receive payments

3. **Admin**
   - Full system access
   - Approve/reject billboard listings
   - Manage users and settings
   - Generate reports

4. **Sub-Admin**
   - Conduct physical verification of billboards
   - Submit verification reports
   - Limited administrative access

## Development Guidelines

### Code Style
- Follow ESLint configuration for code style
- Use TypeScript for type safety
- Follow component-based architecture
- Use React hooks for state management

### Git Workflow
- Use feature branches for new features
- Create pull requests for code review
- Follow conventional commit messages

### Testing
- Write unit tests for critical components
- Test across different browsers and devices
- Ensure responsive design works on all screen sizes

## Deployment

### Production Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` directory to your hosting provider of choice (Netlify, Vercel, etc.)

3. Configure environment variables on your hosting platform

### Supabase Setup
1. Create a new Supabase project
2. Run the migration scripts in the `supabase/migrations` directory
3. Configure authentication settings
4. Set up storage buckets for images
5. Configure row-level security policies

## Troubleshooting

### Common Issues

1. **Connection to Supabase fails**
   - Check your environment variables
   - Ensure your Supabase project is active
   - Verify network connectivity

2. **Images not loading**
   - Check Supabase storage bucket permissions
   - Verify image URLs are correct
   - Check for CORS issues

3. **Authentication problems**
   - Clear browser cookies and local storage
   - Verify Supabase authentication settings
   - Check for expired tokens

## Support and Resources

- **Documentation**: [Supabase Docs](https://supabase.com/docs)
- **React**: [React Documentation](https://react.dev)
- **TailwindCSS**: [Tailwind Documentation](https://tailwindcss.com/docs)
- **Vite**: [Vite Documentation](https://vitejs.dev/guide/)

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

© 2025 POSTERBAZAR. All rights reserved.