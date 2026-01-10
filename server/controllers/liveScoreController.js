const axios = require('axios');


const API_KEY = process.env.API_KEY; 
const BASE_URL = process.env.BASE_URL;

exports.getMatches = async (req, res) => {
  try {
    const { date } = req.query; 
    console.log(`📡 Fetching matches from API-Football for ${date}...`);

    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: { 
        'x-apisports-key': API_KEY 
      },
      params: { 
        date: date,
        
      },
      timeout: 20000 // 20 seconds timeout
    });

    const fixtures = response.data.response;

    if (!fixtures || fixtures.length === 0) {
      console.log(`✅ API success: 0 matches found for ${date}.`);
      return res.status(200).json({});
    }

    // Filter to keep the UI clean the api returns 500 leagues :D
    // 39=PL, 140=LaLiga, 135=Serie A, 78=Bundesliga, 61=Ligue 1, 2=UCL, 1=World Cup
    const PREFERRED_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 1, 9, 45, 48, 143]; 
    const filteredFixtures = fixtures.filter(f => PREFERRED_LEAGUES.includes(f.league.id));
    
    // fallback to all if no major games are on
    const dataToUse = filteredFixtures.length > 0 ? filteredFixtures : fixtures;

    // Group by League
    const grouped = dataToUse.reduce((acc, match) => {
      const leagueName = match.league.name;
      if (!acc[leagueName]) acc[leagueName] = [];
      

      let customStatus = 'Scheduled';
      let displayTime = new Date(match.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const short = match.fixture.status.short;
      
      if (['1H', '2H', 'ET', 'P', 'BT'].includes(short)) {
        customStatus = 'IN_PLAY';
        displayTime = `${match.fixture.status.elapsed}'`; 
      } else if (short === 'HT') {
        customStatus = 'PAUSED';
        displayTime = 'HT';
      } else if (['FT', 'AET', 'PEN'].includes(short)) {
        customStatus = 'FINISHED';
        displayTime = 'FT';
      } else if (['PST', 'CANC', 'ABD'].includes(short)) {
        customStatus = 'POSTPONED';
        displayTime = short;
      }

      acc[leagueName].push({
        id: match.fixture.id,
        homeTeam: match.teams.home.name,
        awayTeam: match.teams.away.name,
        homeScore: match.goals.home,
        awayScore: match.goals.away,
        status: customStatus, 
        time: displayTime,
        crestHome: match.teams.home.logo,
        crestAway: match.teams.away.logo
      });
      return acc;
    }, {});

    console.log(`✅ Success: Returning ${Object.keys(grouped).length} leagues.`);
    res.status(200).json(grouped);

  } catch (error) {
    console.error("❌ API Error:", error.message);
    if (error.response) {
      console.error("Response Data:", JSON.stringify(error.response.data));
    }
    res.status(200).json({});
  }
};