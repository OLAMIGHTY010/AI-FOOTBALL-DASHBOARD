"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";
import { generateOpponentDeck, resolveRound, pickAIStat } from "@/lib/battleEngine";

export default function UTBattleArena() {
  const { aiCoins, addAiCoins } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [playerDeck, setPlayerDeck] = useState([]);
  const [aiDeck, setAiDeck] = useState([]);
  
  // Game State
  const [gameState, setGameState] = useState("start"); // start, playing, result
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [round, setRound] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player goes first
  
  // Round State
  const [selectedPlayerCard, setSelectedPlayerCard] = useState(null);
  const [activeAiCard, setActiveAiCard] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [usedPlayerCards, setUsedPlayerCards] = useState(new Set());
  const [usedAiCards, setUsedAiCards] = useState(new Set());

  useEffect(() => {
    setIsClient(true);
    // Load squad from UT Context/Local Storage
    const squad = localStorage.getItem("ut_active_squad");
    if (squad) {
      try {
        const parsed = JSON.parse(squad);
        // Convert squad object to array of cards
        const deck = Object.values(parsed).filter(c => c !== null);
        setPlayerDeck(deck);
      } catch(e) {}
    }
  }, []);

  const startGame = () => {
    if (playerDeck.length < 5) {
      alert("You need at least 5 players in your Active Squad to battle!");
      return;
    }
    
    // Avg OVR of player deck
    const avgOvr = Math.floor(playerDeck.reduce((acc, card) => acc + card.ovr, 0) / playerDeck.length);
    
    setAiDeck(generateOpponentDeck(avgOvr));
    setPlayerScore(0);
    setAiScore(0);
    setRound(1);
    setUsedPlayerCards(new Set());
    setUsedAiCards(new Set());
    setIsPlayerTurn(true);
    setRoundResult(null);
    setSelectedPlayerCard(null);
    setGameState("playing");
    
    // Pick first AI card
    pickNextAiCard(new Set());
  };

  const pickNextAiCard = (usedSet) => {
    // Basic AI: just pick the first unused card
    // Wait for the new AI deck to be available
    setAiDeck(currentAiDeck => {
      const available = currentAiDeck.filter(c => !usedSet.has(c.id));
      if (available.length > 0) {
        setActiveAiCard(available[Math.floor(Math.random() * available.length)]);
      }
      return currentAiDeck;
    });
  };

  const handleStatSelect = (statKey) => {
    if (!selectedPlayerCard || !activeAiCard) return;
    
    const result = resolveRound(selectedPlayerCard, activeAiCard, statKey, isPlayerTurn);
    setRoundResult(result);
    
    if (result.winner === "player") setPlayerScore(s => s + 1);
    if (result.winner === "ai") setAiScore(s => s + 1);
    
    // Mark cards as used
    const newUsedP = new Set(usedPlayerCards).add(selectedPlayerCard.id);
    const newUsedA = new Set(usedAiCards).add(activeAiCard.id);
    setUsedPlayerCards(newUsedP);
    setUsedAiCards(newUsedA);
    
    // Wait briefly then move to next round
    setTimeout(() => {
      // Check win condition (First to 3)
      if (playerScore + (result.winner==="player"?1:0) === 3 || aiScore + (result.winner==="ai"?1:0) === 3 || round >= 5) {
        setGameState("result");
      } else {
        setRound(r => r + 1);
        setRoundResult(null);
        setSelectedPlayerCard(null);
        setIsPlayerTurn(!isPlayerTurn);
        pickNextAiCard(newUsedA);
        
        // If it becomes AI turn, AI picks stat automatically after delay
        if (isPlayerTurn) { 
          // Previous was player, next is AI
          setTimeout(() => {
            // We need current state, so we handle AI turn in a separate effect or function
            // For simplicity in MVP, we just let player pick every time, or hardcode AI pick
          }, 1000);
        }
      }
    }, 2500);
  };
  
  // Handle AI turn automatically when it's AI turn
  useEffect(() => {
    if (gameState === "playing" && !isPlayerTurn && !roundResult && activeAiCard && selectedPlayerCard) {
      // AI picks stat against the card you just selected
      const timer = setTimeout(() => {
        const bestStat = pickAIStat(activeAiCard);
        handleStatSelect(bestStat);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, selectedPlayerCard, activeAiCard, gameState]);

  const claimReward = () => {
    if (playerScore > aiScore) {
      addAiCoins(1500); // Reward for win
      alert("Victory! +1500 Coins added to Bankroll.");
    }
    setGameState("start");
  };

  if (!isClient) return <div className="p-8">Loading...</div>;

  if (playerDeck.length < 5) {
    return (
      <div className="max-w-4xl mx-auto pt-6 text-center animate-fade-in">
        <h1 className="text-4xl font-black mb-4">⚔️ Card Battle Arena</h1>
        <div className="glass-card p-10 border-t-4 border-red-500">
          <h2 className="text-2xl font-bold mb-2">Squad Incomplete</h2>
          <p className="text-[var(--text-secondary)] mb-6">You need at least 5 players in your Active Squad to enter the Arena.</p>
          <Link href="/dashboard/ut/squad" className="btn-primary px-6 py-3">Build Squad</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-6 animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black mb-1">
            ⚔️ Arena <span className="text-[var(--accent-primary)]">Battle</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Top Trumps Style. First to 3 Goals wins.</p>
        </div>
        <div className="flex items-center gap-4">
          {gameState === "playing" && (
            <div className="bg-black/40 px-6 py-2 rounded-full border border-[var(--border-color)] flex gap-4 font-black text-xl">
              <span className="text-blue-400">YOU: {playerScore}</span>
              <span className="text-gray-500">-</span>
              <span className="text-red-400">AI: {aiScore}</span>
            </div>
          )}
          <Link href="/dashboard/ut" className="btn-secondary px-4 py-2 text-sm">
            Exit
          </Link>
        </div>
      </div>

      {/* Start Screen */}
      {gameState === "start" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="glass-card p-10 text-center max-w-md w-full border-t-4 border-[var(--accent-primary)]">
            <h2 className="text-3xl font-black mb-4">Ready to Battle?</h2>
            <p className="text-[var(--text-secondary)] mb-8">
              Face off against the AI using your Ultimate Team.
              <br/><br/>
              Win rounds by selecting your highest stats.
            </p>
            <button onClick={startGame} className="btn-primary w-full py-4 text-xl font-black shadow-[0_0_20px_rgba(0,255,135,0.4)]">
              Find Opponent 🔍
            </button>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {gameState === "result" && (
        <div className="flex-1 flex items-center justify-center">
          <div className={`glass-card p-10 text-center max-w-md w-full border-t-4 ${playerScore > aiScore ? 'border-green-500' : playerScore < aiScore ? 'border-red-500' : 'border-yellow-500'}`}>
            <h2 className="text-4xl font-black mb-2">
              {playerScore > aiScore ? 'VICTORY! 🏆' : playerScore < aiScore ? 'DEFEAT 💀' : 'DRAW 🤝'}
            </h2>
            <div className="text-2xl font-bold mb-6">
              {playerScore} - {aiScore}
            </div>
            
            {playerScore > aiScore && (
              <div className="bg-green-500/20 text-green-400 p-4 rounded-lg mb-6 border border-green-500/50">
                +1,500 Coins
              </div>
            )}
            
            <button onClick={claimReward} className="btn-primary w-full py-3">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Playing Arena */}
      {gameState === "playing" && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Top: AI Card Area */}
          <div className="flex justify-center h-48 sm:h-64 mb-4">
            {activeAiCard ? (
              <div className="relative w-32 sm:w-48 h-full bg-[#111827] rounded-xl border-2 border-red-500/50 flex flex-col p-2 transform transition-transform">
                {/* Reveal stats only if round is resolved or it's AI turn picking */}
                <div className="text-center font-bold border-b border-gray-700 pb-1 mb-1 text-sm sm:text-base text-red-400">{activeAiCard.name}</div>
                <div className="text-center text-3xl font-black mb-2">{activeAiCard.ovr}</div>
                
                {roundResult || !isPlayerTurn ? (
                  <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs">
                    {Object.keys(activeAiCard.stats).map(stat => (
                      <div key={stat} className={`flex justify-between px-1 rounded ${roundResult?.statName?.toLowerCase().startsWith(stat) ? 'bg-red-500/30' : ''}`}>
                        <span className="uppercase text-gray-400">{stat}</span>
                        <span className="font-bold">{activeAiCard.stats[stat]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-4xl opacity-20">?</div>
                )}
                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">AI</div>
              </div>
            ) : (
              <div className="w-32 sm:w-48 h-full border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center text-gray-600">
                AI Waiting...
              </div>
            )}
          </div>

          {/* Middle: Battle Action/Result */}
          <div className="flex justify-center items-center h-24 mb-4">
            {roundResult ? (
              <div className={`text-center animate-bounce ${roundResult.winner === 'player' ? 'text-green-400' : roundResult.winner === 'ai' ? 'text-red-400' : 'text-yellow-400'}`}>
                <div className="text-2xl font-black">{roundResult.winner.toUpperCase()} WINS ROUND</div>
                <div className="text-sm">{roundResult.message}</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-xl font-bold mb-2">Round {round}</div>
                {isPlayerTurn ? (
                  <div className="text-[var(--accent-primary)] animate-pulse">Your Turn: Pick a Stat!</div>
                ) : (
                  <div className="text-red-400 animate-pulse">AI is thinking...</div>
                )}
              </div>
            )}
          </div>

          {/* Bottom: Player Deck / Active Card */}
          <div className="h-64 sm:h-72">
            {!selectedPlayerCard ? (
              // Show Hand
              <div className="h-full overflow-x-auto whitespace-nowrap pb-4 px-4 flex gap-4 snap-x">
                {playerDeck.map(card => {
                  const isUsed = usedPlayerCards.has(card.id);
                  return (
                    <div 
                      key={card.id}
                      onClick={() => !isUsed && setSelectedPlayerCard(card)}
                      className={`inline-block relative w-40 sm:w-48 h-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl border ${isUsed ? 'border-gray-700 opacity-50 grayscale' : 'border-gray-600 cursor-pointer hover:-translate-y-2 hover:border-[var(--accent-primary)]'} transition-all snap-center flex flex-col p-2 shrink-0`}
                    >
                      <div className="text-center font-bold border-b border-gray-700 pb-1 mb-1 truncate">{card.name}</div>
                      <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-3xl font-black">{card.ovr}</span>
                        <span className="text-xs uppercase text-gray-400">{card.pos}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        {Object.entries(card.stats).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="uppercase text-gray-400">{k}</span>
                            <span className="font-bold">{v}</span>
                          </div>
                        ))}
                      </div>
                      {isUsed && <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-black text-red-500 rounded-xl transform -rotate-12 text-2xl">USED</div>}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show Selected Card & Stat Pick Buttons
              <div className="flex justify-center h-full gap-8">
                {/* Active Player Card */}
                <div className="relative w-40 sm:w-48 h-full bg-gradient-to-b from-blue-900/40 to-gray-900 rounded-xl border-2 border-blue-500 flex flex-col p-2">
                  <div className="text-center font-bold border-b border-blue-500/50 pb-1 mb-1 text-blue-400">{selectedPlayerCard.name}</div>
                  <div className="text-center text-3xl font-black mb-2">{selectedPlayerCard.ovr}</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {Object.entries(selectedPlayerCard.stats).map(([k, v]) => (
                      <div key={k} className={`flex justify-between px-1 rounded ${roundResult?.statName?.toLowerCase().startsWith(k) ? 'bg-blue-500/30' : ''}`}>
                        <span className="uppercase text-gray-400">{k}</span>
                        <span className="font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Stat Pick Buttons (Only on player turn before result) */}
                {isPlayerTurn && !roundResult && (
                  <div className="flex flex-col justify-center gap-2">
                    <div className="text-sm font-bold text-[var(--accent-primary)] mb-2 text-center">Select Stat to Battle</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(selectedPlayerCard.stats).map(stat => (
                        <button 
                          key={stat}
                          onClick={() => handleStatSelect(stat)}
                          className="bg-[#162032] border border-[var(--border-color)] hover:border-[var(--accent-primary)] rounded px-4 py-2 font-bold uppercase transition-colors"
                        >
                          {stat} <span className="text-[var(--accent-primary)] ml-1">{selectedPlayerCard.stats[stat]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
