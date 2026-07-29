export default function TennisCourt({ home, away, ballPos, overlayMsg }) {
  // home and away just need a base_x and base_y.
  // We can position the court horizontally or vertically. Let's do horizontal.
  // Court: Left to right.
  // Home player left, away player right.

  return (
    <div className="relative w-full h-[300px] md:h-[400px] bg-[#2b5936] overflow-hidden">
      {/* Outer Court Lines */}
      <div className="absolute top-8 bottom-8 left-12 right-12 border-4 border-white pointer-events-none"></div>
      
      {/* Singles Sidelines */}
      <div className="absolute top-16 bottom-16 left-12 right-12 border-y-2 border-white pointer-events-none"></div>
      
      {/* Net */}
      <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-1.5 bg-gray-300 pointer-events-none border-x border-gray-400 z-10"></div>
      
      {/* Service Lines */}
      <div className="absolute top-16 bottom-16 left-[30%] w-0 border-l-2 border-white pointer-events-none"></div>
      <div className="absolute top-16 bottom-16 right-[30%] w-0 border-r-2 border-white pointer-events-none"></div>
      
      {/* Center Service Line */}
      <div className="absolute top-1/2 -translate-y-1/2 left-[30%] right-[30%] h-0 border-b-2 border-white pointer-events-none"></div>
      
      {/* Center Marks */}
      <div className="absolute top-1/2 -translate-y-1/2 left-12 w-2 h-0 border-b-2 border-white pointer-events-none"></div>
      <div className="absolute top-1/2 -translate-y-1/2 right-12 w-2 h-0 border-b-2 border-white pointer-events-none"></div>

      {/* Home Player */}
      <div 
        className="absolute w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg pointer-events-none transition-all duration-700 ease-in-out z-20" 
        style={{ left: `${home.current_x ?? 5}%`, top: `${home.current_y ?? 50}%`, transform: 'translate(-50%, -50%)' }}
      ></div>
      <div className="absolute text-[10px] font-bold text-white z-20 pointer-events-none" style={{ left: `${home.current_x ?? 5}%`, top: `${(home.current_y ?? 50) + 5}%`, transform: 'translateX(-50%)' }}>
        {home.name}
      </div>

      {/* Away Player */}
      <div 
        className="absolute w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg pointer-events-none transition-all duration-700 ease-in-out z-20" 
        style={{ left: `${away.current_x ?? 95}%`, top: `${away.current_y ?? 50}%`, transform: 'translate(-50%, -50%)' }}
      ></div>
      <div className="absolute text-[10px] font-bold text-white z-20 pointer-events-none" style={{ left: `${away.current_x ?? 95}%`, top: `${(away.current_y ?? 50) + 5}%`, transform: 'translateX(-50%)' }}>
        {away.name}
      </div>

      {/* Animated Ball */}
      <div 
        className="absolute w-4 h-4 bg-[#c6ff00] rounded-full drop-shadow-xl z-30 pointer-events-none border border-black/20"
        style={{
          left: `${ballPos.x}%`, 
          top: `${ballPos.y}%`, 
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.6s ease-out, top 0.6s ease-out'
        }}
      >
      </div>

      {/* Event Overlay Flash */}
      {overlayMsg && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-40 animate-fade-in pointer-events-none">
          <span className="text-5xl md:text-7xl font-black text-[#c6ff00] italic drop-shadow-[0_0_20px_rgba(198,255,0,0.8)] scale-110">
            {overlayMsg}
          </span>
        </div>
      )}
    </div>
  );
}
