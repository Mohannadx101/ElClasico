const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  type:      { type: String, enum: ['Knockout', 'League'], required: true },
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },
  location:  { type: String, required: true },
  status:    { type: String, enum: ['Open', 'Upcoming', 'Ongoing', 'Active', 'Finished'], default: 'Open' }
});

module.exports = mongoose.model('Tournament', tournamentSchema);