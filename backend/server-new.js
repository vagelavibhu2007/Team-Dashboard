const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Team = require('./models/Team');
const Task = require('./models/Task');
const Event = require('./models/Event');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-event-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Initialize predefined teams
const predefinedTeams = [
  { id: "tech-team", name: "Tech Team", description: "Technical support and development" },
  { id: "marketing-team", name: "Marketing Team", description: "Marketing and promotion" },
  { id: "sponsorship-team", name: "Sponsorship Team", description: "Sponsorship and fundraising" },
  { id: "graphic-team", name: "Graphic Team", description: "Graphic design and visuals" },
  { id: "decoration-team", name: "Decoration Team", description: "Event decoration and setup" },
  { id: "production-team", name: "Production Team", description: "Event production and logistics" },
  { id: "media-team", name: "Media Team", description: "Media coverage and photography" },
  { id: "pr-team", name: "PR Team", description: "Public relations and communications" },
  { id: "content-team", name: "Content Team", description: "Content creation and management" }
];

const initializeTeams = async () => {
  for (const team of predefinedTeams) {
    const existingTeam = await Team.findOne({ id: team.id });
    if (!existingTeam) {
      await Team.create(team);
    }
  }
};

// API Routes

// User Registration/Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, role, teamId } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    if ((role === 'Team Leader' || role === 'Volunteer') && !teamId) {
      return res.status(400).json({ error: 'Team selection is required for Team Leaders and Volunteers' });
    }

    // Generate email from name
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      user = new User({
        name,
        email,
        role,
        teamId,
        teamName: teamId ? predefinedTeams.find(t => t.id === teamId)?.name : null,
        password: 'default123' // Default password for demo
      });
      
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
        teamName: user.teamName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get teams
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await Team.find({ status: 'active' });
    res.json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get team members
app.get('/api/teams/:teamId/members', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const members = await User.find({ teamId, role: { $in: ['Team Leader', 'Volunteer'] } });
    res.json({ success: true, members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, assignedTo, teamId, priority, deadline } = req.body;
    
    const task = new Task({
      title,
      description,
      assignedTo,
      teamId,
      priority: priority || 'medium',
      deadline,
      createdBy: req.userId
    });
    
    await task.save();
    
    // Populate assigned user info
    await task.populate('assignedTo', 'name email');
    
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks for user
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    let tasks;
    
    if (user.role === 'Team Leader') {
      // Team leaders see all tasks for their team
      tasks = await Task.find({ teamId: user.teamId })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Volunteers see only their assigned tasks
      tasks = await Task.find({ assignedTo: req.userId })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }
    
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status
app.put('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.status = status;
    task.updatedAt = new Date();
    await task.save();
    
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const { title, description, date, location, limit, price, coordinatorType } = req.body;
    
    const event = new Event({
      title,
      description,
      date,
      location,
      limit,
      price: price || 0,
      coordinatorType: coordinatorType || 'faculty',
      createdBy: req.userId
    });
    
    await event.save();
    
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get events
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    let events;
    
    if (user.role === 'Super Admin' || user.role === 'Admin') {
      events = await Event.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    } else if (user.role === 'Faculty Coordinator') {
      events = await Event.find({ coordinatorId: req.userId }).populate('createdBy', 'name email').sort({ createdAt: -1 });
    } else if (user.role === 'Club Coordinator') {
      events = await Event.find({ coordinatorType: 'club' }).populate('createdBy', 'name email').sort({ createdAt: -1 });
    } else {
      events = await Event.find({ status: { $in: ['upcoming', 'ongoing'] } }).populate('createdBy', 'name email').sort({ date: 1 });
    }
    
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    let stats = {};
    
    if (user.role === 'Super Admin') {
      stats.totalUsers = await User.countDocuments();
      stats.totalEvents = await Event.countDocuments();
      stats.totalTasks = await Task.countDocuments();
      stats.activeTeams = await Team.countDocuments({ status: 'active' });
    } else if (user.role === 'Admin') {
      stats.totalEvents = await Event.countDocuments({ createdBy: req.userId });
      stats.pendingRegistrations = 0; // To be implemented
      stats.totalTasks = await Task.countDocuments();
    } else if (user.role === 'Team Leader') {
      stats.teamMembers = await User.countDocuments({ teamId: user.teamId });
      stats.totalTasks = await Task.countDocuments({ teamId: user.teamId });
      stats.completedTasks = await Task.countDocuments({ teamId: user.teamId, status: 'completed' });
    } else if (user.role === 'Volunteer') {
      stats.myTasks = await Task.countDocuments({ assignedTo: req.userId });
      stats.completedTasks = await Task.countDocuments({ assignedTo: req.userId, status: 'completed' });
    } else if (user.role === 'Campus Ambassador') {
      stats.referralCode = user.referralCode;
      stats.referrals = 0; // To be implemented
    }
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize teams and start server
initializeTeams().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('📊 MongoDB connected');
    console.log('🔗 API endpoints available at /api/');
  });
});
