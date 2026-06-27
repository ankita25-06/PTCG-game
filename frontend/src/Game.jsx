import { useState } from 'react';

export default function Game({ selectedPlayer, selectedAi, resetGame }) {
  // Interactive Match Gameplay States initialized with your selected choices
  const [playerHp, setPlayerHp] = useState(selectedPlayer.hp);
  const [aiHp, setAiHp] = useState(selectedAi.hp);
  const [playerEnergy, setPlayerEnergy] = useState(0);
  const [battleLogs, setBattleLogs] = useState([
    `⚔️ Match started! Your ${selectedPlayer.name} is facing AI Rival ${selectedAi.name}.`
  ]);
  const [aiThought, setAiThought] = useState("Waiting for player to make a tactical move...");
  const [isAiTurn, setIsAiTurn] = useState(false);

  // Player Actions Handler
  const attachEnergy = () => {
    setPlayerEnergy(prev => prev + 1);
    setBattleLogs(prev => [`🔋 You attached an Energy charge to ${selectedPlayer.name}.`, ...prev]);
  };

  const attackEnemy = async () => {
    if (playerEnergy < 1) {
      alert("You need at least 1 Energy attached to strike!");
      return;
    }
    const damage = 30;
    const newAiHp = Math.max(0, aiHp - damage);
    setAiHp(newAiHp);
    setPlayerEnergy(prev => Math.max(0, prev - 1));
    setBattleLogs(prev => [`💥 Your ${selectedPlayer.name} used Strike for ${damage} damage!`, ...prev]);

    if (newAiHp <= 0) {
      setBattleLogs(prev => [`🎉 KO! The enemy AI's ${selectedAi.name} fainted. You win!`, ...prev]);
      return;
    }
    triggerAiTurn(newAiHp);
  };

  // AI Turn Loop calling your live FastAPI backend server
  const triggerAiTurn = async (currentAiHp) => {
    setIsAiTurn(true);
    setAiThought(`Analyzing variables to counter your ${selectedPlayer.name}...`);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observation: { ai_hp: currentAiHp, player_hp: playerHp }, 
          legal_actions: [1, 2] 
        })
      });
      const data = await response.json();
      setAiThought(data.thought_process);
      if (data.action === 1) {
        setPlayerHp(prev => Math.max(0, playerHp - 20));
        setBattleLogs(prev => [`🤖 AI executed action [${data.action}]: Striked back for 20 damage!`, ...prev]);
      } else {
        setBattleLogs(prev => [`🤖 AI executed action [${data.action}]: Attached an Energy counter.`, ...prev]);
      }
    } catch (error) {
      setBattleLogs(prev => ["⚠️ Backend offline. AI slipped its action turn loop.", ...prev]);
    } finally {
      setIsAiTurn(false);
    }
  };

  const handleReplay = () => {
    setPlayerHp(selectedPlayer.hp);
    setAiHp(selectedAi.hp);
    setPlayerEnergy(0);
    setBattleLogs([`🔄 Simulation restarted! ${selectedPlayer.name} vs ${selectedAi.name}.`]);
    setAiThought("Awaiting your first move.");
  };

  return (
    <div style={{ backgroundColor: '#0e0e11', color: '#f4f4f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      
      {/* Header bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f43f5e', margin: 0 }}>⚡ Pokémon AI Arena Game board</h1>
        <button onClick={resetGame} style={{ backgroundColor: '#27272a', color: '#d1d5db', border: '1px solid #3f3f46', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
          ← Main Menu
        </button>
      </header>

      {/* Main Game Grid split structure layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Playable Arena Card Block */}
        <div style={{ backgroundColor: '#18181b', borderRadius: '12px', padding: '2rem', border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
          
          {/* AI Side Card Node */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#27272a', border: `2px solid #ef4444`, borderRadius: '8px', padding: '1rem', width: '200px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#ef4444' }}>🤖 AI {selectedAi.name}</div>
              <div style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>HP: {aiHp} / {selectedAi.hp}</div>
              <div style={{ width: '100%', backgroundColor: '#3f3f46', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(aiHp / selectedAi.hp) * 100}%`, backgroundColor: '#ef4444', height: '100%', transition: 'width 0.3s' }}></div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#71717a', fontSize: '0.85rem', letterSpacing: '0.2em', fontWeight: '900' }}>⚡ VERSUS FIELD ⚡</div>

          {/* User Player Side Card Node */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#27272a', border: `2px solid #3b82f6`, borderRadius: '8px', padding: '1rem', width: '200px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>⭐ Your {selectedPlayer.name}</div>
              <div style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>HP: {playerHp} / {selectedPlayer.hp}</div>
              <div style={{ width: '100%', backgroundColor: '#3f3f46', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(playerHp / selectedPlayer.hp) * 100}%`, backgroundColor: '#3b82f6', height: '100%', transition: 'width 0.3s' }}></div>
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#f59e0b', fontWeight: 'bold' }}>🔋 Attached Energy: {playerEnergy}</div>
            </div>
          </div>

          {/* Controller Action Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={attachEnergy} disabled={isAiTurn || playerHp <= 0 || aiHp <= 0} style={{ padding: '0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#f59e0b', color: 'black', border: 'none', fontSize: '0.9rem' }}>
              Attach Energy
            </button>
            <button onClick={attackEnemy} disabled={isAiTurn || playerHp <= 0 || playerEnergy === 0 || aiHp <= 0} style={{ padding: '0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.9rem', opacity: (playerEnergy === 0 || isAiTurn || playerHp <= 0 || aiHp <= 0) ? 0.5 : 1 }}>
              Attack (-1 Energy)
            </button>
          </div>

          {playerHp <= 0 || aiHp <= 0 ? (
            <button onClick={handleReplay} style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: '#e11d48', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '0.5rem' }}>
              Play Again
            </button>
          ) : null}
        </div>

        {/* Runtime Diagnostics Trace logs Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#18181b', borderRadius: '8px', padding: '1.25rem', border: '1px solid #27272a' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#60a5fa', marginBottom: '0.5rem', margin: 0 }}>AI Thinking Output</h3>
            <p style={{ fontStyle: 'italic', color: '#d1d5db', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>"{aiThought}"</p>
          </div>
          <div style={{ backgroundColor: '#000000', borderRadius: '8px', padding: '1.25rem', border: '1px solid #27272a', flexGrow: 1, minHeight: '200px' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#4ade80', marginBottom: '0.5rem', margin: 0 }}>match_log:~$</h3>
            <div style={{ fontSize: '0.8rem', color: '#a3e635', display: 'flex', flexDirection: 'column', gap: '0.4rem', height: '240px', overflowY: 'auto', marginTop: '0.5rem', fontFamily: 'monospace' }}>
              {battleLogs.map((log, i) => <div key={i}>&gt; {log}</div>)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}