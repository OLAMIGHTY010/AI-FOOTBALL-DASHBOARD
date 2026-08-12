"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

export default function MultiplayerPvP() {
  const { user, aiCoins, deductCoins, addCoins } = useAppContext();
  
  // Lobby State
  const [wager, setWager] = useState(50);
  const [matchState, setMatchState] = useState("setup"); // setup, matchmaking, battling, finished
  const [matchData, setMatchData] = useState(null);
  
  // Game State
  const [playerDeck, setPlayerDeck] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [round, setRound] = useState(1);
  const [isMyTurn, setIsMyTurn] = useState(false);
  
  // Round specific state
  const [selectedPlayerCard, setSelectedPlayerCard] = useState(null);
  const [selectedStat, setSelectedStat] = useState(null);
  const [opponentCard, setOpponentCard] = useState(null);
  const [opponentStat, setOpponentStat] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [usedCardIds, setUsedCardIds] = useState(new Set());
  
  // Realtime Channel
  const [channel, setChannel] = useState(null);
  const [isAttacker, setIsAttacker] = useState(false);

  useEffect(() => {
    // Load squad
    const squadData = JSON.parse(localStorage.getItem("ut_active_squad") || "{}");
    const activeCards = Object.values(squadData).filter(c => c !== null);
    if (activeCards.length === 11) {
      setPlayerDeck(activeCards);
    }
    
    // Cleanup on unmount
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const startMatchmaking = async () => {
    if (!user) {
      alert("Must be logged in.");
      return;
    }
    if (playerDeck.length < 11) {
      alert("You need a full 11-man Active Squad to play PVP!");
      return;
    }
    if (aiCoins < wager) {
      alert("Not enough AI Coins for this wager!");
      return;
    }
    
    setMatchState("matchmaking");
    
    try {
      const { data, error } = await supabase.rpc('pvp_matchmake', {
        p_player_id: user.id,
        p_player_name: user.email.split('@')[0],
        p_wager: wager
      });
      
      if (error) throw error;
      
      setMatchData(data.match);
      deductCoins(wager);
      
      if (data.status === 'created') {
        listenForMatchStart(data.match.id);
      } else if (data.status === 'joined') {
        joinMatchChannel(data.match.id, data.match, false);
      }
    } catch (err) {
      console.error(err);
      alert("Matchmaking failed: " + err.message);
      setMatchState("setup");
    }
  };
  
  const listenForMatchStart = (matchId) => {
    const dbChannel = supabase.channel(`public:pvp_matches:id=eq.${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pvp_matches', filter: `id=eq.${matchId}` }, payload => {
        if (payload.new.status === 'active') {
          setMatchData(payload.new);
          supabase.removeChannel(dbChannel);
          joinMatchChannel(matchId, payload.new, true); // Creator is attacker first
        }
      })
      .subscribe();
  };
  
  const joinMatchChannel = (matchId, matchDetails, isCreator) => {
    setMatchState("battling");
    setIsMyTurn(isCreator);
    setIsAttacker(isCreator);
    setRound(1);
    
    const gameChan = supabase.channel(`pvp-${matchId}`);
    
    gameChan
      .on('broadcast', { event: 'play_attacker' }, payload => {
        setOpponentCard(payload.payload.card);
        setOpponentStat(payload.payload.stat);
        setIsMyTurn(true);
        setIsAttacker(false); // They are defending
      })
      .on('broadcast', { event: 'play_defender' }, payload => {
        setOpponentCard(payload.payload.card);
        // The defender played, we can resolve the round!
        resolveRound(payload.payload.card);
      })
      .on('broadcast', { event: 'sync_result' }, payload => {
        // Just to make sure we are synced
        setRoundResult(payload.payload.result);
        setTimeout(() => advanceRound(payload.payload.nextAttacker), 3000);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setChannel(gameChan);
        }
      });
  };
  
  const cancelMatchmaking = async () => {
    if (!matchData) return;
    try {
      await supabase.rpc('pvp_cancel_match', {
        p_match_id: matchData.id,
        p_player_id: user.id
      });
      addCoins(wager);
      setMatchState("setup");
      setMatchData(null);
    } catch (err) {
      console.error(err);
    }
  };

  const executeAttackerTurn = () => {
    if (!selectedPlayerCard || !selectedStat || !isMyTurn || !isAttacker) return;
    setIsMyTurn(false);
    
    channel.send({
      type: 'broadcast',
      event: 'play_attacker',
      payload: { card: selectedPlayerCard, stat: selectedStat }
    });
  };

  const executeDefenderTurn = () => {
    if (!selectedPlayerCard || !isMyTurn || isAttacker) return;
    setIsMyTurn(false);
    
    channel.send({
      type: 'broadcast',
      event: 'play_defender',
      payload: { card: selectedPlayerCard }
    });
    
    resolveRound(selectedPlayerCard);
  };

  const resolveRound = (defendingCardLoc) => {
    // Both clients run this independently when the defender plays their card
    let myCard = isAttacker ? selectedPlayerCard : defendingCardLoc; // Wait, if I'm defender, my card is selectedPlayerCard, opponentCard is attacker card
    
    let attackerC = isAttacker ? selectedPlayerCard : opponentCard;
    let defenderC = isAttacker ? defendingCardLoc : selectedPlayerCard;
    
    let attackerStatVal = attackerC[selectedStat || opponentStat];
    let defenderStatVal = defenderC[selectedStat || opponentStat];
    
    let iWon = false;
    let isDraw = false;
    
    if (attackerStatVal > defenderStatVal) {
      if (isAttacker) iWon = true;
    } else if (defenderStatVal > attackerStatVal) {
      if (!isAttacker) iWon = true;
    } else {
      isDraw = true;
    }
    
    // Update Scores
    if (iWon && !isDraw) setPlayerScore(s => s + 1);
    if (!iWon && !isDraw) setOpponentScore(s => s + 1);
    
    // Add used cards
    setUsedCardIds(prev => new Set(prev).add(selectedPlayerCard.id));
    
    let resultText = isDraw ? "Round Drawn!" : iWon ? "You Won the Round!" : "Opponent Won the Round!";
    setRoundResult({
      text: resultText,
      attackerCard: attackerC,
      defenderCard: defenderC,
      statUsed: selectedStat || opponentStat
    });
    
    // Attacker decides who goes next (winner of round, or defender if draw)
    if (isAttacker) {
      let nextAttacker = isDraw ? false : iWon; // if draw, defender attacks next. if I won, I attack next.
      channel.send({
        type: 'broadcast',
        event: 'sync_result',
        payload: { result: {text: resultText, attackerCard: attackerC, defenderCard: defenderC, statUsed: selectedStat || opponentStat}, nextAttacker }
      });
      setTimeout(() => advanceRound(nextAttacker), 3000);
    }
  };

  const advanceRound = (amINextAttacker) => {
    if (round === 11) {
      finishMatch();
      return;
    }
    setRound(r => r + 1);
    setRoundResult(null);
    setSelectedPlayerCard(null);
    setSelectedStat(null);
    setOpponentCard(null);
    setOpponentStat(null);
    setIsAttacker(amINextAttacker);
    setIsMyTurn(amINextAttacker);
  };

  const finishMatch = async () => {
    setMatchState("finished");
    if (channel) supabase.removeChannel(channel);
    
    // If I won, I claim the prize
    if (playerScore > opponentScore) {
      try {
        const { data, error } = await supabase.rpc('pvp_finish_match', {
          p_match_id: matchData.id,
          p_winner_id: user.id
        });
        if (error) throw error;
        addCoins(data.prize);
        // Note: The system tax has been applied automatically in the RPC!
      } catch (err) {
        console.error("Failed to claim prize:", err);
      }
    }
  };

  // --- UI HELPERS ---
  const getStatColor = (val) => {
    if (val >= 90) return "text-green-400";
    if (val >= 80) return "text-yellow-400";
    if (val >= 70) return "text-orange-400";
    return "text-red-400";
  };
  
  const renderCard = (p, isSelectable = false, hideStats = false) => {
    if (!p) return <div className="w-32 h-48 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center bg-gray-800/50">Empty</div>;
    
    const isSelected = selectedPlayerCard?.id === p.id;
    const isUsed = usedCardIds.has(p.id);
    
    return (
      <div 
        onClick={() => { if (isSelectable && !isUsed && isMyTurn) setSelectedPlayerCard(p); }}
        className={`w-32 flex-shrink-0 relative rounded-xl overflow-hidden cursor-pointer transition-all ${isSelectable && !isUsed && 'hover:scale-105 hover:-translate-y-2'} ${isSelected ? 'ring-4 ring-[var(--accent-primary)] shadow-[0_0_20px_var(--accent-primary)]' : ''} ${isUsed ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
      >
        <div className={`h-48 bg-gradient-to-br from-gray-700 to-gray-900 p-2 flex flex-col justify-end relative`}>
          <div className="absolute top-1 left-2 text-xs font-bold text-gray-400">{p.position}</div>
          <div className="absolute top-1 right-2 text-xl font-black text-white">{hideStats ? '?' : p.rating}</div>
          <h4 className="font-black text-sm text-center text-white truncate drop-shadow-md z-10 leading-tight mb-1">{p.name}</h4>
          
          {!hideStats && (
            <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[0.65rem] bg-black/60 p-1 rounded backdrop-blur-sm z-10">
              <div className="flex justify-between"><span>PAC</span><span className={`font-bold ${getStatColor(p.pace)}`}>{p.pace}</span></div>
              <div className="flex justify-between"><span>DRI</span><span className={`font-bold ${getStatColor(p.dribbling)}`}>{p.dribbling}</span></div>
              <div className="flex justify-between"><span>SHO</span><span className={`font-bold ${getStatColor(p.shooting)}`}>{p.shooting}</span></div>
              <div className="flex justify-between"><span>DEF</span><span className={`font-bold ${getStatColor(p.defending)}`}>{p.defending}</span></div>
              <div className="flex justify-between"><span>PAS</span><span className={`font-bold ${getStatColor(p.passing)}`}>{p.passing}</span></div>
              <div className="flex justify-between"><span>PHY</span><span className={`font-bold ${getStatColor(p.physicality)}`}>{p.physicality}</span></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center border-2 border-[var(--accent-primary)]">
          <span className="text-xl">⚔️</span>
        </div>
        <div>
          <h1 className="text-2xl font-black gradient-text">Multiplayer Arena</h1>
        </div>
        <div className="ml-auto glass-card !py-2 !px-4 flex items-center gap-2">
          <span>🪙</span> <span className="font-black text-[var(--accent-primary)]">{aiCoins.toLocaleString()}</span>
        </div>
      </div>

      {matchState === "setup" && (
        <div className="glass-card text-center py-12 max-w-xl mx-auto mt-10">
          <span className="text-6xl mb-6 block">🏟️</span>
          <h2 className="text-2xl font-black mb-4">Enter the Arena</h2>
          <p className="text-[var(--text-secondary)] font-bold mb-8">Wager AI Coins against others. The system takes a 10% fee from the prize pool.</p>
          
          {playerDeck.length === 11 ? (
            <div>
              <div className="flex justify-center items-center gap-4 mb-8">
                <span className="font-bold text-xl">Wager:</span>
                <input 
                  type="number" 
                  value={wager} 
                  onChange={(e) => setWager(parseInt(e.target.value) || 0)}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2 rounded-lg text-2xl font-black text-[var(--accent-primary)] w-32 text-center focus:border-[var(--accent-primary)] outline-none"
                  min="50"
                  step="50"
                />
              </div>
              <button onClick={startMatchmaking} className="btn-primary !text-xl !py-4 px-12 animate-pulse-glow">
                Find Match 🔍
              </button>
            </div>
          ) : (
            <div className="text-red-400 font-bold mb-6">
              You need a full 11-man squad to play. Go to the Squad Builder first!
            </div>
          )}
        </div>
      )}

      {matchState === "matchmaking" && (
        <div className="glass-card text-center py-20 max-w-xl mx-auto relative overflow-hidden mt-10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-[var(--accent-primary)]/30 rounded-full animate-ping absolute"></div>
            <div className="w-48 h-48 border-4 border-[var(--accent-primary)]/50 rounded-full animate-ping absolute" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-32 h-32 border-4 border-[var(--accent-primary)] rounded-full absolute bg-[var(--bg-secondary)] z-10 flex items-center justify-center">
              <span className="text-4xl animate-bounce">📡</span>
            </div>
          </div>
          <div className="relative z-20 mt-48">
            <h2 className="text-2xl font-black mb-2 text-white drop-shadow-md">Searching for Opponent...</h2>
            <p className="text-[var(--accent-primary)] font-bold mb-8 drop-shadow-md">Wager: ${wager}</p>
            <button onClick={cancelMatchmaking} className="btn-secondary">Cancel Search</button>
          </div>
        </div>
      )}

      {matchState === "battling" && (
        <div className="flex-1 flex flex-col gap-4">
          {/* Scoreboard */}
          <div className="glass-card !py-3 flex justify-between items-center bg-black/40">
            <div className="flex flex-col items-center w-1/3">
              <span className="text-[var(--accent-primary)] font-black text-2xl">{playerScore}</span>
              <span className="text-xs font-bold text-[var(--text-secondary)]">YOU</span>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <span className="text-sm font-bold text-gray-400">ROUND {round}/11</span>
              <span className="text-xs text-[var(--accent-primary)] font-black">{isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN"}</span>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <span className="text-red-500 font-black text-2xl">{opponentScore}</span>
              <span className="text-xs font-bold text-[var(--text-secondary)]">{matchData.player1_id === user.id ? matchData.player2_name : matchData.player1_name}</span>
            </div>
          </div>

          {/* Battlefield */}
          <div className="flex-1 glass-card flex flex-col items-center justify-center relative bg-[url('/pitch_pattern.png')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/60 z-0"></div>
            
            {roundResult ? (
              <div className="z-10 text-center animate-fade-in flex flex-col items-center">
                <h2 className="text-4xl font-black text-white mb-6 drop-shadow-lg">{roundResult.text}</h2>
                <div className="flex gap-12 items-center">
                  <div className="flex flex-col items-center">
                    <span className="mb-2 font-bold text-[var(--accent-primary)]">{isAttacker ? 'You (Attacker)' : 'You (Defender)'}</span>
                    {renderCard(isAttacker ? roundResult.attackerCard : roundResult.defenderCard)}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black bg-black/80 px-4 py-2 rounded-lg border border-[var(--accent-primary)]">
                      {roundResult.statUsed.toUpperCase()}
                    </span>
                    <span className="text-3xl mt-2">⚔️</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="mb-2 font-bold text-red-400">{isAttacker ? 'Opponent (Defender)' : 'Opponent (Attacker)'}</span>
                    {renderCard(isAttacker ? roundResult.defenderCard : roundResult.attackerCard)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="z-10 flex w-full max-w-4xl justify-between items-center px-12">
                
                {/* My Side */}
                <div className="flex flex-col items-center w-64">
                  <span className="mb-4 font-bold text-[var(--text-secondary)]">Your Active Card</span>
                  {selectedPlayerCard ? (
                    renderCard(selectedPlayerCard)
                  ) : (
                    <div className="w-32 h-48 border-2 border-dashed border-[var(--accent-primary)] rounded-xl flex items-center justify-center bg-[var(--accent-primary)]/10 text-center p-4">
                      <span className="text-sm font-bold text-[var(--accent-primary)]">Select from deck below</span>
                    </div>
                  )}
                  
                  {isMyTurn && isAttacker && selectedPlayerCard && (
                    <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                      {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physicality'].map(stat => (
                        <button
                          key={stat}
                          onClick={() => setSelectedStat(stat)}
                          className={`px-2 py-1 text-xs font-bold rounded border ${selectedStat === stat ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-black' : 'border-gray-600 hover:border-[var(--accent-primary)]'}`}
                        >
                          {stat.toUpperCase()} ({selectedPlayerCard[stat]})
                        </button>
                      ))}
                    </div>
                  )}
                  {isMyTurn && isAttacker && selectedPlayerCard && selectedStat && (
                    <button onClick={executeAttackerTurn} className="mt-4 btn-primary w-full animate-pulse-glow">Attack</button>
                  )}
                  
                  {isMyTurn && !isAttacker && selectedPlayerCard && (
                    <button onClick={executeDefenderTurn} className="mt-4 btn-primary w-full animate-pulse-glow">Defend</button>
                  )}
                </div>

                {/* Center VS */}
                <div className="flex flex-col items-center justify-center w-32">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/50 mb-2">
                    <span className="text-2xl font-black text-red-500">VS</span>
                  </div>
                  {opponentStat && (
                    <div className="bg-black/80 px-3 py-1 rounded text-center border border-[var(--accent-primary)]">
                      <span className="block text-[0.6rem] text-gray-400">CHALLENGE</span>
                      <span className="font-black text-[var(--accent-primary)]">{opponentStat.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Opponent Side */}
                <div className="flex flex-col items-center w-64">
                  <span className="mb-4 font-bold text-[var(--text-secondary)]">Opponent's Card</span>
                  {opponentCard ? (
                    // Hide stats if they are attacking and haven't revealed? No, they broadcasted their card. Actually, hide stats until round resolved.
                    renderCard(opponentCard, false, true) 
                  ) : (
                    <div className="w-32 h-48 border-2 border-dashed border-red-500/50 rounded-xl flex items-center justify-center bg-red-500/10 text-center p-4">
                      <span className="text-sm font-bold text-red-400">Waiting for opponent...</span>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Player Deck */}
          <div className="glass-card flex-shrink-0 !p-4">
            <h3 className="font-bold text-[var(--text-secondary)] mb-2">Your Deck ({11 - usedCardIds.size} remaining)</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {playerDeck.map(card => renderCard(card, true))}
            </div>
          </div>
        </div>
      )}

      {matchState === "finished" && (
        <div className="glass-card text-center py-20 max-w-2xl mx-auto mt-10">
          <span className="text-6xl mb-6 block">{playerScore > opponentScore ? '🏆' : '💀'}</span>
          <h2 className="text-4xl font-black mb-4 gradient-text">{playerScore > opponentScore ? 'VICTORY!' : 'DEFEAT'}</h2>
          <p className="text-xl mb-8">Final Score: {playerScore} - {opponentScore}</p>
          
          {playerScore > opponentScore && (
            <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)] p-6 rounded-xl mb-8 inline-block">
              <span className="block font-bold text-green-400 mb-2">PRIZE CLAIMED (After 10% System Tax)</span>
              <span className="text-4xl font-black text-white">+${((wager * 2) * 0.9).toFixed(0)}</span>
            </div>
          )}

          <div>
            <Link href="/dashboard/ut" className="btn-primary">
              Return to Ultimate Team
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
