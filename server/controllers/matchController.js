const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find().sort({ matchIndex: 1 });
    res.status(200).json(matches);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createMatch = async (req, res) => {
  try {
    const newMatch = await Match.create(req.body);
    res.status(201).json(newMatch);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.updateScore = async (req, res) => {
  const { id } = req.params;
  const { homeScore, awayScore, homePenaltyScore, awayPenaltyScore, venue, kickoffTime } = req.body;

  try {
    const isScoreUpdate = (homeScore !== undefined && homeScore !== '' && homeScore !== null);
    
    // PREVENT DRAWS
    if (isScoreUpdate) {
      const matchToCheck = await Match.findById(id);
      const tournament = await Tournament.findById(matchToCheck.tournamentId);
      
      if (tournament.type === 'Knockout') {
        const h = parseInt(homeScore);
        const a = parseInt(awayScore);
        
        // If regular time is a draw
        if (h === a) {
          const hp = parseInt(homePenaltyScore || 0);
          const ap = parseInt(awayPenaltyScore || 0);
          
          // If penalties are ALSO a draw block it.
          if (hp === ap) {
            return res.status(400).json({ message: "Knockout matches cannot end in a draw. Please enter a valid penalty winner." });
          }
        }
      }
    }

    // Proceed with Update
    const updateData = {};
    if (venue) updateData.venue = venue;
    if (kickoffTime) updateData.kickoffTime = kickoffTime;
    
    if (isScoreUpdate) {
      updateData.homeScore = homeScore;
      updateData.awayScore = awayScore;
      updateData.homePenaltyScore = homePenaltyScore || 0;
      updateData.awayPenaltyScore = awayPenaltyScore || 0;
      updateData.status = 'Played';
    }

    const match = await Match.findByIdAndUpdate(id, updateData, { new: true });
    const tournament = await Tournament.findById(match.tournamentId);

    // Advance Winner
    if (isScoreUpdate && tournament.type === 'Knockout' && match.nextMatchIndex !== null) {
      let winnerName = '';
      const h = parseInt(homeScore);
      const a = parseInt(awayScore);
      
      if (h > a) winnerName = match.homeTeam;
      else if (a > h) winnerName = match.awayTeam;
      else {
        // We know penalties aren't equal because of the check above
        if (parseInt(homePenaltyScore) > parseInt(awayPenaltyScore)) winnerName = match.homeTeam;
        else winnerName = match.awayTeam;
      }
      
      const nextMatch = await Match.findOne({ tournamentId: match.tournamentId, matchIndex: match.nextMatchIndex });
      if (nextMatch) {
        let updateField = {};
        const isHomeSlot = match.matchIndex % 2 === 0;
        if (isHomeSlot) updateField = { homeTeam: winnerName };
        else updateField = { awayTeam: winnerName };
        await Match.findByIdAndUpdate(nextMatch._id, updateField);
      }
    }

    // Notify
    if (isScoreUpdate) {
      const usersToNotify = await User.find({ $or: [{ role: 'manager' }, { role: 'admin' }] });
      const notifs = usersToNotify.map(u => ({
        userId: u._id,
        message: `Match Update: ${match.homeTeam} ${homeScore}-${awayScore} ${match.awayTeam}`,
        isRead: false
      }));
      await Notification.insertMany(notifs);
    }

    res.status(200).json({ success: true, match });
  } catch (error) { res.status(500).json({ error: error.message }); }
};