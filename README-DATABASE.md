# Database Setup Guide

## 🚀 Quick Setup with MongoDB

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your configuration
MONGODB_URI=mongodb://localhost:27017/campus-event-management
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
```

### 3. Start MongoDB
```bash
# Make sure MongoDB is running
mongod
```

### 4. Start the Backend Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Access the Dashboard
Open `dashboard.html` in your browser:
```
http://localhost:8000/dashboard.html
```

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  role: String (required, enum),
  teamId: String (enum),
  teamName: String,
  phone: String,
  department: String,
  year: String,
  skills: [String],
  interests: [String],
  referralCode: String (unique, sparse),
  createdAt: Date,
  lastLogin: Date
}
```

### Teams Collection
```javascript
{
  id: String (required, unique),
  name: String (required),
  description: String (required),
  teamLeaderId: ObjectId (ref: User),
  teamLeaderName: String,
  members: [ObjectId] (ref: User),
  status: String (enum: ['active', 'inactive']),
  createdAt: Date
}
```

### Tasks Collection
```javascript
{
  title: String (required),
  description: String,
  assignedTo: ObjectId (ref: User),
  assignedToName: String,
  teamId: String (required),
  teamName: String,
  status: String (enum: ['todo', 'in_progress', 'completed']),
  priority: String (enum: ['low', 'medium', 'high']),
  deadline: Date,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Events Collection
```javascript
{
  title: String (required),
  description: String (required),
  date: Date (required),
  location: String (required),
  limit: Number (required),
  price: Number (default: 0),
  coordinatorType: String (enum: ['faculty', 'club']),
  coordinatorId: ObjectId (ref: User),
  status: String (enum: ['upcoming', 'ongoing', 'completed', 'cancelled']),
  registrations: [ObjectId] (ref: User),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:teamId/members` - Get team members

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get tasks (filtered by user role)
- `PUT /api/tasks/:taskId` - Update task status

### Events
- `POST /api/events` - Create event
- `GET /api/events` - Get events (filtered by user role)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🎯 Role-Based Access

### Super Admin
- Full system access
- Create/Delete Admins
- Manage permissions
- View all reports

### Admin
- Create/Edit/Delete events
- Assign coordinators & team leads
- Approve registrations
- View reports

### Faculty Coordinator
- View assigned events
- Monitor progress
- Approve requests

### Club Coordinator
- Manage club events
- Manage volunteers
- View registrations

### Team Leader
- View assigned tasks
- Update task status
- Manage team members

### Volunteer
- View assigned tasks
- Update task progress

### Campus Ambassador
- Unique referral code
- Track referrals & registrations

## 🚀 Features

✅ **MongoDB Integration** - All data stored in MongoDB database
✅ **JWT Authentication** - Secure token-based authentication
✅ **Role-Based Dashboard** - Different modules for different roles
✅ **Real-time Updates** - Dashboard updates with live data
✅ **Team Management** - Team leaders can manage their volunteers
✅ **Task Assignment** - Create and assign tasks to team members
✅ **Event Management** - Create and manage events
✅ **Responsive Design** - Works on all device sizes

## 🛠️ Development

### Running Locally
```bash
# Start MongoDB
mongod

# Start backend server
cd backend
npm run dev

# Open dashboard in browser
# Serve the frontend files (using any static server)
python -m http.server 8000
# Then visit http://localhost:8000/dashboard.html
```

### Default Login Credentials
The system creates users automatically. Simply enter:
- Name: Any name
- Role: Select from dropdown
- Team: (if Team Leader or Volunteer)

The system will generate an email and create the user automatically.
