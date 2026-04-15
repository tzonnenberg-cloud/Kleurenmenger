/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  CheckCircle2, 
  Lightbulb, 
  Trophy, 
  Timer, 
  Target, 
  HelpCircle,
  ArrowRight,
  Medal,
  Leaf
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { rybToRgb, rgbToHex, calculateAccuracy } from './lib/colorUtils';

type RYB = [number, number, number];

interface Score {
  accuracy: number;
  speed: number;
  hints: number;
}

export default function App() {
  const [targetRYB, setTargetRYB] = useState<RYB>([0, 0, 0]);
  const [currentRYB, setCurrentRYB] = useState<RYB>([128, 128, 128]);
  const [startTime, setStartTime] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [gameState, setGameState] = useState<'playing' | 'result' | 'medal'>('playing');
  const [lastScore, setLastScore] = useState<Score | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);

  // Generate a random color that isn't too dark or too light
  const generateRandomColor = useCallback(() => {
    const r = Math.floor(Math.random() * 200) + 25;
    const y = Math.floor(Math.random() * 200) + 25;
    const b = Math.floor(Math.random() * 200) + 25;
    return [r, y, b] as RYB;
  }, []);

  const startNewRound = useCallback(() => {
    setTargetRYB(generateRandomColor());
    setCurrentRYB([128, 128, 128]);
    setStartTime(Date.now());
    setHintsUsed(0);
    setGameState('playing');
    setLastScore(null);
    setHintText(null);
  }, [generateRandomColor]);

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const handleCheck = () => {
    const accuracy = calculateAccuracy(currentRYB, targetRYB);
    const endTime = Date.now();
    const speedSeconds = Math.floor((endTime - startTime) / 1000);
    
    const score: Score = {
      accuracy,
      speed: speedSeconds,
      hints: hintsUsed
    };

    setLastScore(score);
    setGameState('result');

    if (accuracy >= 90) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak === 3) {
        setGameState('medal');
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2E5A27', '#D4A373', '#8BB350']
        });
      }
    } else {
      setStreak(0);
    }
  };

  const handleHint = () => {
    setHintsUsed(h => h + 1);
    
    const diffs = [
      { name: 'Rood', diff: targetRYB[0] - currentRYB[0] },
      { name: 'Geel', diff: targetRYB[1] - currentRYB[1] },
      { name: 'Blauw', diff: targetRYB[2] - currentRYB[2] }
    ];

    // Find the biggest difference
    const biggest = diffs.reduce((prev, curr) => 
      Math.abs(curr.diff) > Math.abs(prev.diff) ? curr : prev
    );

    if (Math.abs(biggest.diff) < 15) {
      setHintText("Je bent er bijna! Maak hele kleine aanpassingen.");
    } else if (biggest.diff > 0) {
      setHintText(`Voeg meer ${biggest.name} toe.`);
    } else {
      setHintText(`Gebruik minder ${biggest.name}.`);
    }

    // Clear hint after 3 seconds
    setTimeout(() => setHintText(null), 3000);
  };

  const targetRGB = rybToRgb(targetRYB[0], targetRYB[1], targetRYB[2]);
  const currentRGB = rybToRgb(currentRYB[0], currentRYB[1], currentRYB[2]);

  return (
    <div className="min-h-screen flex flex-col p-8 max-w-[1024px] mx-auto gap-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-zone-green-dark rounded-xl flex items-center justify-center text-white font-bold text-2xl">
            Z
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-zone-green-dark tracking-tight leading-none">KleurLab</h1>
            <p className="text-sm font-semibold text-zone-green-light uppercase tracking-wide mt-1">Green Design | Zone.college</p>
          </div>
        </div>
        <div className="bg-zone-green-light text-white px-3 py-1 rounded-full text-xs font-bold">
          RONDE {streak + 1} / 3
        </div>
      </header>

      {/* Main Game Area - Bento Grid */}
      <main className="grid grid-cols-1 md:grid-cols-[1fr_1fr_300px] grid-rows-[240px_1fr] gap-5 flex-1">
        
        {/* Target Color Card */}
        <div className="bento-card">
          <div className="card-label">DE DOELKLEUR</div>
          <div 
            className="flex-1 rounded-2xl w-full flex items-end p-4 transition-colors duration-500 shadow-inner"
            style={{ backgroundColor: rgbToHex(targetRGB[0], targetRGB[1], targetRGB[2]) }}
          >
            <span className="bg-white/90 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
              Doelkleur
            </span>
          </div>
        </div>

        {/* User Mix Card */}
        <div className="bento-card">
          <div className="card-label">JOUW MENGSEL</div>
          <div 
            className="flex-1 rounded-2xl w-full flex items-end p-4 transition-colors duration-500 shadow-inner"
            style={{ backgroundColor: rgbToHex(currentRGB[0], currentRGB[1], currentRGB[2]) }}
          >
            <span className="bg-white/90 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
              Huidige Mix
            </span>
          </div>
        </div>

        {/* Scoreboard Card - Spans 2 rows */}
        <div className="bento-card md:row-span-2">
          <div className="card-label">PRESTATIES</div>
          
          <div className="space-y-0">
            <ScoreItem label="Nauwkeurigheid" value={lastScore ? `${lastScore.accuracy}%` : '--'} />
            <ScoreItem label="Snelheid" value={lastScore ? `${lastScore.speed}s` : '--'} />
            <ScoreItem label="Hints Gebruikt" value={hintsUsed.toString()} />
          </div>

          <div className="my-6">
            <div className="card-label">HINT</div>
            <div className="bg-[#F1F4F0] p-4 rounded-xl text-sm leading-relaxed border-l-4 border-zone-accent min-h-[80px] flex items-center italic text-slate-600">
              {hintText || "Gebruik de hint-knop voor een tip richting de goede kleur."}
            </div>
          </div>

          <div className="card-label">MEDAILLE VOORTGANG</div>
          <div className="flex gap-2.5 justify-center mt-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-300 border-2 ${
                  streak >= i 
                    ? 'border-zone-accent bg-[#FFF8F0] shadow-sm' 
                    : 'border-dashed border-[#DDE3DB] text-slate-300'
                }`}
              >
                {streak >= i ? '🌿' : '?'}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-auto pt-8">
            <button
              onClick={handleHint}
              disabled={gameState !== 'playing'}
              className="flex-1 py-4 rounded-xl bg-zone-accent text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider"
            >
              TIP
            </button>
            <button
              onClick={handleCheck}
              disabled={gameState !== 'playing'}
              className="flex-[2] py-4 rounded-xl bg-zone-green-dark text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-zone-green-dark/20"
            >
              CONTROLEER
            </button>
          </div>
        </div>

        {/* Sliders Card - Spans 2 columns */}
        <div className="bento-card md:col-span-2">
          <div className="card-label">MENGPANEEL (RYB MODEL)</div>
          <div className="flex flex-col justify-center gap-5 flex-1">
            <ColorSlider 
              label="Rood" 
              value={currentRYB[0]} 
              onChange={(v) => setCurrentRYB([v, currentRYB[1], currentRYB[2]])}
              thumbColor="bg-red-custom"
              disabled={gameState !== 'playing'}
            />
            <ColorSlider 
              label="Blauw" 
              value={currentRYB[2]} 
              onChange={(v) => setCurrentRYB([currentRYB[0], currentRYB[1], v])}
              thumbColor="bg-blue-custom"
              disabled={gameState !== 'playing'}
            />
            <ColorSlider 
              label="Geel" 
              value={currentRYB[1]} 
              onChange={(v) => setCurrentRYB([currentRYB[0], v, currentRYB[2]])}
              thumbColor="bg-yellow-custom"
              disabled={gameState !== 'playing'}
            />
          </div>
        </div>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {gameState === 'result' && lastScore && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl text-center space-y-8 border border-zone-green-dark/10"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-zone-green-dark">
                  {lastScore.accuracy >= 90 ? 'Geweldig!' : 'Nog even oefenen'}
                </h2>
                <p className="text-slate-500">
                  {lastScore.accuracy >= 90 
                    ? 'Je hebt de kleur bijna perfect gemengd.' 
                    : 'Probeer de sliders aan te passen voor een betere match.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <ResultStat label="Nauwkeurig" value={`${lastScore.accuracy}%`} />
                <ResultStat label="Tijd" value={`${lastScore.speed}s`} />
                <ResultStat label="Hints" value={lastScore.hints.toString()} />
              </div>

              <div className="pt-4">
                {lastScore.accuracy >= 90 ? (
                  <button
                    onClick={startNewRound}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-zone-green-dark text-white font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-zone-green-dark/20"
                  >
                    Volgende Ronde <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setGameState('playing')}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-slate-900/20"
                  >
                    Probeer Opnieuw
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'medal' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zone-green-dark/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center space-y-8 max-w-sm"
            >
              <div className="relative inline-block">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <Medal className="w-32 h-32 text-zone-accent mx-auto filter drop-shadow-lg" />
                </motion.div>
                <Trophy className="w-12 h-12 text-white absolute -top-2 -right-2 rotate-12" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-4xl font-bold text-white">Gefeliciteerd!</h2>
                <p className="text-white/80 text-lg">
                  Je hebt de Green Design Kleurenmedaille gewonnen!
                </p>
              </div>

              <button
                onClick={() => {
                  setStreak(0);
                  startNewRound();
                }}
                className="w-full py-4 px-8 rounded-2xl bg-white text-zone-green-dark font-bold text-xl hover:bg-slate-50 transition-all shadow-xl"
              >
                Speel Opnieuw
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="text-center text-slate-400 text-[11px] uppercase tracking-widest font-bold pb-4">
        &copy; 2026 Zone.college | KleurLab Green Design
      </footer>
    </div>
  );
}

function ColorSlider({ label, value, onChange, thumbColor, disabled }: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
  thumbColor: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr_40px] items-center gap-4">
      <label className="text-sm font-semibold text-text-main">{label}</label>
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-0 bg-[#E0E7DE] rounded-full h-2 my-auto" />
        <input
          type="range"
          min="0"
          max="255"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className={`relative z-10 w-full h-2 bg-transparent appearance-none cursor-pointer disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm ${thumbColor.replace('bg-', '[&::-webkit-slider-thumb]:bg-')}`}
        />
      </div>
      <span className="text-sm font-bold text-zone-green-dark text-right">{value}</span>
    </div>
  );
}

function ScoreItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 border-bottom border-[#F0F0F0] last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-bold text-zone-green-dark">{value}</span>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-zone-green-dark">{value}</p>
    </div>
  );
}
