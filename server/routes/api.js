const express = require('express');
const router = express.Router();

// Import Controller Modules
// they contain the business logic for features
const authController = require('../controllers/authController');
const matchController = require('../controllers/matchController');
const notificationController = require('../controllers/notificationController');
const tournamentController = require('../controllers/tournamentController'); 
const teamController = require('../controllers/teamController'); 
const liveScoreController = require('../controllers/liveScoreController');
const minigameController = require('../controllers/minigameController'); // NEW

// Auth
// creates a new user account
router.post('/register', authController.register);
// auth user credintals and return user object
router.post('/login',    authController.login);

// Tournaments
// Creates new tournament entity
router.post('/tournaments',          tournamentController.createTournament);
// Retrieves all tournaments, sorted by date
router.get('/tournaments',           tournamentController.getTournaments);
// Deletes a tournament
router.delete('/tournaments/:id',    tournamentController.deleteTournament);
// for leagues generates round robin pairs
// for knock out validates power of 2 and generates brackets
router.post('/tournaments/:tournamentId/start', tournamentController.generateFixtures);

// Teams
// create a pending team
router.post('/teams',           teamController.registerTeam);
// retreieve teams
router.get('/teams',            teamController.getTeams);
// admin route to approve or reject a team
router.put('/teams/:teamId/status', teamController.updateTeamStatus);
// manager route to edit team details
// resets to pending
router.put('/teams/:teamId',    teamController.updateTeam);
// admin delete or manager requesting delete
router.delete('/teams/:teamId', teamController.deleteTeam);

// Matches
// retrieve matches
router.get('/matches',       matchController.getAllMatches);
// create matches manually
router.post('/matches',      matchController.createMatch);
// match update
router.put('/matches/:id',   matchController.updateScore);

// Notifications
// fetch user's notifications
router.get('/notifications/:userId', notificationController.getMyNotifications);
// mark single notification as read
router.put('/notifications/:notificationId/read', notificationController.markAsRead);
//mark all as read
router.put('/notifications/user/:userId/read-all', notificationController.markAllRead);

// Live Scores hides api key from frontend
router.get('/live-scores', liveScoreController.getMatches);

//guess the player
router.get('/minigame/new', minigameController.getNewGame);
router.post('/minigame/check', minigameController.checkAnswer);
router.post('/minigame/hint', minigameController.deductHintCost);

module.exports = router;