
const axios = require('axios');
const stringSimilarity = require('string-similarity'); // Library for guessing to be nicer
const User = require('../models/User');

// API CONFIG
const API_KEY = process.env.API_KEY; 
const BASE_URL = process.env.BASE_URL;


// Retired legends
const RETIRED_LEGENDS = [
  18, 154, 521, 1100, 2295, 874, 306, 276, 44, 19064,
  50, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 
];


let PLAYER_POOL = [...RETIRED_LEGENDS];
let isPoolReady = false;


// Runs once when the server starts to find the top scorers from major leagues
const fetchFamousPlayers = async () => {
  console.log("⚽ Scouting famous players from Top Leagues...");
  try {
    // Leagues: 39 (PL), 140 (La Liga), 2 (UCL), 78 (Bundesliga), 135 (Serie A)
    // Season: 2023 (Using last full season for reliable data)
    const leagues = [39, 140, 2, 78, 135]; 
    const newIds = new Set();

    const requests = leagues.map(id => 
      axios.get(`${BASE_URL}/players/topscorers`, {
        headers: { 'x-apisports-key': API_KEY },
        params: { league: id, season: 2023 }
      })
    );

    const results = await Promise.all(requests);

    results.forEach(res => {
      if (res.data.response) {
        res.data.response.slice(0, 15).forEach(item => {
          newIds.add(item.player.id);
        });
      }
    });

    // Merge found players with the legends list
    PLAYER_POOL = [...RETIRED_LEGENDS, ...Array.from(newIds)];
    isPoolReady = true;
    console.log(`✅ Scouting Complete. Game Pool Size: ${PLAYER_POOL.length} Players.`);

  } catch (error) {
    console.error("❌ Scouting Failed (using backup list):", error.message);
    // If API fails, we just use the legends list
    isPoolReady = true;
  }
};

// Run immediately on server start
fetchFamousPlayers();



exports.getNewGame = async (req, res) => {
  try {
    if (!isPoolReady) {
       console.log("⚠️ Pool not ready yet, using legends backup.");
    }

    // Pick a Random Player from the Pool
    const randomId = PLAYER_POOL[Math.floor(Math.random() * PLAYER_POOL.length)];
    console.log(`🎮 Generating Game for Player ID: ${randomId}`);

    // Transfer History
    const response = await axios.get(`${BASE_URL}/transfers`, {
      headers: { 'x-apisports-key': API_KEY },
      params: { player: randomId },
      timeout: 15000
    });

    const data = response.data.response[0];
    
    // If player has no transfer history or data is missing, try again
    if (!data || !data.transfers || data.transfers.length === 0) {
       return res.status(404).json({ message: "Player data invalid, please try again." });
    }

    // Process Career Path (Oldest -> Newest)
    const transfers = data.transfers.reverse(); 
    let careerPath = [];

    if (transfers.length > 0) {
      // Starting Club
      careerPath.push({
        name: transfers[0].teams.out.name,
        logo: transfers[0].teams.out.logo,
        year: transfers[0].date.substring(0, 4) 
      });

      // Destination Clubs
      transfers.forEach(t => {
        careerPath.push({
          name: t.teams.in.name,
          logo: t.teams.in.logo,
          year: t.date.substring(0, 4) 
        });
      });
    }

    // Send Game Data
    res.status(200).json({
      playerId: data.player.id,
      // Encode name to Base64 so user can't just read it in the Network tab + added security 
      encryptedName: Buffer.from(data.player.name).toString('base64'),
      careerPath: careerPath,
      nameLength: data.player.name.length
    });

  } catch (error) {
    console.error("Game Gen Error:", error.message);
    res.status(500).json({ message: "Failed to generate game. API might be busy." });
  }
};

exports.checkAnswer = async (req, res) => {
  try {
    const { userId, guess, actualNameBase64 } = req.body;
    const actualName = Buffer.from(actualNameBase64, 'base64').toString('utf-8');
    
    // Fuzzy algorithm
    const userGuess = guess.trim().toLowerCase();
    const target = actualName.toLowerCase();
    // Split name to check last name ( checking for messi in lionel messi)
    const targetParts = target.split(' ');
    const targetLastName = targetParts[targetParts.length - 1]; 

    // Calculate Similarity Score
    // Compares "messii" to "lionel messi" AND "messii" to "messi"
    const similarityFull = stringSimilarity.compareTwoStrings(userGuess, target);
    const similarityLast = stringSimilarity.compareTwoStrings(userGuess, targetLastName);
    

    // Score > 0.70 allows for small typos
    const isCloseEnough = (similarityFull > 0.70) || (similarityLast > 0.70);
    const isSubstring = target.includes(userGuess) && userGuess.length > 3; // Prevent winning by typing a

    if (isCloseEnough || isSubstring) {
      const user = await User.findByIdAndUpdate(userId, { $inc: { coins: 50 } }, { new: true });
      return res.status(200).json({ 
        correct: true, 
        coins: user.coins, 
        message: `Correct! It was ${actualName}. (+50 Coins)` 
      });
    } else {
      return res.status(200).json({ 
        correct: false, 
        message: "Wrong! Try again." 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deductHintCost = async (req, res) => {
  try {
    const { userId, cost } = req.body;
    const user = await User.findById(userId);
    
    if (user.coins < cost) {
      return res.status(400).json({ message: "Not enough coins!" });
    }
    
    user.coins -= cost;
    await user.save();
    
    res.status(200).json({ success: true, coins: user.coins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};