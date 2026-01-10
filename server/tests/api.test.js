const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const apiRoutes = require('../routes/api');
const axios = require('axios');


// Mock External APIs
jest.mock('axios');
axios.get.mockResolvedValue({ data: { response: [] } }); // Default mock

// Setup Fake App
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

let mongoServer;

// Start In-Memory DB before tests #fake database
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Clean up after tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// --- TESTS ---

describe('ElClasico Backend Tests', () => {
  
  let adminId, tournamentId, matchId;

  // TEST 1: Authentication
  it('1. Registers a new Manager', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'TestManager', email: 'test@test.com', password: '123', role: 'manager'
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.user.username).toBe('TestManager');
  });

  it('2. Logs in successfully', async () => {
    const res = await request(app).post('/api/login').send({
      username: 'TestManager', password: '123'
    });
    expect(res.statusCode).toEqual(200);
    adminId = res.body.user._id; // Save for later
  });

  it('3. Fails login with wrong password', async () => {
    const res = await request(app).post('/api/login').send({
      username: 'TestManager', password: 'WRONG_PASSWORD'
    });
    expect(res.statusCode).toEqual(401);
  });

  // TEST 2: Tournaments
  it('4. Creates a Tournament', async () => {
    const res = await request(app).post('/api/tournaments').send({
      name: 'Summer Cup', type: 'League', startDate: '2025-06-01', endDate: '2025-06-30', location: 'Cairo'
    });
    expect(res.statusCode).toEqual(201);
    tournamentId = res.body._id;
  });

  it('5. Fails to create Tournament with invalid dates', async () => {
    const res = await request(app).post('/api/tournaments').send({
      name: 'Bad Cup', type: 'League', startDate: '2025-06-30', endDate: '2025-06-01', location: 'Cairo'
    });
    expect(res.statusCode).toEqual(400); // End before Start
  });

  it('6. Fetches all Tournaments', async () => {
    const res = await request(app).get('/api/tournaments');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });

  // TEST 3: Teams
  it('7. Registers a Valid Team (11 Players)', async () => {
    const players = Array(11).fill('Player Name');
    const res = await request(app).post('/api/teams').send({
      name: 'Winners FC', players, tournamentId, managerId: adminId
    });
    expect(res.statusCode).toEqual(201);
  });

  it('8. Fails to register Team with 5 Players (Validation)', async () => {
    const players = Array(5).fill('Player Name');
    const res = await request(app).post('/api/teams').send({
      name: 'Losers FC', players, tournamentId, managerId: adminId
    });
    expect(res.statusCode).toEqual(400); // Expect 11 players by default
  });

  it('9. Fails to register Duplicate Team Name', async () => {
    const players = Array(11).fill('Player Name');
    const res = await request(app).post('/api/teams').send({
      name: 'Winners FC', players, tournamentId, managerId: adminId
    });
    expect(res.statusCode).toEqual(400); // Name taken
  });

  it('10. Fetches Teams', async () => {
    const res = await request(app).get('/api/teams');
    expect(res.statusCode).toEqual(200);
    expect(res.body[0].name).toBe('Winners FC');
  });

  // TEST 4: Matches & System
  it('11. Creates a Match Manually (Admin)', async () => {
    const res = await request(app).post('/api/matches').send({
      tournamentId, homeTeam: 'Team A', awayTeam: 'Team B', date: '2025-06-15'
    });
    expect(res.statusCode).toEqual(201);
    matchId = res.body._id;
  });

  it('12. Updates Match Score', async () => {
    const res = await request(app).put(`/api/matches/${matchId}`).send({
      homeScore: 2, awayScore: 1
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.match.status).toBe('Played');
  });

  it('13. Fetches Notifications', async () => {
    const res = await request(app).get(`/api/notifications/${adminId}`);
    expect(res.statusCode).toEqual(200);
    // Should have notification from Team Registration
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('14. Fetches Live Scores (Mocked API)', async () => {
    // Mock successful response from external API
    axios.get.mockResolvedValue({ 
      data: { 
        response: [{ 
          league: { name: 'Premier League', id: 39 }, 
          teams: { home: { name: 'Chelsea' }, away: { name: 'Arsenal' } },
          goals: { home: 1, away: 0 },
          fixture: { id: 1, date: '2023-01-01', status: { short: 'FT' } }
        }] 
      } 
    });

    const res = await request(app).get('/api/live-scores?date=2023-01-01');
    expect(res.statusCode).toEqual(200);
    expect(res.body['Premier League']).toBeDefined();
  });

});