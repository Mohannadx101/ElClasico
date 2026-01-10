const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');

exports.createTournament = async (req, res) => {
  try {
    
    const { name, type, startDate, endDate, location } = req.body;

    // VALIDATION: Check for missing fields
    if (!name || !startDate || !endDate || !location) {
      return res.status(400).json({ message: "All fields (Name, Location, Dates) are required." });
    }

    // VALIDATION: End Date
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    // Status is 'Open' by default so teams can register immediately
    const newT = await Tournament.create({ 
      name, type, startDate, endDate, location, status: 'Open' 
    });
    res.status(201).json(newT);
  } catch (error) { 
    console.error("Create Error:", error);
    res.status(500).json({ message: error.message }); 
  }
};

exports.getTournaments = async (req, res) => {
  try {
    const t = await Tournament.find().sort({ startDate: -1 });
    
    // Auto-Status Update
    const today = new Date();
    const updated = await Promise.all(t.map(async (tourney) => {
      let status = tourney.status;
      const start = new Date(tourney.startDate);
      const end = new Date(tourney.endDate);

      // Only auto-update if it's not manually set to Open
      if (status !== 'Open' && status !== 'Finished') {
        if (end < today) status = 'Finished';
        else if (start <= today && end >= today) status = 'Ongoing';
        else if (start > today) status = 'Upcoming';
      }
      
      if (status !== tourney.status) {
        tourney.status = status;
        await tourney.save();
      }
      return tourney;
    }));

    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteTournament = async (req, res) => {
  try {
    await Tournament.findByIdAndDelete(req.params.id);
    await Match.deleteMany({ tournamentId: req.params.id });
    await Team.deleteMany({ tournamentId: req.params.id });
    res.status(200).json({ message: "Deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.generateFixtures = async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const t = await Tournament.findById(tournamentId);
    const teams = await Team.find({ tournamentId, status: 'Approved' });

    await Match.deleteMany({ tournamentId });

    let fixtures = [];

    if (t.type === 'League') {
      if (teams.length < 2) return res.status(400).json({ message: "League needs 2+ teams." });
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          fixtures.push({
            tournamentId, homeTeam: teams[i].name, awayTeam: teams[j].name,
            date: t.startDate, status: 'Scheduled', round: 1, venue: t.location
          });
        }
      }
    } 
    else if (t.type === 'Knockout') {
      const count = teams.length;
      const isPowerOf2 = (Math.log2(count) % 1 === 0) && count >= 4 && count <= 64;
      if (!isPowerOf2) return res.status(400).json({ message: `Knockout requires 4, 8, 16, 32, 64 teams. Current: ${count}.` });

      const shuffled = teams.sort(() => 0.5 - Math.random());
      let matchIndex = 0, roundMatches = count / 2, totalRounds = Math.log2(count), roundStartId = 0;

      // Round 1
      for (let i = 0; i < count; i += 2) {
        const nextMatchId = roundStartId + roundMatches + Math.floor((matchIndex - roundStartId) / 2);
        fixtures.push({
          tournamentId, homeTeam: shuffled[i].name, awayTeam: shuffled[i+1].name,
          round: 1, matchIndex: matchIndex, venue: t.location,
          nextMatchIndex: (matchIndex === count - 2) ? null : nextMatchId
        });
        matchIndex++;
      }
      roundStartId += roundMatches; roundMatches /= 2;

      // Future Rounds
      for (let r = 2; r <= totalRounds; r++) {
        for (let i = 0; i < roundMatches; i++) {
          const nextMatchId = roundStartId + roundMatches + Math.floor((matchIndex - roundStartId) / 2);
          fixtures.push({
            tournamentId, homeTeam: 'TBD', awayTeam: 'TBD',
            round: r, matchIndex: matchIndex, venue: t.location,
            nextMatchIndex: (r === totalRounds) ? null : nextMatchId
          });
          matchIndex++;
        }
        roundStartId += roundMatches; roundMatches /= 2;
      }
    }

    await Match.insertMany(fixtures);
    t.status = 'Ongoing';
    await t.save();
    res.status(200).json({ message: "Generated", matches: fixtures });
  } catch (error) { res.status(500).json({ message: error.message }); }
};