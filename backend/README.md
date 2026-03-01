# Backend API Server

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
PORT=3001
REDIRECT_URI=http://localhost:3001/auth/google/callback
FRONTEND_URL=http://localhost:8000
```

### 3. Firebase Service Account
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Generate new private key
4. Download JSON file and save as `service-account-key.json` in backend folder

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Handle OAuth callback

### User Management
- `POST /api/set-role` - Set user role
- `GET /api/user/:uid` - Get user profile

### Team Management
- `GET /api/teams/:teamLeaderId` - Get teams for team leader
- `POST /api/volunteers` - Add volunteer to team
- `GET /api/volunteers/:teamId` - Get volunteers for team
- `POST /api/tasks` - Assign task to volunteer
- `GET /api/tasks/:teamId` - Get tasks for team

## 🔧 Google OAuth Setup

### 1. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API and Google People API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3001/auth/google/callback`

### 2. Firebase Setup
1. Enable Authentication in Firebase Console
2. Enable Google sign-in provider
3. Add your domain to authorized domains
4. Setup Firestore Database

## 🧪 Testing

### Test Google OAuth Flow
1. Start backend server: `npm run dev`
2. Start frontend server: `python -m http.server 8000`
3. Open browser to `http://localhost:8000`
4. Click "Continue with Google"
5. Complete Google sign-in
6. Select role and verify dashboard access

### Test Team Leader Features
1. Sign in as Team Leader
2. Go to Tasks module
3. Add volunteers and assign tasks
4. Verify data persistence in Firebase

## 🔒 Security

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Team leaders can manage their team data
    match /teams/{teamId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.teamLeaderId;
    }
    
    match /volunteers/{volunteerId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.teamLeaderId;
    }
    
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.teamLeaderId;
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues
1. **Google OAuth Redirect Error**
   - Check redirect URI in Google Cloud Console
   - Verify environment variables

2. **Firebase Connection Error**
   - Verify service account key file
   - Check Firebase project settings

3. **CORS Issues**
   - Frontend URL must be in environment variables
   - Check CORS configuration

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 📱 Development

### File Structure
```
backend/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── .env.example          # Environment template
├── service-account-key.json # Firebase service account
└── README.md            # This file
```

### API Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": "Error message if success=false"
}
```
