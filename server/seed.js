require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');
const Tournament = require('./models/Tournament');
const Match = require('./models/Match');
const Notification = require('./models/Notification');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📦 Connected to MongoDB...');

    // Clear All Data
    console.log('🔥 Clearing old data...');
    await User.deleteMany({});
    await Team.deleteMany({});
    await Tournament.deleteMany({});
    await Match.deleteMany({});
    await Notification.deleteMany({});

    // Create Users
    console.log('👤 Creating Users...');
    const admin = await User.create({
      username: 'admin',
      email: 'admin@elclasico.com',
      password: 'admin', 
      role: 'admin'
    });

    const manager = await User.create({
      username: 'manager',
      email: 'manager@elclasico.com',
      password: 'manager',
      role: 'manager'
    });

    console.log('✅ Database Reset Complete!');
    console.log('👉 Login with: admin / admin');
    console.log('👉 Login with: manager / manager');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();