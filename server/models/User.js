const mongoose = require('mongoose');
// database schema for the user
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true },
  password: { type: String, required: true }, 
  role:     { type: String, enum: ['admin', 'manager'], default: 'manager' },

  coins:    { type: Number, default: 100 }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);