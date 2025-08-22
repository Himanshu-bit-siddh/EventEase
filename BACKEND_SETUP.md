# EventEase Backend Setup Guide

## Overview
This is a comprehensive backend implementation for the EventEase application based on the requirements from the PDF. The backend provides robust user authentication, event management, RSVP handling, check-in functionality, and comprehensive admin controls.

## Features Implemented

### 🔐 Authentication & Authorization
- **User Roles**: ADMIN, STAFF, OWNER with granular permissions
- **JWT-based Sessions**: Secure cookie-based authentication
- **Role-Based Access Control (RBAC)**: Comprehensive permission system
- **Rate Limiting**: Per-IP and per-user rate limiting for security

### 📅 Event Management
- **Event Creation**: Full event details with custom fields support
- **Event Customization**: Tags, images, registration deadlines, waitlist support
- **Member Management**: Add/remove staff members to events
- **Public/Private Events**: Control event visibility

### 📝 RSVP & Registration
- **Public RSVP**: Anonymous users can register for public events
- **Custom Fields**: Dynamic form fields for event-specific information
- **Waitlist Management**: Automatic waitlist when events are full
- **Registration Export**: CSV export for attendee data

### ✅ Check-in System
- **Participant Check-in**: Mark attendees as present
- **Check-out**: Handle no-shows and cancellations
- **Bulk Operations**: Check-in multiple participants at once
- **Statistics**: Real-time check-in rates and analytics

### 💬 Interaction System
- **Event Interactions**: Comments, likes, shares, photos, feedback
- **Content Moderation**: Staff and admin moderation capabilities
- **Anonymous Interactions**: Limited anonymous participation
- **Moderation Tools**: Bulk moderation and content filtering

### 👥 User Management
- **User Registration**: Email-based user accounts
- **Role Management**: Admin can change user roles
- **User Analytics**: Track user activity and permissions

### 🏗️ Admin Controls
- **System Statistics**: Comprehensive system overview
- **Event Analytics**: Detailed event performance metrics
- **User Management**: Full user administration
- **System Health**: Database and system monitoring

## Database Models

### User Model
- Email, password hash, role, timestamps
- Password comparison method
- Role-based access control

### Event Model
- Title, description, dates, location
- Custom fields support
- Tags, images, registration limits
- Public/private visibility

### Participant Model
- Name, email, phone
- Custom field responses
- Notes and metadata

### Registration Model
- Event and participant references
- Status tracking (REGISTERED, CHECKED_IN, WAITLISTED, etc.)
- Waitlist position management
- Source tracking (web, mobile, etc.)

### EventMember Model
- Event staff assignments
- Role-based permissions within events
- Member management

### Interaction Model
- Event interactions and engagement
- Content moderation
- User and participant references

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - List events (filtered by user role)
- `POST /api/events` - Create new event
- `GET /api/events/[id]` - Get event details
- `PATCH /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

### Event Management
- `POST /api/events/[id]/members` - Add event member
- `DELETE /api/events/[id]/members` - Remove event member
- `GET /api/events/[id]/registrations` - Get event registrations
- `GET /api/events/[id]/interactions` - Get event interactions

### RSVP & Registration
- `POST /api/rsvp` - Public event registration
- `GET /api/events/[id]/registrations?export=csv` - Export registrations

### Check-in
- `POST /api/checkin` - Check-in participant
- `GET /api/checkin?eventId=[id]` - Get check-in statistics

### Interactions
- `POST /api/events/[id]/interactions` - Create interaction
- `GET /api/events/[id]/interactions` - List interactions
- `PATCH /api/events/[id]/interactions` - Moderate interaction
- `DELETE /api/events/[id]/interactions` - Delete interaction

### Public Access
- `GET /api/public/events/search` - Search public events
- `GET /api/public/events/[id]` - Get public event details
- `GET /api/public/events/[id]?stats=true` - Get public event statistics

### Admin
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users` - Update user role
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/stats?type=health` - System health
- `GET /api/admin/events/[id]/analytics` - Event analytics

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/eventease
MONGODB_DB_NAME=eventease

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_TOKEN=your-super-secret-jwt-key-here

# Application Configuration
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Security
CORS_ORIGIN=http://localhost:3000
SECURE_COOKIES=false
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up MongoDB
- Install MongoDB locally or use MongoDB Atlas
- Create a database named `eventease`
- Update the `MONGODB_URI` in your environment file

### 3. Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Use the output as your `JWT_SECRET`

### 4. Run the Application
```bash
npm run dev
```

### 5. Create Initial Admin User
Use the registration endpoint to create your first admin user, then manually update the role in the database to "ADMIN".

## Security Features

- **JWT Token Security**: HttpOnly cookies with secure flags
- **Rate Limiting**: Per-IP and per-user rate limiting
- **Input Validation**: Comprehensive Zod schema validation
- **SQL Injection Protection**: Mongoose ODM with parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: SameSite cookie attributes

## Performance Features

- **Database Indexing**: Optimized indexes for common queries
- **Connection Pooling**: MongoDB connection management
- **Query Optimization**: Efficient aggregation pipelines
- **Pagination**: Offset-based pagination for large datasets

## Monitoring & Analytics

- **System Health**: Database connectivity and system metrics
- **Event Analytics**: Registration rates, check-in statistics
- **User Analytics**: Role distribution and activity tracking
- **Performance Metrics**: Response times and error rates

## Future Enhancements

- **Email Notifications**: RSVP confirmations and reminders
- **File Uploads**: Event images and document attachments
- **Real-time Updates**: WebSocket support for live interactions
- **Advanced Search**: Full-text search with Elasticsearch
- **Mobile API**: Optimized endpoints for mobile applications
- **Webhook Support**: External service integrations
- **Audit Logging**: Comprehensive activity tracking

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify MongoDB is running
   - Check connection string format
   - Ensure network access

2. **JWT Errors**
   - Verify JWT_SECRET is set
   - Check cookie settings
   - Clear browser cookies

3. **Rate Limiting Issues**
   - Check rate limit configuration
   - Verify Redis connection (if using)
   - Monitor request patterns

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=eventease:*
```

## Support

For technical support or questions about the backend implementation, please refer to the code comments and this documentation. The backend is designed to be production-ready with comprehensive error handling and logging. 