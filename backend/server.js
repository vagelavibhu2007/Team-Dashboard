const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const firebase = require('firebase-admin');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});

const db = firebase.firestore();
const auth = firebase.auth();

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3001/auth/google/callback';

const oauth2Client = new google.auth.OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// API Routes

// Simple User Registration (Non-Google)
app.post('/api/register', async (req, res) => {
  try {
    const { name, role, teamId } = req.body;
    
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }
    
    if ((role === 'Team Leader' || role === 'Volunteer') && !teamId) {
      return res.status(400).json({ error: 'Team selection is required for Team Leaders and Volunteers' });
    }
    
    // Generate unique user ID
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      uid: userId,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
      displayName: name,
      emailVerified: true
    });
    
    // Get team details if applicable
    let teamName = null;
    if (teamId) {
      const teamDoc = await db.collection('teams').doc(teamId).get();
      if (teamDoc.exists) {
        teamName = teamDoc.data().name;
        
        // Add user to team members
        await db.collection('teams').doc(teamId).update({
          members: firebase.firestore.FieldValue.arrayUnion(userId)
        });
      }
    }
    
    // Store user data in Firestore
    await db.collection('users').doc(userId).set({
      uid: userId,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
      name: name,
      role: role,
      teamId: teamId,
      teamName: teamName,
      emailVerified: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      profile: {
        phone: null,
        department: null,
        year: null,
        skills: [],
        interests: []
      }
    });
    
    // Create custom token for frontend
    const customToken = await auth.createCustomToken(userId);
    
    res.json({ 
      success: true, 
      token: customToken,
      user: {
        uid: userId,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
        name: name,
        role: role,
        teamId: teamId,
        teamName: teamName
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google OAuth Login Route
app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    state: JSON.stringify({ returnTo: req.query.returnTo || '/' })
  });
  
  res.redirect(authUrl);
});

// Google OAuth Callback
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { returnTo } = state ? JSON.parse(state) : { returnTo: '/' };
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    // Create or update user in Firebase
    const userRecord = await auth.getUserByEmail(userInfo.email).catch(async () => {
      // User doesn't exist, create new user
      return await auth.createUser({
        email: userInfo.email,
        displayName: userInfo.name,
        photoURL: userInfo.picture,
        emailVerified: true
      });
    });
    
    // Create custom token for frontend
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    // Store user data in Firestore with enhanced schema
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userInfo.email,
      name: userInfo.name,
      photoURL: userInfo.picture,
      googleId: userInfo.id,
      role: null, // Will be set during role selection
      emailVerified: userInfo.verified_email || true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      profile: {
        phone: null,
        department: null,
        year: null,
        skills: [],
        interests: []
      }
    }, { merge: true });
    
    // Redirect to frontend with token
    res.redirect(`http://localhost:8000/auth-success?token=${customToken}&user=${encodeURIComponent(JSON.stringify({
      uid: userRecord.uid,
      email: userInfo.email,
      name: userInfo.name,
      photoURL: userInfo.picture
    }))}`);
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`http://localhost:8000/auth-error?error=${encodeURIComponent(error.message)}`);
  }
});

// Set User Role
app.post('/api/set-role', async (req, res) => {
  try {
    const { uid, role } = req.body;
    
    if (!uid || !role) {
      return res.status(400).json({ error: 'UID and role are required' });
    }
    
    // Update user role in Firestore
    await db.collection('users').doc(uid).update({
      role: role,
      roleSetAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Create additional role-specific data
    if (role === 'Campus Ambassador') {
      const referralCode = generateReferralCode(req.body.name);
      await db.collection('users').doc(uid).update({
        referralCode: referralCode,
        roleSetAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    if (role === 'Team Leader') {
      // Create team for team leader with enhanced structure
      await db.collection('teams').add({
        teamLeaderId: uid,
        teamLeaderName: req.body.name,
        teamName: `${req.body.name}'s Team`,
        description: `Team led by ${req.body.name}`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        members: [],
        status: 'active'
      });
    }
    
    // Update role set timestamp for all roles
    await db.collection('users').doc(uid).update({
      roleSetAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, role });
    
  } catch (error) {
    console.error('Set role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get User Profile
app.get('/api/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ id: userDoc.id, ...userDoc.data() });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Teams for Team Leader
app.get('/api/teams/:teamLeaderId', async (req, res) => {
  try {
    const { teamLeaderId } = req.params;
    
    const teamsSnapshot = await db.collection('teams')
      .where('teamLeaderId', '==', teamLeaderId)
      .get();
    
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(teams);
    
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add Volunteer to Team with enhanced schema
app.post('/api/volunteers', async (req, res) => {
  try {
    const { teamId, name, email, phone, skills } = req.body;
    
    const volunteer = await db.collection('volunteers').add({
      teamId,
      name,
      email,
      phone,
      skills: skills || [],
      status: 'Active',
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
      assignedTasks: []
    });
    
    res.json({ id: volunteer.id, ...req.body });
    
  } catch (error) {
    console.error('Add volunteer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Volunteers for Team
app.get('/api/volunteers/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const volunteersSnapshot = await db.collection('volunteers')
      .where('teamId', '==', teamId)
      .get();
    
    const volunteers = volunteersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(volunteers);
    
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign Task to Volunteer with enhanced schema
app.post('/api/tasks', async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      status: 'todo',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      priority: req.body.priority || 'medium',
      dueDate: req.body.dueDate || null
    };
    
    const task = await db.collection('tasks').add(taskData);
    res.json({ id: task.id, ...taskData });
    
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Tasks for Team
app.get('/api/tasks/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const tasksSnapshot = await db.collection('tasks')
      .where('teamId', '==', teamId)
      .get();
    
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
    
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Utility Functions
function generateReferralCode(name) {
  const slug = String(name)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 14);
  return `CAMPUS-${slug || 'AMB'}`;
}

// Initialize predefined teams
async function initializePredefinedTeams() {
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

  for (const team of predefinedTeams) {
    const teamRef = db.collection('teams').doc(team.id);
    const teamDoc = await teamRef.get();
    
    if (!teamDoc.exists) {
      await teamRef.set({
        id: team.id,
        name: team.name,
        description: team.description,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        members: [],
        status: 'active'
      });
    }
  }
}

// Initialize teams on server start
initializePredefinedTeams().catch(console.error);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Google OAuth redirect: ${REDIRECT_URI}`);
  console.log('🔗 API endpoints available at /api/');
});
