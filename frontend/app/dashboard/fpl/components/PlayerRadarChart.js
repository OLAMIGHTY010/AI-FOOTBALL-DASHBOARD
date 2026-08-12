"use client";
import React, { useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function PlayerRadarChart({ players }) {
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  const player1 = players.find(p => p.id === parseInt(player1Id));
  const player2 = players.find(p => p.id === parseInt(player2Id));

  const chartData = useMemo(() => {
    if (!player1 && !player2) return [];

    // Normalize stats to a 0-100 scale for better radar visualization
    const maxPoints = Math.max(...players.map(p => p.expected_points || 0), 10);
    const maxCost = Math.max(...players.map(p => p.cost || p.price || 0), 15);
    const maxForm = Math.max(...players.map(p => p.form || 0), 10);

    const metrics = [
      { subject: 'Form', key: 'form', max: maxForm },
      { subject: 'Expected Pts', key: 'expected_points', max: maxPoints },
      { subject: 'Value (Pts/£)', key: 'value', customCalc: p => ((p.expected_points || 0) / (p.cost || p.price || 1)) * 10, max: 20 },
      { subject: 'Cost (£M)', key: 'cost', max: maxCost, inverse: true }, // lower cost is better, but let's just plot absolute cost
      { subject: 'Selected %', key: 'selected_by_percent', customCalc: p => parseFloat(p.selected_by_percent || 0), max: 100 }
    ];

    return metrics.map(m => {
      const dataPoint = { subject: m.subject };
      if (player1) {
        let val1 = m.customCalc ? m.customCalc(player1) : (player1[m.key] || 0);
        dataPoint.Player1 = (val1 / m.max) * 100;
        dataPoint.p1Raw = val1.toFixed(1);
      }
      if (player2) {
        let val2 = m.customCalc ? m.customCalc(player2) : (player2[m.key] || 0);
        dataPoint.Player2 = (val2 / m.max) * 100;
        dataPoint.p2Raw = val2.toFixed(1);
      }
      return dataPoint;
    });
  }, [player1, player2, players]);

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        📊 Player Comparison Radar
      </h3>
      
      <div className="flex gap-4 mb-4">
        <select 
          className="select-field flex-1 text-sm bg-[var(--bg-secondary)]" 
          value={player1Id} 
          onChange={(e) => setPlayer1Id(e.target.value)}
        >
          <option value="">Select Player 1...</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
          ))}
        </select>

        <select 
          className="select-field flex-1 text-sm bg-[var(--bg-secondary)]" 
          value={player2Id} 
          onChange={(e) => setPlayer2Id(e.target.value)}
        >
          <option value="">Select Player 2...</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-h-[300px] relative">
        {(!player1 && !player2) ? (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--text-secondary)] text-sm">
            Select players above to compare stats.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              {player1 && (
                <Radar name={player1.name} dataKey="Player1" stroke="#00d4aa" fill="#00d4aa" fillOpacity={0.3} />
              )}
              {player2 && (
                <Radar name={player2.name} dataKey="Player2" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
              )}
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                formatter={(value, name, props) => {
                  const raw = name === player1?.name ? props.payload.p1Raw : props.payload.p2Raw;
                  return [raw, name];
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
