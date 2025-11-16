# Authentication System Documentation

## Overview

ProAI Writer uses a robust authentication system built with NextAuth.js and Supabase, providing secure user management with JWT tokens, rate limiting, and comprehensive password reset functionality.

## Features

### 1. User Registration
- **Endpoint**: `/register` (page) and `/api/auth/signup` (API)
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- **Email Validation**: RFC-compliant email format
- **Trial Credits**: New users automatically receive 10,000 credits upon signup
- **Auto Sign-in**: Users are automatically signed in after successful registration

### 2. User Login
- **Endpoint**: `/login` (page)
- **Rate Limiting**: 5 attempts per 15 minutes per email address
- **Session Duration**: 24 hours (JWT expiry)
- **Features**:
  - Email/password authentication
  - Google OAuth (optional, requires configuration)
  - "Forgot Password" link
  - Automatic redirect to dashboard on success

### 3. Password Reset Flow
- **Forgot Password**: `/forgot-password`
  - User enters email address
  - Reset link sent via email (1-hour expiry)
  - Secure token-based reset
- **Reset Password**: `/reset-password?token=xxx`
  - User sets new password
  - Same validation as registration
  - Automatic redirect to login after success

### 4. Protected Routes
- **Middleware**: Automatically protects all routes except public pages
- **Public Routes**:
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/reset-password`
  - `/auth/callback`
- **Protected Routes**: All other routes require authentication
- **Redirect**: Unauthenticated users are redirected to `/login`

### 5. Session Management
- **Strategy**: JWT (JSON Web Tokens)
- **Duration**: 24 hours
- **Storage**: httpOnly cookies (secure)
- **Refresh**: Automatic credit balance refresh on each request

## Security Features

### Rate Limiting
```typescript
// 5 login attempts per 15 minutes
checkRateLimit(email, {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000
})
```

### Password Hashing
- Supabase handles password hashing using bcrypt
- 10 rounds of salting (industry standard)
- Passwords never stored in plain text

### Input Validation
- Server-side validation for all inputs
- Client-side validation for better UX
- XSS protection via React's built-in escaping
- CSRF protection via NextAuth

### Session Security
- httpOnly cookies prevent XSS attacks
- Secure flag in production (HTTPS only)
- SameSite attribute prevents CSRF
- Short session duration (24 hours)

## Navigation Bar

### Desktop Layout (>1024px)
- **Left Side**:
  - Logo (links to dashboard)
  - Dashboard link
  - Generate Content link
  - My Content link
  - Buy Credits link
- **Right Side**:
  - Credit balance badge (color-coded)
  - User dropdown menu (Profile, Settings, Logout)

### Mobile Layout (<768px)
- Hamburger menu button
- Slide-out drawer with all navigation items
- Credit balance visible at top
- User profile section at bottom
- Touch-friendly (44px minimum tap targets)

### Credit Balance Colors
- **Green**: 1,000+ credits
- **Yellow**: 1-999 credits
- **Red**: 0 credits

## Test Accounts

Use the seed script to create test accounts:

```bash
npm run seed:test
```

### Available Test Accounts

| Email | Password | Credits | Purpose |
|-------|----------|---------|---------|
| test@contentwriter.com | Test@123456 | 100,000 | Main testing account |
| lowcredits@test.com | Test@123456 | 500 | Low balance testing |
| nocredits@test.com | Test@123456 | 0 | Zero balance testing |
| demo@proaiwriter.com | Demo@123456 | 50,000 | Demo presentations |

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Response** (200):
```json
{
  "message": "Signup successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Errors**:
- `400`: Invalid input (weak password, invalid email)
- `500`: Server error

#### POST `/api/auth/forgot-password`
Request a password reset email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

**Note**: Always returns success to prevent email enumeration attacks.

#### POST `/api/auth/reset-password`
Reset password using a token.

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123"
}
```

**Response** (200):
```json
{
  "message": "Password reset successful"
}
```

**Errors**:
- `400`: Invalid token, weak password, or expired link
- `500`: Server error

## Environment Variables

Required environment variables for authentication:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Usage Examples

### Client-Side Authentication

#### Sign In
```typescript
import { signIn } from 'next-auth/react'

const handleLogin = async (email: string, password: string) => {
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  })
  
  if (result?.ok) {
    router.push('/dashboard')
  } else {
    toast.error('Invalid credentials')
  }
}
```

#### Sign Out
```typescript
import { signOut } from 'next-auth/react'

const handleLogout = async () => {
  await signOut({ callbackUrl: '/login' })
}
```

#### Get Session
```typescript
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Not logged in</div>
  
  return <div>Welcome, {session.user.name}!</div>
}
```

### Server-Side Authentication

#### API Route Protection
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Protected logic here
}
```

#### Page Protection
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  return <div>Protected content</div>
}
```

## Troubleshooting

### Common Issues

#### 1. "Too many login attempts"
**Cause**: Rate limit exceeded (5 attempts in 15 minutes)  
**Solution**: Wait 15 minutes or use the password reset flow

#### 2. "Invalid credentials"
**Cause**: Wrong email/password or account doesn't exist  
**Solution**: Check credentials or use "Forgot Password"

#### 3. "Password reset link expired"
**Cause**: Token is older than 1 hour  
**Solution**: Request a new password reset link

#### 4. Session expires too quickly
**Cause**: JWT expiry set to 24 hours  
**Solution**: This is by design for security. Users need to log in daily.

#### 5. Middleware redirects to login on public pages
**Cause**: Public route not listed in middleware config  
**Solution**: Add route to `publicRoutes` array in `middleware.ts`

## Best Practices

### For Developers

1. **Never log passwords**: Always sanitize logs
2. **Use environment variables**: Never hardcode secrets
3. **Test rate limiting**: Ensure it works in production
4. **Monitor failed logins**: Set up alerts for suspicious activity
5. **Keep dependencies updated**: Regular security updates

### For Users

1. **Use strong passwords**: Follow the 8+ character requirement
2. **Don't share credentials**: Each user should have their own account
3. **Log out on shared devices**: Always sign out when done
4. **Enable 2FA** (when available): Extra layer of security
5. **Report suspicious activity**: Contact support immediately

## Future Enhancements

- [ ] Two-Factor Authentication (2FA)
- [ ] Email verification requirement
- [ ] Social login (GitHub, Twitter)
- [ ] Remember Me functionality (30-day sessions)
- [ ] Account lockout after repeated failures
- [ ] Security audit logs
- [ ] IP-based rate limiting
- [ ] Device management (view/revoke sessions)

## Support

For authentication-related issues:
1. Check this documentation
2. Review error messages in browser console
3. Check Supabase logs for server-side errors
4. Contact support with error details

## License

This authentication system is part of ProAI Writer and follows the same license terms.

