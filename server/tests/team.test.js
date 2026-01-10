const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const teamController = require('../controllers/teamController');

// Setup Fake Express App
const app = express();
app.use(express.json());
// Mock the route we want to test
app.post('/api/teams', teamController.registerTeam);

// Setup Fake Database
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Tests
describe('Team Registration Logic', () => {
  
  // TEST CASE 1: Default 11-a-side Validation ---
  it('should REJECT a default team (11-a-side) with missing players', async () => {
    const res = await request(app)
      .post('/api/teams')
      .send({
        name: "Incomplete FC",
        players: ["Player1", "Player2"], // Only 2 players
        // teamSize is missing, so it defaults to 11
        tournamentId: new mongoose.Types.ObjectId(), 
        managerId: new mongoose.Types.ObjectId()     
      });
    
    expect(res.statusCode).toEqual(400);
    // The controller message is dynamic: "You selected 11-a-side. You must register exactly 11 players."
    expect(res.body.message).toContain("register exactly 11 players");
  });

  // TEST CASE 2: Default 11-a-side Success ---
  it('should ACCEPT a default team with exactly 11 players', async () => {
    // Mock database checks
    jest.spyOn(require('../models/Team'), 'findOne').mockResolvedValue(null);
    const mockUser = { _id: new mongoose.Types.ObjectId() };
    jest.spyOn(require('../models/User'), 'find').mockResolvedValue([mockUser]);
    jest.spyOn(require('../models/Notification'), 'insertMany').mockResolvedValue([]);

    const res = await request(app)
      .post('/api/teams')
      .send({
        name: "Pro 11 FC",
        players: Array(11).fill("Player Name"), // Exactly 11
        tournamentId: new mongoose.Types.ObjectId(),
        managerId: new mongoose.Types.ObjectId()
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.team.teamSize).toEqual(11);
  });

  // TEST CASE 3: 5-a-side Validation ---
  it('should REJECT a 5-a-side team if they send 4 players', async () => {
    const res = await request(app)
      .post('/api/teams')
      .send({
        name: "Small Futsal",
        teamSize: 5, // Explicitly asking for 5
        players: ["P1", "P2", "P3", "P4"], // Only 4 players
        tournamentId: new mongoose.Types.ObjectId(),
        managerId: new mongoose.Types.ObjectId()
      });

    expect(res.statusCode).toEqual(400);
    // Expect dynamic message for 5
    expect(res.body.message).toContain("register exactly 5 players");
  });

  // TEST CASE 4: 5-a-side Success ---
  it('should ACCEPT a 5-a-side team with exactly 5 players', async () => {
    jest.spyOn(require('../models/Team'), 'findOne').mockResolvedValue(null);

    const res = await request(app)
      .post('/api/teams')
      .send({
        name: "Valid Futsal",
        teamSize: 5, // Explicitly asking for 5
        players: Array(5).fill("Futsal Player"), // Exactly 5
        tournamentId: new mongoose.Types.ObjectId(),
        managerId: new mongoose.Types.ObjectId()
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.team.teamSize).toEqual(5);
  });

});