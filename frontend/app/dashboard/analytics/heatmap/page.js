"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const ZONE_DATA = [
  // [x%, y%, intensity, label]
  [12, 50, 0.3, "GK Box"],
  [25, 20, 0.5, "LB Zone"],
  [25, 50, 0.6, "CB Zone"],
  [25, 80, 0.5, "RB Zone"],
  [40, 25, 0.7, "LM Zone"],
  [40, 50, 0.8, "CM Zone"],
  [40, 75, 0.7, "RM Zone"],
  [55, 30, 0.6, "LAM Zone"],
  [55, 50, 0.9, "CAM Zone"],
  [55, 70, 0.6, "RAM Zone"],
  [70, 25, 0.8, "LW Zone"],
  [70, 50, 0.95, "ST Zone"],
  [70, 75, 0.8, "RW Zone"],
  [85, 40, 1.0, "Penalty Box L"],
  [85, 60, 1.0, "Penalty Box R"],
  [92, 50, 0.7, "6-Yard Box"],
];

const EVENT_TYPES = [
  { id: "goals", label: "⚽ Goals", color: "#00ff87" },
  { id: "shots", label: "🎯 Shots", color: "#3b82f6" },
  { id: "fouls", label: "🦵 Fouls", color: "#ef4444" },
  { id: "passes", label: "🔄 Key Passes", color: "#f59e0b" },
];

export default function HeatmapPage() {
  const canvasRef = useRef(null);
  const [activeEvent, setActiveEvent] = useState("goals");
  const [hoveredZone, setHoveredZone] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw pitch
    ctx.fillStyle = "#1a3d1a";
    ctx.fillRect(0, 0, width, height);

    // Field lines
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    // Center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 20);
    ctx.lineTo(width / 2, height - 20);
    ctx.stroke();
    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();
    // Penalty boxes
    ctx.strokeRect(20, height / 2 - 80, 80, 160);
    ctx.strokeRect(width - 100, height / 2 - 80, 80, 160);

    // Draw heat zones
    const eventColor = EVENT_TYPES.find(e => e.id === activeEvent)?.color || "#00ff87";

    ZONE_DATA.forEach(([xPct, yPct, baseIntensity, label]) => {
      const x = (xPct / 100) * width;
      const y = (yPct / 100) * height;

      // Vary intensity based on event type
      let intensity = baseIntensity;
      if (activeEvent === "goals") intensity = baseIntensity * (xPct > 60 ? 1.2 : 0.3);
      if (activeEvent === "fouls") intensity = baseIntensity * (xPct > 30 && xPct < 70 ? 1.1 : 0.5);
      if (activeEvent === "passes") intensity = baseIntensity * (xPct > 20 && xPct < 80 ? 1.0 : 0.4);
      if (activeEvent === "shots") intensity = baseIntensity * (xPct > 50 ? 1.3 : 0.2);

      intensity = Math.min(intensity, 1.0);

      const radius = 30 + intensity * 25;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `${eventColor}${Math.round(intensity * 180).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${eventColor}00`);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

  }, [activeEvent]);

  const handleCanvasHover = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let closest = null;
    let minDist = Infinity;
    ZONE_DATA.forEach(([zx, zy, _, label]) => {
      const dist = Math.sqrt((x - zx) ** 2 + (y - zy) ** 2);
      if (dist < 10 && dist < minDist) {
        minDist = dist;
        closest = label;
      }
    });
    setHoveredZone(closest);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pt-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-1">
            🔥 Pitch Heat Map
          </h1>
          <p className="text-[var(--text-secondary)]">Visualize event density across the pitch.</p>
        </div>
        <Link href="/dashboard/analytics" className="btn-secondary px-4 py-2 text-sm">← Back</Link>
      </div>

      {/* Event Type Selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {EVENT_TYPES.map(evt => (
          <button
            key={evt.id}
            onClick={() => setActiveEvent(evt.id)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
              activeEvent === evt.id
                ? "text-black"
                : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
            }`}
            style={activeEvent === evt.id ? { backgroundColor: evt.color } : {}}
          >
            {evt.label}
          </button>
        ))}
      </div>

      {/* Heat Map Canvas */}
      <div className="glass-card p-4 relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full rounded-xl cursor-crosshair"
          onMouseMove={handleCanvasHover}
          onMouseLeave={() => setHoveredZone(null)}
        />
        {hoveredZone && (
          <div className="absolute top-6 right-6 bg-black/80 px-4 py-2 rounded-lg text-sm font-bold border border-[var(--border-color)]">
            📍 {hoveredZone}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 glass-card p-4 flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full opacity-30" style={{ backgroundColor: EVENT_TYPES.find(e => e.id === activeEvent)?.color }}></div>
          <span className="text-[var(--text-secondary)]">Low Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full opacity-70" style={{ backgroundColor: EVENT_TYPES.find(e => e.id === activeEvent)?.color }}></div>
          <span className="text-[var(--text-secondary)]">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: EVENT_TYPES.find(e => e.id === activeEvent)?.color }}></div>
          <span className="text-[var(--text-secondary)]">High Activity</span>
        </div>
      </div>
    </div>
  );
}
