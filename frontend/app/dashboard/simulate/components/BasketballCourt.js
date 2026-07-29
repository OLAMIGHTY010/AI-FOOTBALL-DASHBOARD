export default function BasketballCourt({ homePlayers, awayPlayers, ballPos, weather, overlayMsg }) {
  // Basketball doesn't have weather affecting the hardwood, but we'll keep the prop just in case
  return (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden bg-[#e0a96d] border-4 border-[#8b4513] rounded-xl shadow-inner">
      {/* Wood texture effect */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ 
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(139,69,19,0.2) 10px, rgba(139,69,19,0.2) 20px)"
        }}
      ></div>

      {/* Field Markings (White Lines) */}
      <div className="absolute top-4 bottom-4 left-4 right-4 border-[3px] border-white/80 pointer-events-none"></div>
      
      {/* Half Court Line */}
      <div className="absolute top-4 bottom-4 left-1/2 w-0 border-l-[3px] border-white/80 pointer-events-none -translate-x-1/2"></div>
      
      {/* Center Circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-[3px] border-white/80 rounded-full pointer-events-none"></div>
      
      {/* Left 3-Point Line */}
      <div className="absolute top-[10%] bottom-[10%] left-4 w-1/4 border-[3px] border-l-0 border-white/80 rounded-r-full pointer-events-none"></div>
      
      {/* Left Paint (Key) */}
      <div className="absolute top-1/3 bottom-1/3 left-4 w-1/6 border-[3px] border-l-0 border-white/80 pointer-events-none bg-[#cf8539]"></div>
      
      {/* Left Hoop */}
      <div className="absolute top-1/2 -translate-y-1/2 left-[8%] w-4 h-4 border-2 border-[#ff4500] rounded-full pointer-events-none shadow-sm bg-white/10"></div>
      <div className="absolute top-[45%] bottom-[45%] left-[6%] w-[2%] bg-white/90 pointer-events-none"></div>

      {/* Right 3-Point Line */}
      <div className="absolute top-[10%] bottom-[10%] right-4 w-1/4 border-[3px] border-r-0 border-white/80 rounded-l-full pointer-events-none"></div>
      
      {/* Right Paint (Key) */}
      <div className="absolute top-1/3 bottom-1/3 right-4 w-1/6 border-[3px] border-r-0 border-white/80 pointer-events-none bg-[#cf8539]"></div>
      
      {/* Right Hoop */}
      <div className="absolute top-1/2 -translate-y-1/2 right-[8%] w-4 h-4 border-2 border-[#ff4500] rounded-full pointer-events-none shadow-sm bg-white/10"></div>
      <div className="absolute top-[45%] bottom-[45%] right-[6%] w-[2%] bg-white/90 pointer-events-none"></div>

      {/* Home Team */}
      {homePlayers.map(p => (
        <div 
          key={p.id} 
          className="absolute w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg pointer-events-none transition-all duration-700 ease-in-out flex items-center justify-center text-[10px] font-black text-white" 
          style={{ left: `${p.current_x ?? p.base_x}%`, top: `${p.current_y ?? p.base_y}%`, transform: 'translate(-50%, -50%)' }}
        >
        </div>
      ))}

      {/* Away Team */}
      {awayPlayers.map(p => (
        <div 
          key={p.id} 
          className="absolute w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-lg pointer-events-none transition-all duration-700 ease-in-out flex items-center justify-center text-[10px] font-black text-white" 
          style={{ left: `${p.current_x ?? p.base_x}%`, top: `${p.current_y ?? p.base_y}%`, transform: 'translate(-50%, -50%)' }}
        >
        </div>
      ))}

      {/* Animated Basketball */}
      <div 
        className="absolute w-6 h-6 text-xl drop-shadow-xl z-20 pointer-events-none"
        style={{
          left: `${ballPos.x}%`, 
          top: `${ballPos.y}%`, 
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.6s ease-out, top 0.6s ease-out'
        }}
      >
        🏀
      </div>

      {/* Event Overlay Flash */}
      {overlayMsg && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 animate-fade-in pointer-events-none">
          <span className="text-4xl md:text-6xl font-black text-[#ff7b00] italic drop-shadow-[0_0_20px_rgba(255,123,0,0.8)] scale-110 uppercase tracking-widest">
            {overlayMsg}
          </span>
        </div>
      )}
    </div>
  );
}
