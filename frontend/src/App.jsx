import { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [showRules, setShowRules] = useState(false);
  
  // Mouse trail particles state
  const [particles, setParticles] = useState([]);

  // Feature 1 State: AI Strategy Selection
  const [aiStrategy, setAiStrategy] = useState('balanced');

  // Feature 2 State: Replay Viewer Episode Data
  const [replayEpisode, setReplayEpisode] = useState([]);
  const [replayStep, setReplayStep] = useState(0);

  // Feature 3 State: Custom Deck Builder Selection (default 60 cards represented by IDs)
  const [customDeck, setCustomDeck] = useState([
    25, 25, 25, 25, 6, 6, 6, 6, 150, 150, 
    ...Array(50).fill(1) // General Trainer & Energy fillers
  ]);

  // Feature 4 State: Local Battle Statistics
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('ptcg_battle_stats');
    return saved ? JSON.parse(saved) : { wins: 0, losses: 0, totalDamage: 0 };
  });

  const pokemonOptions = [
    { name: 'PIKACHU', hp: 120, img: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/025.png', glow: 'rgba(245, 158, 11, 0.45)', rivalIndex: 1 },
    { name: 'CHARIZARD', hp: 150, img: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/006.png', glow: 'rgba(239, 68, 68, 0.45)', rivalIndex: 8 },
    { name: 'GRENINJA', hp: 130, img: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/658.png', glow: 'rgba(59, 130, 246, 0.45)', rivalIndex: 4 },
    { name: 'LUCARIO', hp: 130, img: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/448.png', glow: 'rgba(34, 211, 238, 0.45)', rivalIndex: 5 },
    { name: 'MEWTWO', hp: 160, img: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/150.png', glow: 'rgba(168, 85, 247, 0.45)', rivalIndex: 0 },
    { name: 'GENGAR', hp: 120, img: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/094.png', glow: 'rgba(107, 33, 168, 0.5)', rivalIndex: 3 },
    { name: 'BLASTOISE', hp: 140, img: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/009.png', glow: 'rgba(29, 78, 216, 0.45)', rivalIndex: 7 },
    { name: 'VENUSAUR', hp: 140, img: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/003.png', glow: 'rgba(16, 185, 129, 0.45)', rivalIndex: 6 },
    { name: 'RAYQUAZA', hp: 170, img: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/384.png', glow: 'rgba(4, 120, 87, 0.5)', rivalIndex: 1 },
    { name: 'SNORELAX', hp: 190, img: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/143.png', glow: 'rgba(148, 163, 184, 0.4)', rivalIndex: 2 }
  ];

  const [selectedPlayer, setSelectedPlayer] = useState(pokemonOptions[0]);
  const [selectedAi, setSelectedAi] = useState(pokemonOptions[pokemonOptions[0].rivalIndex]);

  const handlePlayerSelection = (poke) => {
    setSelectedPlayer(poke);
    setSelectedAi(pokemonOptions[poke.rivalIndex]);
  };

  const [playerHp, setPlayerHp] = useState(120);
  const [aiHp, setAiHp] = useState(150);
  const [playerEnergy, setPlayerEnergy] = useState(0);
  const [battleLogs, setBattleLogs] = useState([]);
  const [aiThought, setAiThought] = useState("Waiting for player...");
  const [isAiTurn, setIsAiTurn] = useState(false);

  // Save Stats to Local Storage
  const updateStats = (won, damageDealt) => {
    setStats((prev) => {
      const updated = {
        wins: prev.wins + (won ? 1 : 0),
        losses: prev.losses + (won ? 0 : 1),
        totalDamage: prev.totalDamage + damageDealt
      };
      localStorage.setItem('ptcg_battle_stats', JSON.stringify(updated));
      return updated;
    });
  };

  const startMatch = () => {
    setPlayerHp(selectedPlayer.hp);
    setAiHp(selectedAi.hp);
    setPlayerEnergy(0);
    setReplayEpisode([]);
    setReplayStep(0);
    
    const initialLog = `⚔️ Match initialized! ${selectedPlayer.name} vs AI Rival ${selectedAi.name} [Strategy: ${aiStrategy.toUpperCase()}].`;
    setBattleLogs([initialLog]);
    setReplayEpisode([initialLog]);
    setAiThought(`Awaiting your first move under ${aiStrategy.toUpperCase()} protocol.`);
    setScreen('battle');
  };

  const attachEnergy = () => {
    const actionLog = `🔋 Attached an Energy load to ${selectedPlayer.name}.`;
    setPlayerEnergy(prev => prev + 1);
    setBattleLogs(prev => [actionLog, ...prev]);
    setReplayEpisode(prev => [...prev, actionLog]);
  };

  const attackEnemy = async () => {
    if (playerEnergy < 1) return;
    const damage = 30;
    const newAiHp = Math.max(0, aiHp - damage);
    setAiHp(newAiHp);
    setPlayerEnergy(prev => Math.max(0, prev - 1));
    
    const hitLog = `💥 Your ${selectedPlayer.name} hit for ${damage} damage!`;
    setBattleLogs(prev => [hitLog, ...prev]);
    setReplayEpisode(prev => [...prev, hitLog]);
    updateStats(newAiHp <= 0, damage);

    if (newAiHp <= 0) {
      const victoryLog = `🎉 Victory! The enemy AI's ${selectedAi.name} fainted.`;
      setBattleLogs(prev => [victoryLog, ...prev]);
      setReplayEpisode(prev => [...prev, victoryLog]);
      return;
    }
    triggerAiTurn(newAiHp);
  };

  const triggerAiTurn = async (currentAiHp) => {
    setIsAiTurn(true);
    setAiThought(`Analyzing variables using ${aiStrategy.toUpperCase()} strategy...`);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: aiStrategy,
          observation: { ai_hp: currentAiHp, player_hp: playerHp }, 
          legal_actions: [1, 2] 
        })
      });
      const data = await response.json();
      setAiThought(data.thought_process);
      
      let aiLog = '';
      if (data.action === 1) {
        const isCrit = Math.random() < 0.3;
        const aiDamage = isCrit ? 40 : 25; 
        setPlayerHp(prev => Math.max(0, prev - aiDamage));
        aiLog = isCrit 
          ? `🚨 CRITICAL HIT! AI unleashed a massive counter for ${aiDamage} damage!` 
          : `🤖 AI executed action [${data.action}]: Used Strike for ${aiDamage} damage!`;
      } else {
        aiLog = `🤖 AI executed action [${data.action}]: Charged up its tactical matrix.`;
      }
      setBattleLogs(prev => [aiLog, ...prev]);
      setReplayEpisode(prev => [...prev, aiLog]);

    } catch (error) {
      const fallbackDamage = 20;
      setPlayerHp(prev => Math.max(0, prev - fallbackDamage));
      const fallbackLog = `🤖 AI Sandbox Mode (${aiStrategy.toUpperCase()}): Counter-strike for ${fallbackDamage} damage.`;
      setBattleLogs(prev => [fallbackLog, ...prev]);
      setReplayEpisode(prev => [...prev, fallbackLog]);
    } finally {
      setIsAiTurn(false);
    }
  };

  // Replay Viewer JSON Export
  const downloadReplayJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      match: `${selectedPlayer.name} vs ${selectedAi.name}`,
      strategy: aiStrategy,
      logs: replayEpisode
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `match_replay_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Flame particle mouse trail
  useEffect(() => {
    if (screen !== 'welcome') return;
    const handleMouseMove = (e) => {
      const newParticle = {
        id: Math.random(),
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 12 + 8,
        angle: Math.random() * 360,
      };
      setParticles((prev) => [...prev.slice(-20), newParticle]);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [screen]);

  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) => prev.slice(1));
    }, 45); 
    return () => clearInterval(interval);
  }, [particles]);

  const resetGame = () => {
    setScreen('welcome');
  };

  // ==========================================
  // WELCOME INTERFACE RENDER
  // ==========================================
  if (screen === 'welcome') {
    return (
      <div className="welcome-viewport">
        <div className="ambient-overlay"></div>

        {particles.map((p) => (
          <span
            key={p.id}
            className="fire-spark-particle"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              transform: `translate(-50%, -50%) rotate(${p.angle}deg)`,
            }}
          >
            🔥
          </span>
        ))}

        <div className="header-wrapper">
          <h1 className="header-title">⚡ PTCG AI BATTLE ARENA</h1>
          <p className="header-subtitle">Simulation Training Facility Dashboard</p>
        </div>

        {/* STATS BAR */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1.5rem', zIndex: 10 }}>
          <div style={{ background: '#2b120c', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ff4500', color: '#ffaa00', fontSize: '0.85rem' }}>
            🏆 Wins: <strong>{stats.wins}</strong>
          </div>
          <div style={{ background: '#2b120c', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ff4500', color: '#ffaa00', fontSize: '0.85rem' }}>
            💀 Losses: <strong>{stats.losses}</strong>
          </div>
          <div style={{ background: '#2b120c', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ff4500', color: '#ffaa00', fontSize: '0.85rem' }}>
            💥 Total Damage: <strong>{stats.totalDamage}</strong>
          </div>
        </div>

        <div className="versus-field">
          <div className="character-card">
            <img 
              src={selectedPlayer.img} 
              alt={selectedPlayer.name} 
              className="player-img" 
              style={{ filter: `drop-shadow(0 0 25px ${selectedPlayer.glow})` }} 
            />
            <div className="label-player">⭐ {selectedPlayer.name} (HP: {selectedPlayer.hp})</div>
          </div>

          <div className="vs-divider">VS</div>

          <div className="character-card">
            <img 
              src={selectedAi.img} 
              alt={selectedAi.name} 
              className="ai-img" 
              style={{ filter: `drop-shadow(0 0 35px ${selectedAi.glow})` }} 
            />
            <div className="label-ai">🤖 RIVAL AI: {selectedAi.name} (HP: {selectedAi.hp})</div>
          </div>
        </div>

        <div className="controls-column">
          
          {/* FEATURE 1: STRATEGY SELECTOR */}
<div className="fire-panel-base selection-box" style={{ marginBottom: '1rem' }}>
  <label className="box-title-label">🎯 SELECT AI OPPONENT STRATEGY:</label>
  <select 
    value={aiStrategy} 
    onChange={(e) => setAiStrategy(e.target.value)}
    className="ai-strategy-select"
  >
    <option value="balanced">Balanced Hybrid (Heuristic)</option>
    <option value="aggressive">Aggressive Rush (Damage Priority)</option>
    <option value="defensive">Defensive Control (Bench/Stall)</option>
  </select>
</div>

          <div className="fire-panel-base selection-box">
            <label className="box-title-label">CHOOSE YOUR FIGHTER ROSTER SELECTION:</label>
            <div className="roster-grid">
              {pokemonOptions.map((poke) => (
                <button
                  key={poke.name}
                  onClick={() => handlePlayerSelection(poke)}
                  className={`roster-btn ${selectedPlayer.name === poke.name ? 'active' : ''}`}
                >
                  {poke.name}
                </button>
              ))}
            </div>
          </div>

          {/* FEATURE 3: DECK CONFIGURATION PREVIEW */}
          <div className="fire-panel-base" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffaa00', fontSize: '0.85rem' }}>
              <span>📋 DECK CONFIGURATION (deck.csv):</span>
              <span><strong>{customDeck.length} / 60 Cards</strong></span>
            </div>
          </div>

          <div className="fire-panel-base" style={{ marginTop: '1rem' }}>
            <div className="rules-accordion-bar" onClick={() => setShowRules(!showRules)}>
              <h2 className="rules-headline">🔥 BATTLEFIELD SYSTEM RULES</h2>
              <span className={`accordion-arrow ${showRules ? 'open' : ''}`}>▼</span>
            </div>

            {showRules && (
              <div className="rules-dropdown-content">
                <ul className="rules-list-items">
                  <li>Each selected card allocates custom baseline HP parameters right into the game engine.</li>
                  <li>You must command an energy load sequence (<strong>Attach Energy</strong>) prior to attacking.</li>
                  <li>Offensive deployment consumes <strong>1 Energy charge</strong> asset to subtract 30 HP.</li>
                </ul>
              </div>
            )}
          </div>

          <button className="launch-sim-btn" onClick={startMatch}>
            Launch Combat Loop Simulation →
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW INTERFACE 2: HORIZONTAL BATTLE ARENA
  // ==========================================
  const isVictory = aiHp <= 0;

  return (
    <div className={`battle-arena-view ${isVictory ? 'victory-state' : ''}`}>
      <div className="ambient-overlay"></div>
      
      {isVictory && (
        <div className="victory-confetti-container">
          {[...Array(12)].map((_, i) => (
            <span key={i} className="confetti-spark" style={{ animationDelay: `${i * 0.15}s`, left: `${Math.random() * 100}%` }}>✨</span>
          ))}
          <div className="victory-banner-text">VICTORY CELEBRATION</div>
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #4a1a12', paddingBottom: '1rem', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: isVictory ? '#ffaa00' : '#ff4500', margin: 0, textShadow: isVictory ? '0 0 20px #ffaa00' : '0 2px 10px rgba(255,69,0,0.3)' }}>
          {isVictory ? '🏆 ARENA SIMULATION TRIUMPH' : '⚡ PTCG AI SIMULATOR ARENA'}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* FEATURE 2: REPLAY EXPORT */}
          <button 
            onClick={downloadReplayJSON}
            style={{ backgroundColor: '#160c0a', color: '#3b82f6', border: '1px solid #3b82f6', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
          >
            📥 Export Replay JSON
          </button>
          <button 
            onClick={resetGame} 
            style={{ backgroundColor: '#160c0a', color: '#ffaa00', border: '1px solid #ff4500', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}
          >
            ← Main Menu
          </button>
        </div>
      </header>

      <div className="game-grid">
        
        {/* ROW 1: THE HORIZONTAL ARENA FIELD */}
        <div className="main-arena-card">
          
          {/* USER POKÉMON */}
          <div className="combat-node player">
            <div className="pokemon-art-frame">
              <img 
                src={selectedPlayer.img} 
                alt={selectedPlayer.name} 
                style={{ width: '120px', height: '120px', objectFit: 'contain', transform: 'scaleX(-1)', filter: `drop-shadow(0 0 15px ${selectedPlayer.glow})` }} 
              />
            </div>
            <div style={{ fontWeight: '800', color: '#ffaa00', fontSize: '1.1rem' }}>⭐ {selectedPlayer.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#e4e4e7', margin: '0.25rem 0' }}>HP: {playerHp} / {selectedPlayer.hp}</div>
            <div className="hp-track-bar">
              <div style={{ width: `${(playerHp / selectedPlayer.hp) * 100}%`, backgroundColor: '#ffaa00', height: '100%', transition: 'width 0.3s' }}></div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ffaa00', fontWeight: 'bold', marginTop: '0.4rem', backgroundColor: 'rgba(255,170,0,0.08)', padding: '0.25rem', borderRadius: '4px' }}>
              🔋 ENERGY: {playerEnergy}
            </div>
          </div>

          {/* CONTROL PAD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '240px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', color: '#ffaa00', fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6 }}>
              VERSUS HUB
            </div>
            
            <button 
              onClick={attachEnergy} 
              disabled={isAiTurn || playerHp <= 0 || aiHp <= 0} 
              style={{ padding: '0.85rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '900', backgroundColor: '#ff7700', color: 'white', border: 'none', width: '100%', textTransform: 'uppercase', letterSpacing: '0.02em', boxShadow: '0 4px 12px rgba(255,119,0,0.2)' }}
            >
              Attach Energy
            </button>
            
            <button 
              onClick={attackEnemy} 
              disabled={isAiTurn || playerHp <= 0 || playerEnergy === 0 || aiHp <= 0} 
              style={{ padding: '0.85rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '900', backgroundColor: '#3b82f6', color: 'white', border: 'none', width: '100%', textTransform: 'uppercase', letterSpacing: '0.02em', opacity: (playerEnergy === 0 || isAiTurn || playerHp <= 0 || aiHp <= 0) ? 0.35 : 1, boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}
            >
              Attack (-1)
            </button>

            {(playerHp <= 0 || aiHp <= 0) && (
              <button 
                onClick={startMatch} 
                style={{ padding: '0.85rem', borderRadius: '6px', backgroundColor: '#b30000', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '900', width: '100%', textTransform: 'uppercase', letterSpacing: '0.02em', boxShadow: '0 4px 15px rgba(179,0,0,0.4)' }}
              >
                Reset Match
              </button>
            )}
          </div>

          {/* AI CHALLENGER */}
          <div className="combat-node">
            <div className="pokemon-art-frame">
              <img 
                src={selectedAi.img} 
                alt={selectedAi.name} 
                style={{ width: '120px', height: '120px', objectFit: 'contain', filter: `drop-shadow(0 0 15px ${selectedAi.glow})` }} 
              />
            </div>
            <div style={{ fontWeight: '800', color: '#ff4500', fontSize: '1.1rem' }}>🤖 {selectedAi.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#e4e4e7', margin: '0.25rem 0' }}>HP: {aiHp} / {selectedAi.hp}</div>
            <div className="hp-track-bar">
              <div style={{ width: `${(aiHp / selectedAi.hp) * 100}%`, backgroundColor: '#ff4500', height: '100%', transition: 'width 0.3s' }}></div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ff4500', fontWeight: 'bold', marginTop: '0.4rem', minHeight: '1.2rem', opacity: isAiTurn ? 1 : 0 }}>
              THINKING ({aiStrategy.toUpperCase()})...
            </div>
          </div>

        </div>

        {/* ROW 2: SIDE-BY-SIDE DIAGNOSTIC OVERLAYS */}
        <div className="battle-sidebar-stack">
          <div className="sidebar-panel-card">
            <h3 style={{ fontSize: '0.9rem', color: '#ffaa00', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧠 AI Thinking Submodule [{aiStrategy.toUpperCase()}]</h3>
            <p style={{ fontStyle: 'italic', color: '#d1d5db', fontSize: '0.85rem', marginTop: '0.75rem', lineHeight: '1.5' }}>"{aiThought}"</p>
          </div>
          
          <div className="sidebar-panel-card terminal-log-box" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#ff4500', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>💻 match_runtime_log:~$</h3>
            <div style={{ fontSize: '0.82rem', color: '#ffaa00', display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', marginTop: '0.6rem', fontFamily: 'monospace', flexGrow: 1 }}>
              {battleLogs.map((log, i) => <div key={i} style={{ opacity: i === 0 ? 1 : 0.5 }}>&gt; {log}</div>)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}