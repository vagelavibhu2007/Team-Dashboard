# Setup Guide for Campus Event & Volunteer Management System

## 🚀 Quick Setup

### 1. Firebase Configuration

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and create a new project
   - Enable Authentication and Firestore Database

2. **Get Firebase Config**
   - In Project Settings → General → Your apps
   - Copy the Firebase configuration object
   - Replace the config in `config/firebase.js`

3. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable Google sign-in
   - Add your domain to authorized domains

4. **Setup Firestore**
   - Go to Firestore Database
   - Create a new database in test mode
   - Set up security rules (see below)

### 4. Database Indexes

Create the following indexes in Firestore Console for optimal performance:

#### Users Collection Indexes
- **Email Query**: `email` (Ascending) → For user lookup by email
- **Role Query**: `role` (Ascending) → For filtering users by role  
- **Google ID Query**: `googleId` (Ascending) → For Google account matching
- **Last Login**: `lastLogin` (Descending) → For recent user activity

#### Teams Collection Indexes
- **Team Leader Query**: `teamLeaderId` (Ascending) → For getting teams by leader
- **Status Query**: `status` (Ascending) → For filtering active teams

#### Volunteers Collection Indexes
- **Team Query**: `teamId` (Ascending) → For getting volunteers by team
- **Status Query**: `status` (Ascending) → For filtering active volunteers
- **Email Query**: `email` (Ascending) → For volunteer lookup

#### Tasks Collection Indexes
- **Team Query**: `teamId` (Ascending) → For getting tasks by team
- **Volunteer Query**: `assignedTo` (Ascending) → For getting tasks by volunteer
- **Status Query**: `status` (Ascending) → For filtering tasks by status

### 5. Google OAuth Configuration

1. **Get Google Client ID**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API and Google People API
   - Create OAuth 2.0 Client ID
   - Add your domain to authorized JavaScript origins

2. **Update Configuration**
   - Replace `YOUR_GOOGLE_CLIENT_ID` in `config/google-auth.js`
   - Replace `YOUR_FIREBASE_API_KEY` in `config/firebase.js`

### 3. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && resource.data.role == null;
    }
    
    // Team leaders can manage their team volunteers
    match /volunteers/{volunteerId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.teamLeaderId;
    }
    
    // Authenticated users can read events
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
    
    // Team-based task management
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.teamLeaderId;
    }
    
    // Teams management
    match /teams/{teamId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.teamLeaderId;
    }
    
    // User registration and role management
    match /users/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.token.admin == true);
    }
  }
}
```

## 🎯 Features Implemented

### ✅ Authentication
- Google OAuth integration
- Role-based access control
- Session management

### ✅ Role-Based Dashboards
- **Super Admin**: Full system access
- **Admin**: Event management
- **Faculty Coordinator**: Academic oversight
- **Club Coordinator**: Club management
- **Team Leader**: Volunteer management & task assignment
- **Volunteer**: Task viewing & updates
- **Campus Ambassador**: Referral tracking

### ✅ Team Leader Features
- Add volunteers to team
- Assign tasks to volunteers
- Track volunteer status
- Manage team tasks

### ✅ Database Integration
- Firebase Firestore for data persistence
- Real-time updates
- Offline support

## � Database Schema for Google OAuth Integration

### Users Collection Structure
```javascript
{
  uid: "firebase_auth_uid",
  email: "user@gmail.com",
  name: "John Doe",
  photoURL: "https://lh3.googleusercontent.com/...",
  googleId: "123456789012345678901",
  role: "Team Leader" | "Volunteer" | "Admin" | "Faculty Coordinator" | "Club Coordinator" | "Campus Ambassador" | null,
  emailVerified: true,
  createdAt: timestamp,
  lastLogin: timestamp,
  roleSetAt: timestamp,
  referralCode: "CAMPUS-JOHNDOE", // Only for Campus Ambassadors
  profile: {
    phone: "+1234567890",
    department: "Computer Science",
    year: "3rd Year",
    skills: ["JavaScript", "React", "Node.js"],
    interests: ["Web Development", "AI/ML"]
  }
}
```

### Teams Collection Structure
```javascript
{
  teamLeaderId: "firebase_auth_uid",
  teamLeaderName: "John Doe",
  teamName: "Web Development Team",
  description: "Team responsible for web projects",
  createdAt: timestamp,
  members: ["uid1", "uid2", "uid3"],
  status: "active"
}
```

### Volunteers Collection Structure
```javascript
{
  teamId: "team_document_id",
  name: "Jane Smith",
  email: "jane@gmail.com",
  phone: "+1234567890",
  skills: ["Design", "UI/UX"],
  status: "Active" | "Inactive",
  joinedAt: timestamp,
  assignedTasks: ["task1", "task2"]
}
```

## �� Development

### Running Locally
```bash
# Start a local server
python -m http.server 8000

# Or with Node.js
npx serve .
```

### File Structure
```
├── config/
│   ├── firebase.js          # Firebase configuration
│   └── google-auth.js       # Google OAuth setup
├── modules/
│   └── volunteer-management.js  # Team Leader features
├── index.html              # Main application
├── styles.css             # Styling
├── app.js                # Core application logic
└── SETUP.md              # This file
```

## 🚀 Production Deployment

1. **Update Configuration**
   - Replace all placeholder keys with actual values
   - Set up proper domain redirects

2. **Security**
   - Implement proper Firestore security rules
   - Enable Firebase App Check if needed

3. **Testing**
   - Test all roles and permissions
   - Verify Google OAuth flow
   - Test volunteer management features

## 🐛 Troubleshooting

### Google OAuth Issues
- Ensure domain is added to authorized origins
- Check that Google APIs are enabled
- Verify client ID is correct

### Firebase Issues
- Check Firebase project settings
- Verify Firestore rules
- Ensure authentication is enabled

### Volunteer Management Not Showing
- Ensure user is logged in as Team Leader
- Check browser console for errors
- Verify Firebase connection

## 📞 Support

For issues with:
- **Firebase**: Check Firebase Console documentation
- **Google OAuth**: Review Google Cloud Console setup
- **Application**: Check browser console for errors
