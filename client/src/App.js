import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('tournaments');
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      setUser(JSON.parse(saved));
      setActiveTab('dashboard');
    }
  }, []);


  const addToast = useCallback((msg, type='success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // Fetch Notifications 
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/notifications/${user._id}`);
      setNotifications(res.data);
    } catch (e) { console.error(e); }
  }, [user]);


  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); 
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogin = (u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); setActiveTab('dashboard'); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('user'); setActiveTab('tournaments'); };
  
  // Sync Coins locally when game updates them
  const updateCoins = (newCoins) => {
    const updatedUser = { ...user, coins: newCoins };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} tab={activeTab} setTab={setActiveTab} logout={handleLogout} unreadCount={unreadCount} />
      
      <div className="main-content">
        <div className="toast-container">
          {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
        </div>

        {/* Routes */}
        {activeTab === 'tournaments' && <TournamentsTab user={user} toast={addToast} />}
        {activeTab === 'live' && <LiveMatchesTab />}
        {activeTab === 'guess' && <GuessPlayerGame user={user} toast={addToast} updateCoins={updateCoins} />}
        {activeTab === 'trivia' && <TriviaGame toast={addToast} />}

        
        {user && activeTab === 'dashboard' && <DashboardHome user={user} setTab={setActiveTab} toast={addToast} />}
        {user && activeTab === 'manage-tournaments' && <ManageTournamentsTab user={user} toast={addToast} />}
        {user && activeTab === 'my-teams' && <ManagerSquadsTab user={user} toast={addToast} />}
        {user && activeTab === 'notifications' && <NotificationsTab user={user} notifications={notifications} refresh={fetchNotifications} />}
        
        {activeTab === 'login' && <AuthScreen onLogin={handleLogin} toast={addToast} />}
      </div>
    </div>
  );
}

/* --- SIDEBAR --- */
function Sidebar({ user, tab, setTab, logout, unreadCount }) {
  return (
    <div className="sidebar">
      <div className="brand"><span>⚽</span> ElClasico</div>
      {user && (
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user.username}{user.role === "admin" ? "👑" : "📋"}</span>
        </div>
      )}

      
      {user ? (
        <>
          <div className="nav-section">MAIN</div>
          <button className={`nav-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>📊 Dashboard</button>
        </>
      ) : null}
      
      <div className="nav-section">PUBLIC</div>
      <button className={`nav-btn ${tab === 'tournaments' ? 'active' : ''}`} onClick={() => setTab('tournaments')}>🏆 Tournaments</button>
      <button className={`nav-btn ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>🏟️ Live Matches</button>
      <button className={`nav-btn ${tab === 'guess' ? 'active' : ''}`} onClick={() => setTab('guess')}>🎮 Guess Player</button>

      
      {user?.role === 'admin' && (
        <>
          <div className="nav-section">ADMIN</div>
          <button className={`nav-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>👥 Manage Teams</button>
          <button className={`nav-btn ${tab === 'manage-tournaments' ? 'active' : ''}`} onClick={() => setTab('manage-tournaments')}>⚙️ Manage Tournaments</button>
        </>
      )}

      {user?.role === 'manager' && (
        <>
          <div className="nav-section">MANAGER</div>
          <button className={`nav-btn ${tab === 'my-teams' ? 'active' : ''}`} onClick={() => setTab('my-teams')}>👕 My Squads</button>
          <button className={`nav-btn ${tab === 'trivia' ? 'active' : ''}`} onClick={() => setTab('trivia')}>🧠 Trivia</button>
        </>
      )}
      
      {user && (
        <>
          <div className="nav-section">SYSTEM</div>
          <button className={`nav-btn ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>
            <span>🔔 Notifications</span>
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          {/* Coin Balance Display */}
          <div style={{margin:'10px 0', padding:'10px', background:'#252525', borderRadius:'8px', border:'1px solid gold', color:'gold', fontWeight:'bold', textAlign:'center'}}>
             💰 {user.coins} Coins
          </div>
          <button className="btn" onClick={logout}>Log Out</button>
        </>
      )}
      
      {!user && (<button className="nav-btn login-btn" onClick={() => setTab('login')}><span>🔐 Log In / Register</span></button>)}

    </div>
  );
}

/* --- GUESS THE PLAYER GAME --- */
function GuessPlayerGame({ user, toast, updateCoins }) {
  const [game, setGame] = useState(null);
  const [revealedCount, setRevealedCount] = useState(1); // Start seeing only the 1st club
  const [guess, setGuess] = useState('');
  const [loading, setLoading] = useState(false);

  const startNewGame = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/minigame/new`);
      if(res.data.careerPath.length === 0) {
         toast("Error: No history found for this player, try again.", "error");
      } else {
         setGame(res.data);
         setRevealedCount(1); 
         setGuess('');
      }
    } catch (e) { toast("Failed to start game", 'error'); }
    setLoading(false);
  };

  const handleReveal = async () => {
    if (!user) return toast("Login to use hints!", 'error');
    if (game && revealedCount < game.careerPath.length) {
      try {
        const cost = 10;
        const res = await axios.post(`${API_URL}/minigame/hint`, { userId: user._id, cost });
        updateCoins(res.data.coins);
        setRevealedCount(prev => prev + 1);
        toast(`Next Club Revealed! -${cost} Coins`);
      } catch (e) { toast(e.response?.data?.message || "Error", 'error'); }
    }
  };

  const handleSubmit = async () => {
    if (!user) return toast("Login to play!", 'error');
    if (!guess) return;
    try {
      const res = await axios.post(`${API_URL}/minigame/check`, { 
        userId: user._id, 
        guess, 
        actualNameBase64: game.encryptedName 
      });
      
      if (res.data.correct) {
        toast(res.data.message, 'success');
        updateCoins(res.data.coins);
        setTimeout(startNewGame, 2000); // Auto start next
      } else {
        toast(res.data.message, 'error');
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="header-flex">
        <h1>🎮 Guess The Player</h1>
        <button className="btn" onClick={startNewGame}>{game ? 'Skip / Next Player' : 'Start New Game'}</button>
      </div>

      {loading && (
        <div style={{textAlign:'center', padding:'40px', color:'#888'}}>
           <div className="live-dot" style={{width:'15px', height:'15px', marginBottom:'10px'}}></div>
           <p>Scouting Player...</p>
        </div>
      )}

      {!loading && game && (
        <div className="card" style={{textAlign:'center'}}>
          <div style={{marginBottom:'30px'}}>
             <h3>Career Journey</h3>
             <p style={{color:'#aaa'}}>Identify the player from their club history (Start ➜ Current)</p>
          </div>

          {/* The Career Chain */}
          <div className="career-chain-container">
            {game.careerPath.slice(0, revealedCount).map((club, i) => (
              <div key={i} className="chain-node fade-in">
                 {i > 0 && <div className="chain-arrow">➜</div>}
                 <div className="club-card">
                    <img src={club.logo} alt="club" className="club-logo-large"/>
                    <div className="club-name">{club.name}</div>
                    <small className="club-year">{club.year}</small>
                 </div>
              </div>
            ))}
            
            {/* Hidden Next Step */}
            {revealedCount < game.careerPath.length && (
              <div className="chain-node">
                 <div className="chain-arrow">➜</div>
                 <div className="club-card mystery-card">
                    <span style={{fontSize:'2rem'}}>?</span>
                    <div className="club-name">Next Club</div>
                 </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{marginTop:'40px', maxWidth:'400px', margin:'40px auto'}}>
             {revealedCount < game.careerPath.length ? (
               <button className="btn-close" style={{width:'100%', marginBottom:'15px', border:'1px solid gold', color:'gold'}} onClick={handleReveal}>
                 Reveal Next Club (-10 Coins)
               </button>
             ) : (
               <p style={{color:'var(--success)', fontWeight:'bold', marginBottom:'15px'}}>Full Career Revealed!</p>
             )}
             
             <div style={{display:'flex', gap:'10px'}}>
               <input className='any-input' placeholder={`Enter Name (${game.nameLength} letters)...`} value={guess} onChange={e=>setGuess(e.target.value)} style={{marginBottom:0}} />
               <button className="btn" onClick={handleSubmit}>Guess</button>
             </div>
          </div>
        </div>
      )}
      
      {!loading && !game && (
        <div style={{textAlign:'center', marginTop:'50px', color:'#666', border:'2px dashed #333', borderRadius:'10px', padding:'40px'}}>
          <h3>Ready to test your football knowledge?</h3>
          <p>Guess the player based on their transfer history.</p>
          <p style={{color:'gold', marginTop:'10px'}}>Win 50 Coins per correct guess!</p>
        </div>
      )}
    </div>
  );
}

/* --- DASHBOARD (Admin Teams) --- */
function DashboardHome({ user, setTab, toast }) {
  const [teams, setTeams] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState(null);

  const fetchData = useCallback(async () => { 
    const res = await axios.get(`${API_URL}/teams`); 
    setTeams(res.data); 
  }, []);

  useEffect(() => { if(user.role==='admin') fetchData(); }, [user, fetchData]);

  const handleDecision = async (id, status) => {
    if(!window.confirm(`Confirm: ${status}?`)) return;
    await axios.put(`${API_URL}/teams/${id}/status`, { status });
    toast(`Team ${status}`, 'success'); setSelectedTeam(null); fetchData();
  };
  const handleDelete = async (id) => {
    if(!window.confirm("DELETE TEAM?")) return;
    await axios.delete(`${API_URL}/teams/${id}`, { data: { role: 'admin' } });
    toast("Team Deleted", 'error'); setSelectedTeam(null); fetchData();
  };

  const filtered = teams.filter(t => filter === 'All' || (filter === 'Pending' ? (t.status === 'Pending' || t.status === 'Removal Requested') : t.status === filter));

  if(user.role !== 'admin') return (
    <div><h1>Welcome, {user.username}</h1><div className="btn-close" onClick={()=>setTab('my-teams')} style={{cursor:'pointer', borderLeft:'4px solid var(--accent)'}}><h3>Manage Your Squads</h3><p>Go to My Squads →</p></div></div>
  );

  return (
    <div>
      <h1>Manage Teams</h1>
      <div className="stats-grid">
        <div className="stat-card"><h3>{teams.length}</h3><p>Total</p></div>
        <div className="stat-card" style={{color:'#ffab40'}}><h3>{teams.filter(t=>t.status==='Pending').length}</h3><p>Pending</p></div>
        <div className="stat-card" style={{color:'#ef5350'}}><h3>{teams.filter(t=>t.status==='Removal Requested').length}</h3><p>Removal Req</p></div>
      </div>
      <div className="card">
        <div className="header-flex"><h3>All Teams</h3><select style={{width:'200px',margin:0}} onChange={e=>setFilter(e.target.value)}><option value="All">All</option><option value="Pending">Pending / Action</option><option value="Approved">Approved</option></select></div>
        <table className="league-table">
          <thead><tr><th>Team Name</th><th>Manager</th><th>Tournament</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t._id} onClick={()=>setSelectedTeam(t)} style={{cursor:'pointer', background: t.status==='Removal Requested'?'rgba(255, 82, 82, 0.1)' : 'transparent'}}>
                <td className="team">{t.name}</td>
                <td>{t.managerId?.username || 'Unknown'}</td>
                <td>{t.tournamentId?.name}</td>
                <td><span className={`status-tag ${t.status.replace(' ','-').toLowerCase()}`}>{t.status}</span></td>
                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td><button className="btn-two">Inspect</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedTeam && <TeamDetailModal team={selectedTeam} onClose={()=>setSelectedTeam(null)} onDecision={handleDecision} onDelete={handleDelete} />}
    </div>
  );
}

