"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Activity, Sparkles, ChevronRight } from "lucide-react";

export default function IntroSequence({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Sequence timing
    const timers = [
      setTimeout(() => setStage(1), 1500), // Stadium lights -> Pitch
      setTimeout(() => setStage(2), 4500), // Pitch -> Pack Drop
      setTimeout(() => setStage(3), 7500), // Pack Drop -> Wager/Coins
      setTimeout(() => setStage(4), 10500), // Fade to Enter
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden z-50">
      {/* Stadium Lights Effect */}
      <div className="absolute top-0 w-full flex justify-between px-10 pt-4 pointer-events-none opacity-40">
         <div className="w-32 h-32 bg-green-500 rounded-full blur-[80px]" />
         <div className="w-32 h-32 bg-green-500 rounded-full blur-[80px]" />
      </div>
      
      <AnimatePresence mode="wait">
        
        {/* Stage 0: Initial Black/Lights */}
        {stage === 0 && (
          <motion.div 
            key="stage0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-green-400"
          >
            <Sparkles size={48} className="animate-pulse mb-4" />
          </motion.div>
        )}

        {/* Stage 1: Tactical Pitch */}
        {stage === 1 && (
          <motion.div
            key="stage1"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="relative w-80 h-[400px] border-2 border-green-500/30 rounded-xl bg-zinc-900/50 shadow-[0_0_50px_rgba(34,197,94,0.1)] flex flex-col items-center py-8"
            style={{
                backgroundImage: 'linear-gradient(rgba(34,197,94,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}
          >
            <div className="absolute top-0 w-full h-1/2 border-b-2 border-green-500/30"></div>
            <div className="absolute top-0 w-32 h-16 border-2 border-t-0 border-green-500/30 left-1/2 -translate-x-1/2"></div>
            <div className="absolute bottom-0 w-32 h-16 border-2 border-b-0 border-green-500/30 left-1/2 -translate-x-1/2"></div>
            
            {/* 4-3-3 Formation Dots */}
            <FormationDot delay={0} x={0} y={150} /> {/* GK */}
            <FormationDot delay={0.2} x={-100} y={100} /> {/* LB */}
            <FormationDot delay={0.3} x={-40} y={110} /> {/* CB */}
            <FormationDot delay={0.4} x={40} y={110} /> {/* CB */}
            <FormationDot delay={0.5} x={100} y={100} /> {/* RB */}
            
            <FormationDot delay={0.6} x={-60} y={30} /> {/* CM */}
            <FormationDot delay={0.7} x={0} y={50} /> {/* CDM */}
            <FormationDot delay={0.8} x={60} y={30} /> {/* CM */}
            
            <FormationDot delay={0.9} x={-80} y={-50} /> {/* LW */}
            <FormationDot delay={1.0} x={0} y={-70} /> {/* ST */}
            <FormationDot delay={1.1} x={80} y={-50} /> {/* RW */}
          </motion.div>
        )}

        {/* Stage 2: Pack Drop */}
        {stage === 2 && (
          <motion.div
            key="stage2"
            initial={{ y: -500, rotate: -20, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.6, duration: 1 }}
            className="relative"
          >
            <div className="w-64 h-96 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 rounded-xl shadow-[0_0_100px_rgba(234,179,8,0.5)] border-4 border-yellow-200 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    className="absolute w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.8)_360deg)]" 
                />
                <Trophy size={80} className="text-yellow-100 drop-shadow-2xl z-10" />
            </div>
          </motion.div>
        )}

        {/* Stage 3: Card Reveal & Wager */}
        {stage === 3 && (
          <motion.div
            key="stage3"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="flex flex-row items-center gap-12"
          >
            {/* The Revealed Card */}
            <motion.div
              initial={{ x: 100, rotateY: 90 }}
              animate={{ x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="w-56 h-80 bg-zinc-800 rounded-xl border border-yellow-500/50 p-4 shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col"
            >
                <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold text-yellow-500">91</span>
                        <span className="text-sm font-semibold text-zinc-400">ST</span>
                    </div>
                    <Star className="text-yellow-500 fill-yellow-500" size={20} />
                </div>
                <div className="flex-1 mt-4 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700/50 flex flex-col justify-end">
                    <div className="h-32 bg-zinc-800/50 mx-4 mt-auto rounded-t-full border border-zinc-700 border-b-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-zinc-700 rounded-full" />
                    </div>
                </div>
                <div className="mt-3 text-center text-zinc-100 font-bold uppercase tracking-wider">
                    Legends
                </div>
            </motion.div>

            {/* Betting / Coins */}
            <div className="flex flex-col items-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] mb-8"
                >
                    x2.5
                </motion.div>
                <div className="relative w-32 h-32">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: -i * 12, opacity: 1 }}
                            transition={{ delay: 0.8 + (i * 0.1), type: "spring" }}
                            className="absolute bottom-0 w-16 h-16 bg-yellow-400 rounded-full border-4 border-yellow-600 flex items-center justify-center shadow-lg left-8"
                        >
                            <span className="text-yellow-700 font-bold">$</span>
                        </motion.div>
                    ))}
                </div>
            </div>
          </motion.div>
        )}

        {/* Stage 4: Enter */}
        {stage === 4 && (
          <motion.div
            key="stage4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.4)]">
                <Activity size={48} className="text-green-400" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">SIMSCOUTBET</h1>
            <p className="text-zinc-400 mb-12 max-w-sm text-center">
                Build your ultimate squad, master tactics, and wager on live simulations.
            </p>
            <button 
                onClick={onComplete}
                className="group relative px-8 py-4 bg-green-500 text-black font-bold rounded-full overflow-hidden hover:scale-105 transition-transform flex items-center gap-2"
            >
                <span className="relative z-10">Sign In to Dashboard</span>
                <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-green-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function FormationDot({ delay, x, y }) {
    return (
        <motion.div
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x, y, opacity: 1 }}
            transition={{ delay, type: "spring", stiffness: 100, damping: 15 }}
            className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] border-2 border-zinc-900"
            style={{ left: "50%", top: "50%", marginLeft: "-8px", marginTop: "-8px" }}
        />
    )
}
