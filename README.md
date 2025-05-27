# Sheridan Jobs - Wyoming's Premier Job Board

A cutting-edge job posting platform exclusively designed for Wyoming's local job market, offering a seamless, user-friendly experience for connecting employers and job seekers through an innovative single-page web application.

## 🏔️ Features

### For Job Seekers
- **Browse Jobs** - View all job postings without requiring an account
- **Apply to Jobs** - Submit applications with resume upload and cover letters
- **Profile Management** - Create detailed profiles with skills, experience, and education
- **Application Tracking** - View all submitted applications and their status
- **Resume Management** - Upload and store resumes securely in the database

### For Employers
- **Tiered Job Posting Plans**
  - **Basic Plan** - Free job postings with standard visibility
  - **Standard Plan** - $20 enhanced listings with better placement
  - **Featured Plan** - $50 premium listings with top placement
  - **Unlimited Plan** - $150 unlimited postings with all features
- **Add-on Services** - Premium highlighting, extended duration, social media promotion
- **Application Management** - Review, track, and manage job applications
- **Business Profiles** - Showcase company information and branding
- **Analytics** - Track job posting performance and click rates

### Core Functionality
- **Secure Authentication** - Password-based login with role selection (Business/Job Seeker)
- **Password Reset** - Email-based password recovery with secure tokens
- **Contact System** - Professional contact form with email notifications
- **Payment Processing** - PayPal integration for job posting payments
- **Email Notifications** - Mailgun-powered email system for all communications
- **Mobile-First Design** - Responsive design optimized for all devices

## 🛠️ Technology Stack

### Frontend
- **React.js** - Modern component-based UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling framework
- **Shadcn/UI** - High-quality component library
- **React Hook Form** - Form handling and validation
- **TanStack Query** - Data fetching and state management
- **Wouter** - Lightweight routing

### Backend
- **Node.js & Express** - Server runtime and web framework
- **TypeScript** - Full-stack type safety
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Modern database toolkit
- **Sequelize** - Additional ORM for complex operations
- **bcrypt** - Secure password hashing
- **Express Session** - Session management

### Email & Payments
- **Mailgun** - Professional email delivery service
- **PayPal SDK** - Payment processing
- **Nodemailer** - Email sending functionality

### Development & Testing
- **Vite** - Fast build tool and dev server
- **Jest** - Testing framework
- **ESLint & TypeScript** - Code quality and type checking

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Mailgun account for email services
- PayPal developer account for payments

### Environment Variables
Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Session
SESSION_SECRET=your_secure_session_secret

# Mailgun Email Service
MAILGUN_SMTP_SERVER=smtp.mailgun.org
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_LOGIN=postmaster@your-domain.mailgun.org
MAILGUN_SMTP_PASSWORD=your_mailgun_smtp_password

# Email Configuration
EMAIL_FROM=noreply@sheridanjobs.com
BUSINESS_EMAIL=your_business_email@domain.com
FRONTEND_URL=https://your-app-domain.com

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Development
NODE_ENV=development
```

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   ```bash
   npm run db:push
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api

## 📊 Database Schema

### Core Tables
- **users** - User accounts (business & job seekers)
- **business_profiles** - Company information and branding
- **job_seeker_profiles** - Individual profiles with skills/experience
- **job_postings** - Job listings with plan information
- **job_applications** - Application submissions and tracking
- **products** - Pricing plans and add-ons
- **sessions** - User session management

## 🔐 Authentication & Security

- **Password-based Authentication** - Secure bcrypt password hashing
- **Role-based Access Control** - Separate permissions for businesses and job seekers
- **Session Management** - PostgreSQL-backed session storage
- **Password Recovery** - Secure token-based password reset via email
- **Input Validation** - Comprehensive Zod schema validation
- **SQL Injection Protection** - Parameterized queries and ORM usage

## 📧 Email System

### Mailgun Integration
- **Contact Form Notifications** - Professional inquiry handling
- **Password Reset Emails** - Secure recovery process
- **Application Confirmations** - User acknowledgments
- **Beautiful HTML Templates** - Wyoming mountain-themed branding

### Email Types
- Contact form submissions to business email
- Password reset instructions with secure links
- Confirmation emails for form submissions
- Application status updates (future enhancement)

## 💳 Payment System

### PayPal Integration
- **Secure Payment Processing** - PCI-compliant transactions
- **Multiple Plan Options** - Flexible pricing tiers
- **Add-on Services** - Additional feature purchases
- **Payment Confirmation** - Automatic job posting activation

## 🎨 Design Philosophy

### Wyoming Mountain Theme
- **Earthy Color Palette** - Forest greens, clay browns, mountain grays
- **Professional Typography** - Clean, readable fonts
- **Mountain Imagery** - Subtle outdoor-inspired elements
- **Local Focus** - Wyoming-centric messaging and branding

### User Experience
- **Mobile-First Design** - Optimized for all screen sizes
- **Intuitive Navigation** - Clear user flow and calls-to-action
- **Accessibility** - WCAG compliance and screen reader support
- **Performance** - Fast loading times and smooth interactions

## 🧪 Testing

### Test Coverage
- **Authentication System** - Registration, login, password reset
- **API Endpoints** - All routes with various scenarios
- **Database Operations** - CRUD operations and data integrity
- **Email Functionality** - Message sending and template rendering
- **Payment Processing** - Transaction handling and validation

### Running Tests
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📈 Performance Optimizations

- **Database Indexing** - Optimized queries for job search
- **Caching Strategy** - Session and query caching
- **Image Optimization** - Compressed assets and lazy loading
- **Code Splitting** - Efficient bundle loading
- **CDN Ready** - Static asset optimization

## 🔄 Development Workflow

### Code Quality
- **TypeScript** - Full type safety across the stack
- **ESLint** - Consistent code style and error prevention
- **Prettier** - Automatic code formatting
- **Git Hooks** - Pre-commit quality checks

### Database Management
- **Drizzle Migrations** - Version-controlled schema changes
- **Seed Data** - Development data population
- **Backup Strategy** - Regular database backups

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Email service verified
- [ ] Payment system tested
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Monitoring setup

### Replit Deployment
This application is optimized for Replit deployment with:
- Automatic environment variable management
- Built-in PostgreSQL database
- One-click deployment process
- Integrated domain management

## 🔮 Future Enhancements

### Planned Features
- **Email Notifications** - Application status updates
- **Advanced Search** - Filters by salary, location, type
- **Company Reviews** - Employer rating system
- **Job Alerts** - Email notifications for matching positions
- **Analytics Dashboard** - Detailed performance metrics
- **Mobile App** - Native iOS/Android applications

### Potential Integrations
- **LinkedIn Integration** - Profile importing
- **Google Maps** - Location-based features
- **Slack/Teams** - Notification integrations
- **ATS Integration** - Enterprise recruiting systems

## 📞 Support & Contact

For technical support or business inquiries:
- **Email**: stonecoaststudios@protonmail.com
- **Website**: [Your Website URL]
- **Location**: Sheridan, Wyoming

## 📄 License

This project is proprietary software developed for Sheridan Jobs platform.

---

**Built with ❤️ in Wyoming** - Connecting local talent with local opportunities.