function TeamDetailModal({ team, onClose, onDecision, onDelete }) {
  return (
    <div className="modal-overlay"><div className="modal-content" style={{width:'600px'}}>
      <h2>{team.name}</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px'}}>
         <div className="info-box"><small>Manager</small><p>{team.managerId?.username}</p></div>
         <div className="info-box"><small>Tournament</small><p>{team.tournamentId?.name}</p></div>
      </div>
      <h4>Squad (11 Players)</h4>
      <div className="player-grid">{team.players.map((p,i)=><div key={i} style={{padding:'5px', background:'#1a1a1a'}}>{i+1}. {p}</div>)}</div>
      <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
        {team.status==='Pending' && <><button className="btn-green" onClick={()=>onDecision(team._id,'Approved')}>Approve</button><button className="btn-red" onClick={()=>onDecision(team._id,'Rejected')}>Reject</button></>}
        {team.status==='Removal Requested' && <button className="btn-red" onClick={()=>onDelete(team._id)}>Confirm Removal</button>}
        {team.status==='Approved' && <button className="btn-red" style={{marginLeft:'auto'}} onClick={()=>onDelete(team._id)}>Force Delete</button>}
        <button className="btn-close" onClick={onClose}>Close</button>
      </div>
    </div></div>
  );
}

/* --- MANAGE TOURNAMENTS (ADMIN ONLY) --- */
function ManageTournamentsTab({ user, toast }) {
  const [list, setList] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => { 
    const res = await axios.get(`${API_URL}/tournaments`); 
    setList(res.data); 
  }, []);

  useEffect(() => { load(); }, [load]);
  
  const handleDelete = async (id) => { if(window.confirm("Delete Tournament?")) { await axios.delete(`${API_URL}/tournaments/${id}`); toast("Deleted", "error"); load(); }};

  return (
    <div>
      <div className="header-flex"><h1>Manage Tournaments</h1><button className="btn" onClick={()=>setShowCreate(true)}>+ Create</button></div>
      <div className="card">
        <table className="league-table">
          <thead><tr><th>Name</th><th>Type</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {list.map(t => (
              <tr key={t._id}><td>{t.name}</td><td>{t.type}</td><td>{new Date(t.startDate).toLocaleDateString()}</td><td>{t.status}</td><td><button className="btn-red" onClick={()=>handleDelete(t._id)}>Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCreate && <CreateTournamentModal close={()=>{setShowCreate(false); load();}} toast={toast} />}
    </div>
  );
}

/* --- TOURNAMENTS VIEW --- */
function TournamentsTab({ user, toast }) {
  const [view, setView] = useState('list');
  const [selId, setSelId] = useState(null);
  const [list, setList] = useState([]);

  useEffect(() => { axios.get(`${API_URL}/tournaments`).then(res=>setList(res.data)); }, []);

  if(view === 'detail') return <TournamentDetail id={selId} user={user} back={()=>setView('list')} toast={toast} />;

  return (
    <div>
      <h1>Tournaments</h1>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
        {list.map(t=>(
          <div key={t._id} className="btn-close" onClick={()=>{setSelId(t._id); setView('detail');}} style={{cursor:'pointer'}}>
             <h3>{t.name}</h3><p>{t.type}</p><p style={{color:'#888'}}>{t.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TournamentDetail({ id, user, back, toast }) {
  const [data, setData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState('standings');

  const load = useCallback(async () => {
    const [t, tm, m] = await Promise.all([axios.get(`${API_URL}/tournaments`), axios.get(`${API_URL}/teams?tournamentId=${id}`), axios.get(`${API_URL}/matches`)]);
    setData(t.data.find(x=>x._id===id)); setTeams(tm.data); setMatches(m.data.filter(x=>x.tournamentId===id));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => { try { await axios.post(`${API_URL}/tournaments/${id}/start`); toast("Fixtures Generated"); load(); } catch(e){ toast(e.response.data.message, 'error'); }};
  const deleteT = async () => { if(window.confirm("Delete?")) { await axios.delete(`${API_URL}/tournaments/${id}`); back(); }};
  const deleteTeam = async (tid) => { if(window.confirm("Remove team?")) { await axios.delete(`${API_URL}/teams/${tid}`); load(); }};

  if(!data) return <p>Loading...</p>;

  return (
    <div>
      <button className="btn-close" onClick={back}>Back</button>
      <div className="card" style={{marginTop:'20px'}}>
        <div className="header-flex"><h2>{data.name}</h2>{user?.role==='admin' && data.status==='Open' && <button className="btn" onClick={generate}>Generate Bracket</button>}</div>
        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
           <button className={tab==='standings'?'btn':'btn-close'} onClick={()=>setTab('standings')}>Bracket/Standings</button>
           <button className={tab==='matches'?'btn':'btn-close'} onClick={()=>setTab('matches')}>Matches</button>
           <button className={tab==='teams'?'btn':'btn-close'} onClick={()=>setTab('teams')}>Teams</button>
        </div>
        {tab==='standings' && (data.type==='League' ? <LeagueTable teams={teams.filter(t => t.status === 'Approved')} matches={matches}/> : <KnockoutBracket matches={matches}/>)}
        {tab==='matches' && <MatchList matches={matches} isAdmin={user?.role==='admin'} refresh={load} toast={toast}/>}
        {tab==='teams' && <table className="league-table"><thead><tr><th>Name</th><th>Players</th><th>Status</th></tr></thead><tbody>{teams.map(t=><tr key={t._id}><td>{t.name}</td><td>{t.players.length}</td><td style={{color: t.status==='Approved'?'var(--success)':'var(--warning)'}}>{t.status}</td><td>{user?.role==='admin' && <button className="btn-red" onClick={()=>deleteTeam(t._id)}>🗑</button>}</td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}

/* --- VISUALIZATIONS --- */
function LeagueTable({ teams, matches }) {
  const stats = useMemo(() => {
    const map = {}; teams.forEach(t=>map[t.name]={name:t.name, p:0, w:0, d:0, l:0, pts:0});
    matches.forEach(m=>{
      if(m.status==='Played'){
        const h=map[m.homeTeam], a=map[m.awayTeam];
        if(h&&a){ h.p++; a.p++; if(m.homeScore>m.awayScore){h.w++;h.pts+=3;a.l++} else if(m.homeScore<m.awayScore){a.w++;a.pts+=3;h.l++} else{h.d++;a.d++;h.pts++;a.pts++} }
      }
    });
    return Object.values(map).sort((a,b)=>b.pts-a.pts);
  }, [teams, matches]);
  return <table className="league-table"><thead><tr><th>Pos</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead><tbody>{stats.map((t,i)=><tr key={i}><td>{i+1}</td><td>{t.name}</td><td>{t.p}</td><td>{t.w}</td><td>{t.d}</td><td>{t.l}</td><td>{t.pts}</td></tr>)}</tbody></table>;
}

function KnockoutBracket({ matches }) {
  if(matches.length===0) return <p>No fixtures.</p>;
  const rounds = matches.reduce((acc, m) => { acc[m.round] = acc[m.round] || []; acc[m.round].push(m); return acc; }, {});
  return (
    <div className="bracket-container">
      {Object.keys(rounds).map(r => (
        <div key={r} className="bracket-round">
          {rounds[r].map(m => {
            const hS = m.homeScore || 0, aS = m.awayScore || 0;
            const hPS = m.homePenaltyScore || 0, aPS = m.awayPenaltyScore || 0;
            let hWin=false, aWin=false;
            if(m.status==='Played') {
              if(hS > aS) hWin=true; else if(aS > hS) aWin=true;
              else { if(hPS > aPS) hWin=true; else aWin=true; }
            }
            return (
              <div key={m._id} className="bracket-match">
                <div className={`bracket-team ${hWin ? 'winner' : !hWin && m.status==='Played' ? 'eliminated' : ''}`}>
                  <span className="team-name">{m.homeTeam}</span>
                  <span className="team-score">{m.status==='Played' && (<> {hS}{hPS ? ` (${hPS})` : ''}</>)}</span>
                </div>
                <div style={{height:'1px', background:'#333', margin:'5px 0'}}></div>
                <div className={`bracket-team ${aWin ? 'winner' : !aWin && m.status==='Played' ? 'eliminated' : ''}`}>
                  <span className="team-name">{m.awayTeam}</span>
                  <span className="team-score">{m.status==='Played' && (<> {aS}{aPS ? ` (${aPS})` : ''}</>)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MatchList({ matches, isAdmin, refresh, toast }) {
  const save = async (id, data) => { await axios.put(`${API_URL}/matches/${id}`, data); toast("Score Saved"); refresh(); };
  return (
    <div style={{display:'grid', gap:'10px'}}>
      {matches.map(m=>(
        <div key={m._id} className="card" style={{padding:'15px'}}>
          <div className="match-card">
            <span style={{width:'30%', textAlign:'right', fontWeight:'bold'}}>{m.homeTeam} </span>
            {m.status === 'Played' ? <span className="score-display">[ {m.homeScore} {(m.homePenaltyScore > 0 || m.awayPenaltyScore > 0) ? `(${m.homePenaltyScore}) - (${m.awayPenaltyScore})` : '-'} {m.awayScore} ] </span> :
              isAdmin ? (
                <MatchEditor m={m} onSave={save} />
              ) : <span style={{color:'#666'}}>VS</span>
            }
            <span style={{width:'30%', fontWeight:'bold'}}> {m.awayTeam}</span>
          </div>
          <div className="match-meta">
             <span>📅 {m.date ? new Date(m.date).toLocaleDateString() : 'Date TBD'}</span>
             <span>📍 {m.venue || 'Venue TBD'}</span>
             <span>⏰ {m.kickoffTime ? new Date(m.kickoffTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Time TBD'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchEditor({ m, onSave }) {
  const [h, setH] = useState(m.homeScore||''); const [a, setA] = useState(m.awayScore||'');
  const [hp, setHP] = useState(m.homePenaltyScore||''); const [ap, setAP] = useState(m.awayPenaltyScore||'');
  const [venue, setVenue] = useState(m.venue||''); const [time, setTime] = useState(m.kickoffTime||'');
  const [showMeta, setShowMeta] = useState(false);
  return (
    <div style={{textAlign:'center'}}>
       <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
          <input className='score-input' value={h} onChange={e=>setH(e.target.value)} placeholder="0"/>
          <input className='score-input' value={a} onChange={e=>setA(e.target.value)} placeholder="0"/>
          <button className="btn" style={{padding:'5px 10px'}} onClick={()=>onSave(m._id, {homeScore:h, awayScore:a, homePenaltyScore:hp, awayPenaltyScore:ap, venue, kickoffTime:time})}>✓</button>
          <button className="btn-close" style={{padding:'5px'}} onClick={()=>setShowMeta(!showMeta)}>⚙️</button>
       </div>
       {h && a && h === a && <div style={{fontSize:'0.8rem', marginTop:'5px', color:'#aaa'}}>Penalties: <input className='score-input' value={hp} onChange={e=>setHP(e.target.value)}/> - <input className='score-input' value={ap} onChange={e=>setAP(e.target.value)}/></div>}
       {showMeta && <div style={{marginTop:'10px', padding:'10px', background:'#222329', borderRadius:'4px'}}><input className='score-input'  style={{width:'700px'}} placeholder="Venue" value={venue} onChange={e=>setVenue(e.target.value)} /><input className='score-input' style={{width:'700px'}} type="datetime-local" value={time} onChange={e=>setTime(e.target.value)} /></div>}
    </div>
  );
}

/* --- MANAGER SQUADS --- */
function ManagerSquadsTab({ user, toast }) {
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [showReg, setShowReg] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    const t = await axios.get(`${API_URL}/teams?managerId=${user._id}`); setTeams(t.data);
    const tr = await axios.get(`${API_URL}/tournaments`); setTournaments(tr.data.filter(x=>x.status==='Open'));
  }, [user._id]);

  useEffect(() => { load(); }, [load]);

  const withdraw = async (id) => { if(window.confirm("Withdraw?")) { await axios.delete(`${API_URL}/teams/${id}`, {data:{role:'manager'}}); toast("Request Sent"); load(); }};
  const saveEdit = async (id, name, players) => { try { await axios.put(`${API_URL}/teams/${id}`, {name, players}); setEditing(null); toast("Updated & Re-Submitted"); load(); } catch(e){toast(e.response.data.message, 'error');} };

  return (
    <div>
      <div className="header-flex"><h1>My Squads</h1><button className="btn" onClick={()=>setShowReg(true)}>+ Register</button></div>
      {teams.map(t => (
        <div key={t._id} className="card">
          {editing?._id===t._id ? <TeamFormModal existingTeam={t} user={user} close={()=>{setEditing(null); load();}} toast={toast} onSave={saveEdit} /> : (
            <div className="header-flex">
              <div><h3>{t.name} <span className={`status-tag ${t.status.replace(' ','-').toLowerCase()}`}>{t.status}</span></h3><p>{t.tournamentId?.name}</p></div>
              <div>{t.status!=='Removal Requested' && <><button className="btn-close" onClick={()=>setEditing(t)}>✏️ Edit</button><button className="btn-red" style={{marginLeft:'10px'}} onClick={()=>withdraw(t._id)}>{t.status==='Pending'?'Cancel':'Request Removal'}</button></>}</div>
            </div>
          )}
        </div>
      ))}
      {showReg && <TeamFormModal user={user} tournaments={tournaments} close={()=>{setShowReg(false); load();}} toast={toast} />}
    </div>
  );
}

function TeamFormModal({ user, tournaments, close, existingTeam, toast }) {
  const [name, setName] = useState(existingTeam?.name||'');
  const [tid, setTid] = useState(existingTeam?.tournamentId?._id||'');
  const [logo, setLogo] = useState(existingTeam?.logo||'');
  const [teamSize, setTeamSize] = useState(existingTeam?.teamSize||11);
  const [contactPhone, setContactPhone] = useState(existingTeam?.contactPhone||'');
  const [contactEmail, setContactEmail] = useState(existingTeam?.contactEmail||user.email||'');
  
  const [players, setPlayers] = useState(() => {
    if (existingTeam?.players) return existingTeam.players;
    return Array(11).fill('');
  });

  const handleSizeChange = (newSize) => {
    setTeamSize(newSize);
    setPlayers(prev => {
      if (newSize > prev.length) return [...prev, ...Array(newSize - prev.length).fill('')];
      return prev.slice(0, newSize);
    });
  };
  
  const submit = async (e) => { 
    e.preventDefault(); 
    try {
      const pl = { name, players: players.slice(0, teamSize), tournamentId:tid, managerId:user._id, logo, contactPhone, contactEmail, teamSize };
      if(existingTeam) await axios.put(`${API_URL}/teams/${existingTeam._id}`, pl);
      else await axios.post(`${API_URL}/teams`, pl);
      toast("Success"); close();
    } catch(e){toast(e.response?.data?.message || "Error", 'error');} 
  };

  return (
    <div className="modal-overlay"><form className="modal-content" style={{width:'650px'}} onSubmit={submit}>
       <h3>{existingTeam?'Edit':'Register'} Squad</h3>
       <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px'}}>
         {!existingTeam ? (
            <select onChange={e=>setTid(e.target.value)} value={tid} required>
              <option value="">-- Select Tournament --</option>
              {tournaments.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
         ) : <div className="info-box">Tournament Locked</div>}
         
         {!existingTeam ? (
           <div style={{display:'flex', gap:'10px', alignItems:'center', justifyContent:'center', background:'#222329', borderRadius:'6px'}}>
             <label className="radio-option"><input type="radio" name="sz" checked={teamSize===11} onChange={()=>handleSizeChange(11)}/> <span className="radio-label">11-a-side</span></label>
             <label className="radio-option"><input type="radio" name="sz" checked={teamSize===5} onChange={()=>handleSizeChange(5)}/><span className="radio-label">5-a-side</span></label>
           </div>
         ) : <div className="info-box">{teamSize}-a-Side</div>}
       </div>

       <input className='any-input' placeholder="Team Name" value={name} onChange={e=>setName(e.target.value)} required />
       <input className='any-input' placeholder="Logo URL (Optional)" value={logo} onChange={e=>setLogo(e.target.value)} />
       
       <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <input className='any-input' placeholder="Manager Phone" value={contactPhone} onChange={e=>setContactPhone(e.target.value)} required />
          <input className='any-input' placeholder="Manager Email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} required />
       </div>

       <div className="player-grid">
         {players.map((p,i)=><input className='any-input' key={i} placeholder={`Player ${i+1}`} value={p} onChange={e=>{const n=[...players];n[i]=e.target.value;setPlayers(n)}} required />)}
       </div>

       <div style={{marginTop:'10px', display:'flex', gap:'10px'}}>
         <button className="btn" style={{flex:1}}>Submit Squad</button>
         <button type="button" className="btn-close" onClick={close}>Cancel</button>
       </div>
    </form></div>
  );
}

function NotificationsTab({ user, notifications, refresh }) {
  useEffect(() => { if(notifications.some(n=>!n.isRead)) axios.put(`${API_URL}/notifications/user/${user._id}/read-all`).then(refresh); }, [notifications, user._id, refresh]);
  return <div><h2>Notifications</h2>{notifications.map(n=><div key={n._id} className="card" style={{borderLeft: n.isRead?'1px solid var(--border)':'4px solid var(--accent)'}}><p>{n.message}</p><small>{new Date(n.createdAt).toLocaleString()}</small></div>)}</div>;
}

function CreateTournamentModal({ close, toast }) {
  const [f, setF] = useState({name:'', type:'League', startDate:'', endDate:'', location:''});
  const submit = async (e) => { e.preventDefault(); try { await axios.post(`${API_URL}/tournaments`, f); toast("Created"); close(); } catch(e){toast(e.response?.data?.message || "Error", 'error');} };
  return <div className="modal-overlay"><form className="modal-content" onSubmit={submit}><h3>Create</h3><input className='any-input' placeholder="Name" onChange={e=>setF({...f, name:e.target.value})} required/><input className='any-input' placeholder="Location" onChange={e=>setF({...f, location:e.target.value})} required/><select onChange={e=>setF({...f, type:e.target.value})}><option>League</option><option>Knockout</option></select><div style={{display:'flex', gap:'10px'}}><input className='any-input' type="date" onChange={e=>setF({...f, startDate:e.target.value})} required/><input className='any-input' type="date" onChange={e=>setF({...f, endDate:e.target.value})} required/></div><button className="btn" style={{width:'100%', marginTop:'10px'}}>Create</button><button type="button" className="btn-close" style={{width:'100%', marginTop:'10px'}} onClick={close}>Cancel</button></form></div>;
}

function LiveMatchesTab() {
  const [matches, setMatches] = useState({});
  const [queryDate, setQueryDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLiveScores(queryDate);
  }, [queryDate]);

  const fetchLiveScores = async (date) => {
    setLoading(true);
    setMatches({}); 
    try {
      const res = await axios.get(`${API_URL}/live-scores?date=${date}`);
      setMatches(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const [selectedDate, setSelectedDate] = useState(0); 
  
  const setRelativeDate = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60 * 1000));
    setQueryDate(offsetDate.toISOString().split('T')[0]);
  };

  return (
    <div>
      <div className="header-flex" style={{marginBottom:'10px'}}>
        <h1>🌍 World Football</h1>
        <input 
          type="date" 
          value={queryDate} 
          onChange={(e) => setQueryDate(e.target.value)} 
          style={{width:'auto', margin:0, padding:'8px', cursor:'pointer'}}
        />
      </div>
      
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <button className = {selectedDate === -1 ? "btn" : "btn-close"} style={{flex:1}} onClick={() => {setRelativeDate(-1); setSelectedDate(-1)}}>Yesterday</button>
        <button className = {selectedDate === 0 ? "btn" : "btn-close"} style={{flex:1}} onClick={() => {setRelativeDate(0); setSelectedDate(0)}}>Today</button>
        <button className = {selectedDate === 1 ? "btn" : "btn-close"} style={{flex:1}} onClick={() => {setRelativeDate(1); setSelectedDate(1)}}>Tomorrow</button>
      </div>

      {loading ? (
        <div style={{textAlign:'center', padding:'40px', color:'#888'}}>
           <div className="live-dot" style={{width:'15px', height:'15px', marginBottom:'10px'}}></div>
           <p>Contacting Stadiums...</p>
        </div>
      ) : (
        <div>
          {Object.keys(matches).length === 0 ? (
            <div style={{textAlign:'center', marginTop:'40px', color:'#666', padding:'20px', border:'1px dashed #333', borderRadius:'8px'}}>
              <h3>No matches found for {queryDate}</h3>
              <p>Check the date or try checking weekend dates.</p>
            </div>
          ) : (
            Object.keys(matches).map(league => (
              <div key={league} style={{marginBottom:'25px'}}>
                <h4 style={{borderBottom:'1px solid #333', paddingBottom:'5px', color:'var(--accent)', textTransform:'uppercase', letterSpacing:'1px'}}>{league}</h4>
                <div style={{display:'grid', gap:'10px'}}>
                  {matches[league].map(m => (
                    <div key={m.id} className="card" style={{padding:'12px', marginBottom:0, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      
                      <div style={{width:'35%', display:'flex', alignItems:'center', gap:'10px', justifyContent:'flex-end'}}>
                        <span style={{fontWeight:'bold', textAlign:'right'}}>{m.homeTeam}</span>
                        {m.crestHome && <img src={m.crestHome} alt="" style={{width:'25px', height:'25px', objectFit:'contain'}}/>}
                      </div>

                      <div style={{width:'20%', textAlign:'center', fontWeight:'bold', fontSize:'1.1rem', background:'#111', padding:'5px', borderRadius:'6px', minWidth:'80px'}}>
                         {m.status === 'IN_PLAY' || m.status === 'PAUSED' ? (
                           <span style={{color:'var(--danger)', animation:'pulse 1.5s infinite'}}>LIVE<br/>{m.homeScore}-{m.awayScore}</span>
                         ) : m.status === 'FINISHED' ? (
                           <span style={{color:'var(--text-main)'}}>{m.homeScore}-{m.awayScore}<br/><small style={{fontSize:'0.6rem', color:'#666'}}>FT</small></span>
                         ) : (
                           <span style={{color:'#666', fontSize:'0.9rem'}}>{m.time}</span>
                         )}
                      </div>

                      <div style={{width:'35%', display:'flex', alignItems:'center', gap:'10px', justifyContent:'flex-start'}}>
                        {m.crestAway && <img src={m.crestAway} alt="" style={{width:'25px', height:'25px', objectFit:'contain'}}/>}
                        <span style={{fontWeight:'bold', textAlign:'left'}}>{m.awayTeam}</span>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AuthScreen({ onLogin, toast }) {
  const [isReg, setIsReg] = useState(false);
  const [f, setF] = useState({username:'', email:'', password:'', role:'manager'});
  const submit = async (e) => { e.preventDefault(); try { const res = await axios.post(`${API_URL}/${isReg?'register':'login'}`, f); onLogin(res.data.user); } catch(e){ toast(e.response?.data?.message || "Error", 'error'); } };
  return <div className="auth-container"><form className="auth-box" onSubmit={submit}><h2 style={{textAlign:'center'}}>ElClasico</h2>{isReg&&<input className='any-input' placeholder="Email" onChange={e=>setF({...f, email:e.target.value})}/>}<input className='any-input' placeholder="Username" onChange={e=>setF({...f, username:e.target.value})}/><input className='any-input' type="password" placeholder="Password" onChange={e=>setF({...f, password:e.target.value})}/>{isReg&&<select onChange={e=>setF({...f, role:e.target.value})}><option value="manager">Manager</option><option value="admin">Admin</option></select>}<button className="auth-btn">{isReg?'Register':'Login'}</button><p onClick={()=>setIsReg(!isReg)} style={{textAlign:'center', cursor:'pointer', marginTop:'20px'}}>{isReg?'Login':'Create Account'}</p></form></div>;
}

function TriviaGame( {toast} ) {
  const [questions, setQuestions] = React.useState([]);
  const [current, setCurrent] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [score, setScore] = React.useState(0);
  const [selected, setSelected] = React.useState(null);



  React.useEffect(() => {
    fetchQuestions();
  }, []);

  function fetchQuestions() {
  setLoading(true);
  fetch("https://opentdb.com/api.php?amount=50&category=21&type=multiple")
    .then(res => res.json())
    .then(data => {
      console.log("API DATA:", data);

      if (!data || !data.results) {  
        console.error("Invalid API response");
        setLoading(false);
        return;
      }

      const footballQuestions = data.results.filter(q =>
        q.question.toLowerCase().includes("soccer") ||
        q.question.toLowerCase().includes("fifa") ||
        q.question.toLowerCase().includes("premier") ||
        q.question.toLowerCase().includes("league") ||
        q.question.toLowerCase().includes("champions ") ||
        q.question.toLowerCase().includes("world cup") ||
        q.question.toLowerCase().includes("ballon") 
      );

      const processedQuestions = footballQuestions.map(q => {
      const answers = [...q.incorrect_answers, q.correct_answer];
      const shuffled = answers.sort(() => Math.random() - 0.5);

      return { ...q, shuffled_answers: shuffled };
      });


      if (footballQuestions.length === 0) {
        console.log("No football questions, refetching...");
        fetchQuestions();
        return;
      }

      setQuestions(processedQuestions.slice(0, 20));
      setCurrent(0);
      setLoading(false);
    })
    .catch(err => {
      console.error("Fetch error", err);
      setLoading(false);
    });
}


  if (loading) {
    return <div style={{ padding: 20, color: "white" }}>Loading trivia…</div>;
  }

  const q = questions[current];


  const answers = q.shuffled_answers || [];


  function pickAnswer(choice) {
  if (selected !== null) return; // prevent double presses

  const isCorrect = choice === q.correct_answer;
  setSelected(choice);

  if (isCorrect) setScore(prev => prev + 1);

  // Wait to show colors BEFORE moving next
  setTimeout(() => {
    if (current + 1 < questions.length) {
      setCurrent(prev => prev + 1);
    } else {
      alert(`Game Over! Final score: ${score + (isCorrect ? 1 : 0)}`);
      fetchQuestions();
      
    }
    setSelected(null);
  }, 800);
}


  return (
  <div style={{ padding: 20, color: "white" }}>
    <h2 dangerouslySetInnerHTML={{ __html: q.question }} />

    <div style={{ marginTop: "20px" }}>
      {answers.map((choice, idx) => (
        <button
        key={idx}
        onClick={() => { pickAnswer(choice); { choice === q.correct_answer ? toast("Correct") : toast("Incorrect","error")}} }
        disabled={selected !== null}
        className={
          selected === null
            ? "btn-close"                   // normal button
            : choice === q.correct_answer
              ? "btn-green"           // correct
              : "btn-red"             // wrong
        }
        
        style={{
          display: "block",
          width: "100%",
          margin: "10px 0",
          cursor: selected ? "default" : "pointer"
        }}
        dangerouslySetInnerHTML={{ __html: choice }}
        />
      ))}
    </div>

    <div style={{ marginTop: 20, fontSize: "1.1rem" }}>
      Score: {score}
    </div>
  </div>
);

}



export default App;