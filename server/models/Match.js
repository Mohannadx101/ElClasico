const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  homeTeam: { type: String, default: 'TBD' },
  awayTeam: { type: String, default: 'TBD' },
  
 
  homeScore: { type: Number, default: null },
  awayScore: { type: Number, default: null },
  

  homePenaltyScore: { type: Number, default: 0 },
  awayPenaltyScore: { type: Number, default: 0 },


  venue: { type: String, default: 'TBD' },
  kickoffTime: { type: Date }, 

  date: { type: Date }, 
  status: { type: String, enum: ['Scheduled', 'Played'], default: 'Scheduled' },
  
  
  round: { type: Number, default: 1 },        
  matchIndex: { type: Number },
  nextMatchIndex: { type: Number, default: null }
});

module.exports = mongoose.model('Match', matchSchema);