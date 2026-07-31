"use client";
import { useState, useEffect } from "react";

export default function FPLTransfers({ squad, teamData, session, players, activeChip, onTransfersComplete }) {
  const [transfersOut, setTransfersOut] = useState([]);
  const [transfersIn, setTransfersIn] = useState([]);
  const [tempBank, setTempBank] = useState(teamData ? parseFloat(teamData.bank_balance) : 0);
  const [saving, setSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  const [simulating, setSimulating] = useState(false);

  const getPriceIndicator = (ownership) => {
    if (!ownership) return null;
    const own = parseFloat(ownership);
    if (own > 15) return <span className="text-green-500 text-[10px] font-black ml-1" title="Price Rise">↑</span>;
    if (own < 2) return <span className="text-red-500 text-[10px] font-black ml-1" title="Price Fall">↓</span>;
    return null;
  };

  const handleSimulateMarket = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/market/simulate-fluctuations`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        alert("Market fluctuations applied!");
        if (onTransfersComplete) onTransfersComplete(); // Refresh parent data
      }
    } catch (err) {
      console.error(err);
    }
    setSimulating(false);
  };
  
  useEffect(() => {
    if (teamData) {
      setTempBank(parseFloat(teamData.bank_balance));
      setTransfersOut([]);
      setTransfersIn([]);
    }
  }, [teamData, squad]);

  if (!squad || !squad.starting_eleven) {
    return <div className="text-center p-8 text-[var(--text-secondary)]">No team found. Please generate a squad first.</div>;
  }

  const allSquadPlayers = [...squad.starting_eleven, ...squad.bench];
  const currentSquadIds = allSquadPlayers.map(p => p.id).filter(id => !transfersOut.some(t => t.id === id));
  
  const handleSell = (player) => {
    if (transfersOut.find(p => p.id === player.id)) return;
    setTransfersOut([...transfersOut, player]);
    setTempBank(prev => prev + (player.current_price || player.price || 0));
  };

  const handleBuy = (player) => {
    if (currentSquadIds.includes(player.id)) return;
    if (transfersIn.find(p => p.id === player.id)) return;
    setTransfersIn([...transfersIn, player]);
    setTempBank(prev => prev - (player.current_price || player.price || 0));
  };

  const handleCancelSell = (player) => {
    setTransfersOut(transfersOut.filter(p => p.id !== player.id));
    setTempBank(prev => prev - (player.current_price || player.price || 0));
  };

  const handleCancelBuy = (player) => {
    setTransfersIn(transfersIn.filter(p => p.id !== player.id));
    setTempBank(prev => prev + (player.current_price || player.price || 0));
  };

  const playChip = async (chipName) => {
    if (!session || !teamData) return;
    if (!confirm(`Are you sure you want to activate ${chipName}?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/team/${teamData.id}/activate-chip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ gameweek_id: 1, chip_name: chipName })
      });
      if (res.ok) {
        alert(chipName + " Activated!");
        if (onTransfersComplete) onTransfersComplete();
      } else {
        const d = await res.json();
        alert("Failed to activate chip: " + d.detail);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitTransfers = async () => {
    if (transfersIn.length !== transfersOut.length) {
      alert("Transfers in must equal transfers out.");
      return;
    }
    if (tempBank < 0) {
      alert("Insufficient funds!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/team/${teamData.id}/transfers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          gameweek_id: 1, // Defaulting to GW 1 for prototype
          transfers_in: transfersIn.map(p => p.id),
          transfers_out: transfersOut.map(p => p.id)
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (onTransfersComplete) onTransfersComplete();
      } else {
        alert("Transfer failed: " + data.detail);
      }
    } catch (err) {
      alert("An error occurred during transfer.");
      console.error(err);
    }
    setSaving(false);
  };

  const filteredPlayers = players.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (posFilter !== "ALL" && p.position !== posFilter) return false;
    // Don't show players already in current effective squad
    if (currentSquadIds.includes(p.id) || transfersIn.some(t => t.id === p.id)) return false;
    return true;
  }).slice(0, 50);

  const numTransfers = transfersIn.length;
  const freeTransfers = teamData?.free_transfers || 0;
  const isWildcard = activeChip === "WILDCARD" || activeChip === "FREE_HIT";
  const hits = isWildcard ? 0 : Math.max(0, numTransfers - freeTransfers) * 4;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Current Squad & Transfer Out */}
      <div className="flex-1 glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[var(--accent-primary)]">Your Squad</h2>
          <div className="text-right">
            <div className="text-sm text-[var(--text-secondary)]">Bank Balance</div>
            <div className={`text-2xl font-black ${tempBank < 0 ? 'text-red-500' : 'text-green-400'}`}>
              £{tempBank.toFixed(1)}m
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold border-b border-[var(--border-color)] pb-2 text-[var(--text-secondary)]">Sell Players</h3>
          <button 
            onClick={handleSimulateMarket}
            disabled={simulating}
            className="text-xs bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded font-bold transition-colors"
          >
            {simulating ? "Simulating..." : "📈 Simulate Market"}
          </button>
        </div>
          
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
            {allSquadPlayers.map(p => {
              const isSelling = transfersOut.some(t => t.id === p.id);
              if (isSelling) return null;
              return (
                <div key={p.id} className="flex justify-between items-center p-2 rounded bg-black/30 hover:bg-white/5 border border-transparent transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)] w-6">{p.position}</span>
                    <span className="font-bold truncate max-w-[100px]">{p.name.split(' ').pop()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-[var(--accent-primary)] flex items-center gap-1">
                      £{(p.current_price || p.price || 0).toFixed(1)}
                      {getPriceIndicator(p.selected_by_percent)}
                    </span>
                    <button 
                      onClick={() => handleSell(p)}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      {/* Middle: Transfer Pending State */}
      <div className="lg:w-[350px] glass-card p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-center">Pending Transfers</h2>
        
        <div className="flex-1 space-y-6">
          <div>
            <div className="text-sm font-bold text-red-400 mb-2">Selling (Out)</div>
            {transfersOut.length === 0 ? (
              <div className="text-xs text-[var(--text-secondary)] italic">No players selected</div>
            ) : (
              transfersOut.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 bg-red-900/20 border border-red-500/30 rounded mb-1">
                  <span className="font-bold text-sm">{p.name.split(' ').pop()}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-[var(--accent-primary)] flex items-center">
                      £{(p.current_price || p.price || 0).toFixed(1)}
                      {getPriceIndicator(p.selected_by_percent)}
                    </span>
                    <button onClick={() => handleCancelSell(p)} className="text-[var(--text-secondary)] hover:text-white">✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <div className="text-sm font-bold text-green-400 mb-2">Buying (In)</div>
            {transfersIn.length === 0 ? (
              <div className="text-xs text-[var(--text-secondary)] italic">No players selected</div>
            ) : (
              transfersIn.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 bg-green-900/20 border border-green-500/30 rounded mb-1">
                  <span className="font-bold text-sm">{p.name.split(' ').pop()}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">-£{(p.current_price || p.price || 0).toFixed(1)}</span>
                    <button onClick={() => handleCancelBuy(p)} className="text-[var(--text-secondary)] hover:text-white">✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-secondary)]">Free Transfers</span>
            <span className="font-bold">{isWildcard ? "Unlimited" : freeTransfers}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-[var(--text-secondary)]">Point Hit</span>
            <span className={`font-bold ${hits > 0 ? 'text-red-500' : 'text-green-400'}`}>
              {hits > 0 ? `-${hits}` : "0"}
            </span>
          </div>
          
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => playChip("WILDCARD")}
              disabled={activeChip === "WILDCARD"}
              className={`flex-1 py-2 text-xs font-bold rounded ${activeChip === "WILDCARD" ? 'bg-yellow-500 text-black' : 'bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-white/5'}`}
            >
              {activeChip === "WILDCARD" ? "★ Wildcard Active" : "Play Wildcard"}
            </button>
            <button 
              onClick={() => playChip("FREE_HIT")}
              disabled={activeChip === "FREE_HIT"}
              className={`flex-1 py-2 text-xs font-bold rounded ${activeChip === "FREE_HIT" ? 'bg-blue-500 text-black' : 'bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-white/5'}`}
            >
              {activeChip === "FREE_HIT" ? "★ Free Hit Active" : "Play Free Hit"}
            </button>
          </div>
          
          <button 
            onClick={submitTransfers}
            disabled={saving || transfersIn.length !== transfersOut.length || tempBank < 0 || transfersIn.length === 0}
            className="w-full btn-primary py-3 font-bold disabled:opacity-50"
          >
            {saving ? "Processing..." : `Confirm Transfers`}
          </button>
        </div>
      </div>

      {/* Right: Player Database */}
      <div className="flex-1 glass-card p-6 flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Market</h2>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search..." 
              className="input-field py-1 px-2 text-sm w-32"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="select-field py-1 px-2 text-sm"
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="GK">GK</option>
              <option value="DEF">DEF</option>
              <option value="MID">MID</option>
              <option value="FWD">FWD</option>
            </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-1">
          {filteredPlayers.map(p => (
            <div key={p.id} className="flex justify-between items-center p-2 rounded bg-black/20 hover:bg-white/5 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight">{p.name}</span>
                <span className="text-[10px] text-[var(--text-secondary)]">{p.position} • {p.team}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-green-400 flex items-center">
                  £{(p.current_price || p.price || 0).toFixed(1)}
                  {getPriceIndicator(p.selected_by_percent)}
                </span>
                <button 
                  onClick={() => handleBuy(p)}
                  className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black px-2 py-1 rounded text-xs font-bold transition-colors"
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
