const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');

const notifyAdmins = async (msg) => {
  const admins = await User.find({ role: 'admin' });
  const notifs = admins.map(a => ({ userId: a._id, message: msg, isRead: false }));
  await Notification.insertMany(notifs);
};

exports.registerTeam = async (req, res) => {
  try {
    const { name, players, tournamentId, managerId, logo, contactPhone, contactEmail, teamSize } = req.body;

    
    const size = parseInt(teamSize) || 11; 
    const validPlayers = players.filter(p => p.trim() !== '');
    
    if (validPlayers.length !== size) {
      return res.status(400).json({ message: `You selected ${size}-a-side. You must register exactly ${size} players.` });
    }

    const existing = await Team.findOne({ name, tournamentId });
    if (existing) return res.status(400).json({ message: "Team name already taken in this tournament." });

    const newTeam = await Team.create({
      name,
      players: validPlayers,
      tournamentId,
      managerId,
      logo,
      contactPhone,
      contactEmail,
      teamSize: size,
      status: 'Pending'
    });
    
    await notifyAdmins(`New Registration: ${name} (${size}-a-side)`);
    res.status(201).json({ success: true, team: newTeam });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getTeams = async (req, res) => {
  try {
    const { managerId, tournamentId, status } = req.query;
    let query = {};
    if (managerId) query.managerId = managerId;
    if (tournamentId) query.tournamentId = tournamentId;
    if (status) query.status = status;
    const teams = await Team.find(query).populate('tournamentId', 'name').populate('managerId', 'username email').sort({ createdAt: -1 });
    res.status(200).json(teams);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateTeamStatus = async (req, res) => {
  try {
    const updated = await Team.findByIdAndUpdate(req.params.teamId, { status: req.body.status }, { new: true });
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateTeam = async (req, res) => {
  try {
    const { name, players, logo, contactPhone, contactEmail } = req.body;
    
    
    const currentTeam = await Team.findById(req.params.teamId);
    const size = currentTeam.teamSize || 11;

    const validPlayers = players.filter(p => p.trim() !== '');
    if (validPlayers.length !== size) {
      return res.status(400).json({ message: `This team is registered as ${size}-a-side. You must keep exactly ${size} players.` });
    }

    const updated = await Team.findByIdAndUpdate(
      req.params.teamId, 
      { name, players: validPlayers, logo, contactPhone, contactEmail, status: 'Pending' }, 
      { new: true }
    );
    
    await notifyAdmins(`Team Edited: ${name} (Re-Approval needed)`);
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deleteTeam = async (req, res) => {
  try {
    const { role } = req.body;
    if (role === 'admin') {
      await Team.findByIdAndDelete(req.params.teamId);
      return res.status(200).json({ message: "Deleted." });
    }
    const team = await Team.findById(req.params.teamId);
    if (team.status === 'Pending' || team.status === 'Rejected') {
      await Team.findByIdAndDelete(req.params.teamId);
      return res.status(200).json({ message: "Cancelled." });
    } else {
      team.status = 'Removal Requested';
      await team.save();
      await notifyAdmins(`Removal Request: ${team.name}`);
      return res.status(200).json({ message: "Request sent." });
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
};