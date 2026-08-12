"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from "recharts";

export default function StatsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fpl/bootstrap");
        const json = await res.json();
        if (json.elements) {
          // Filter players who have played at least some minutes and have some xG
          const forwardsAndMids = json.elements.filter(
            p => (p.element_type === 3 || p.element_type === 4) && parseFloat(p.expected_goals) > 1.0
          );
          
          const plotData = forwardsAndMids.map(p => ({
            id: p.id,
            name: p.web_name,
            xG: parseFloat(p.expected_goals),
            goals: p.goals_scored,
            team: p.team,
            difference: p.goals_scored - parseFloat(p.expected_goals)
          }));
          
          setData(plotData);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/90 border border-gray-700 p-3 rounded shadow-xl font-sans text-sm">
          <p className="font-bold text-[var(--accent-primary)] mb-1 text-base">{data.name}</p>
          <p className="text-white">Actual Goals: <span className="font-bold">{data.goals}</span></p>
          <p className="text-white">Expected Goals (xG): <span className="font-bold">{data.xG.toFixed(2)}</span></p>
          <p className={`font-bold mt-2 pt-2 border-t border-gray-700 ${data.difference > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.difference > 0 ? '🔥 Over-performing' : '❄️ Under-performing'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-sans animate-fade-in pt-10">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
            📊 xG vs Actual Goals
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Identify which players are clinical finishers and who is due a goal.
          </p>
        </div>
        <Link href="/dashboard/fpl" className="btn-secondary px-6">Back to FPL Hub</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-4 border-l-4 border-green-500">
          <h3 className="font-bold text-green-400">Above the Line</h3>
          <p className="text-sm text-[var(--text-secondary)]">Players who score more goals than expected based on the quality of chances they get. Clinical finishers.</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-red-500">
          <h3 className="font-bold text-red-400">Below the Line</h3>
          <p className="text-sm text-[var(--text-secondary)]">Players who get good chances but fail to convert. They are "due a goal" but might just be poor finishers.</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-white">
          <h3 className="font-bold text-white">On the Line</h3>
          <p className="text-sm text-[var(--text-secondary)]">Players scoring exactly as many goals as expected. Sustainable returns.</p>
        </div>
      </div>

      <div className="glass-card p-6 h-[600px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 animate-pulse">Loading xG data...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                type="number" 
                dataKey="xG" 
                name="Expected Goals" 
                stroke="#888" 
                label={{ value: 'Expected Goals (xG)', position: 'insideBottom', offset: -10, fill: '#888' }} 
              />
              <YAxis 
                type="number" 
                dataKey="goals" 
                name="Actual Goals" 
                stroke="#888" 
                label={{ value: 'Actual Goals', angle: -90, position: 'insideLeft', fill: '#888' }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 25, y: 25 }]} stroke="white" strokeDasharray="3 3" opacity={0.5} />
              
              <Scatter name="Players" data={data} fill="#8884d8">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.difference > 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
