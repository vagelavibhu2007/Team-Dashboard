const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['Super Admin', 'Admin', 'Faculty Coordinator', 'Club Coordinator', 'Team Leader', 'Volunteer', 'Campus Ambassador']
  },
  teamId: {
    type: String,
    enum: ['tech-team', 'marketing-team', 'sponsorship-team', 'graphic-team', 'decoration-team', 'production-team', 'media-team', 'pr-team', 'content-team']
  },
  teamName: {
    type: String
  },
  phone: {
    type: String
  },
  department: {
    type: String
  },
  year: {
    type: String
  },
  skills: [{
    type: String
  }],
  interests: [{
    type: String
  }],
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
