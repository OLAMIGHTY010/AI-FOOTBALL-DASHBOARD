export default function RaceTrack({ raceData, currentEvent }) {
  if (!raceData || !raceData.runners) return null;

  const runners = raceData.runners;
  const positions = currentEvent ? currentEvent.positions : {};

  return (
    <div className="w-full glass-card bg-gradient-to-b from-[#2a3a2a] to-[#1a2a1a] p-4 relative border-t-8 border-b-8 border-green-800 rounded-none mb-6">
      <div className="text-center mb-4 border-b border-white/10 pb-2">
        <h2 className="font-black text-white text-xl tracking-wider uppercase">🏁 {raceData.name || "Virtual Derby"} 🏁</h2>
        {currentEvent && <p className="text-green-400 font-bold text-sm">Race in Progress... (Tick {currentEvent.tick}/90)</p>}
      </div>

      <div className="relative border-l-4 border-white/50 border-r-4 border-red-500/80 rounded py-2 shadow-inner bg-black/20">
        
        {/* Track lines */}
        <div className="absolute top-0 bottom-0 left-[25%] border-l-2 border-white/10 border-dashed pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 left-[50%] border-l-2 border-white/10 border-dashed pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 left-[75%] border-l-2 border-white/10 border-dashed pointer-events-none"></div>

        <div className="absolute -top-6 right-0 text-red-500 font-bold text-xs uppercase pr-1">Finish</div>
        <div className="absolute -top-6 left-0 text-white/50 font-bold text-xs uppercase pl-1">Start</div>

        <div className="flex flex-col gap-2">
          {runners.map((runner, index) => {
            const distance = positions[runner.id] || 0.0;
            const finished = distance >= 100.0;
            
            // Assign a color based on lane
            const colors = [
              "bg-red-500", "bg-blue-500", "bg-yellow-400", "bg-purple-500", 
              "bg-pink-500", "bg-orange-500", "bg-teal-400", "bg-gray-300"
            ];
            const laneColor = colors[index % colors.length];

            return (
              <div key={runner.id} className="relative h-12 w-full bg-white/5 rounded overflow-hidden flex items-center border border-white/5">
                
                {/* Progress Bar underlay (optional, for visual effect) */}
                <div 
                  className="absolute top-0 left-0 bottom-0 bg-white/10 transition-all duration-300" 
                  style={{ width: `${Math.min(distance, 100)}%` }}
                ></div>

                {/* Name / Info Box */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-black/80 border-r border-white/20 flex flex-col justify-center items-center z-20">
                  <span className="text-[10px] font-bold text-white/50 uppercase">Lane {index + 1}</span>
                  <span className="text-[10px] font-black text-white text-center leading-tight truncate w-full px-1">{runner.name}</span>
                </div>

                {/* The Runner Marker */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 flex items-center transition-all duration-500 ease-linear z-30"
                  style={{ left: `calc(${Math.min(distance, 100)}% - 24px)` }}
                >
                  <div className={`w-6 h-6 rounded-full ${laneColor} border-2 border-white shadow-lg flex items-center justify-center`}>
                    <span className="text-[10px] font-black text-black">{index + 1}</span>
                  </div>
                  <span className="text-xl ml-1 filter drop-shadow-md">🐎</span>
                  
                  {/* Dust trail if moving fast */}
                  {!finished && distance > 5 && distance < 95 && (
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-4 h-2 bg-white/20 blur-sm rounded-full animate-pulse"></div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
