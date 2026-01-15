# Admin User Setup Guide

## Overview
This guide explains how to set up the master admin account for testing and administration purposes.

## Admin Account Details
- **Email**: Blaine1@consultant.com
- **Role**: Admin (full access to all courses without subscription)
- **Security**: No credentials stored in code (Firebase Admin Role approach)

## Setup Instructions

### Step 1: Create Firebase Auth Account
1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Email: `Blaine1@consultant.com`
4. Password: `AdminMaster2024!` (or your preferred secure password)
5. Click "Add User"

### Step 2: Set Admin Role in Firestore
1. Go to Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find the document with the user's UID (created in Step 1)
4. Add/Update the following fields:
   ```json
   {
     "email": "Blaine1@consultant.com",
     "isAdmin": true,
     "role": "admin",
     "isSubscribed": true,
     "activeTrial": false
   }
   ```

### Step 3: Verify Admin Access
1. Log in to the application with the admin credentials
2. Navigate to course content
3. Verify that all lessons are accessible (no "Premium" or "Subscription required" messages)

## How Admin Access Works

### Code Implementation
- Admin users bypass subscription checks
- Access is granted based on `userProfile.isAdmin` or `userProfile.role === 'admin'`
- No hardcoded credentials in the codebase (secure approach)

### Access Logic
```typescript
const isAdmin = userProfile?.role === 'admin' || userProfile?.isAdmin || false;
const userIsSubscribed = userProfile?.isSubscribed || userProfile?.activeTrial || isAdmin;
```

### Security Features
- ✅ No credentials in public repository
- ✅ Role-based access control
- ✅ Can be toggled in Firestore without code changes
- ✅ Scalable for multiple admin users

## Troubleshooting

### Admin Access Not Working
1. Check Firestore user document has correct admin fields
2. Verify user is logged in with correct email
3. Check browser console for any Firebase errors
4. Ensure user profile is being fetched correctly

### Adding Additional Admins
1. Create new Firebase Auth user
2. Add admin fields to their Firestore user document
3. No code changes required

## Production Considerations
- Consider using Firebase Custom Claims for production
- Implement admin user management interface
- Add audit logging for admin actions
- Regular review of admin user list

