import { useEffect, useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { ViewMode } from '../../store/useSimulationStore';
import { Play, Pause, RotateCcw, Sun, Moon, Radio, Globe } from 'lucide-react';
import { VortexText } from './VortexLogo';

const MODES: { id: ViewMode; label: string; Icon: React.FC<{ size: number }> }[] = [
  { id: 'day',   label: 'DAY',   Icon: Sun   },
  { id: 'night', label: 'NIGHT', Icon: Moon  },
  { id: 'live',  label: 'LIVE',  Icon: Radio },
];

export function Overlay() {
  const { isPaused, togglePause, resetTime, viewMode, setViewMode, isExploring, toggleExplore, isAnimating } = useSimulationStore();
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const time = useSimulationStore.getState().simulationTime;
      const date = new Date(time);
      const h = date.getUTCHours().toString().padStart(2, '0');
      const m = date.getUTCMinutes().toString().padStart(2, '0');
      const s = date.getUTCSeconds().toString().padStart(2, '0');
      setTimeString(`UTC ${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ESC exits explore mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useSimulationStore.getState().isExploring) {
        toggleExplore();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleExplore]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">

      {/* Top Left: Logo */}
      <div
        style={{ position: 'absolute', top: 32, left: 32 }}
        className="pointer-events-auto"
      >
        <VortexText />
      </div>

      {/* ─── TOP RIGHT: Day / Night / Live toggle + Explore ─── */}
      <div
        style={{ position: 'absolute', top: 32, right: 32 }}
        className="pointer-events-auto flex flex-col gap-1 items-end"
      >
        {/* Controls row: toggle pill + explore button side by side */}
        <div className="flex items-center gap-2">
          {/* Explore button */}
          <button
            id="explore-btn"
            onClick={toggleExplore}
            disabled={isAnimating}
            title={isExploring ? 'Exit Explore (Esc)' : 'Explore Earth'}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono tracking-widest border transition-all duration-300',
              isExploring
                ? 'bg-emerald-500/80 border-emerald-400/50 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-black/40 backdrop-blur-md border-white/10 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10',
              isAnimating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            <Globe size={11} className={isAnimating ? 'animate-spin' : ''} />
            {isExploring ? 'EXIT' : 'EXPLORE'}
          </button>

          {/* Toggle pill */}
          <div
            className="flex items-center gap-px bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1"
          >
          {MODES.map(({ id, label, Icon }) => {
            const active = viewMode === id;
            return (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                title={label}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono tracking-widest transition-all duration-300',
                  active
                    ? id === 'day'
                      ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                      : id === 'night'
                      ? 'bg-indigo-600/80 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-blue-600/80 text-white shadow-lg shadow-blue-500/20'
                    : 'text-white/40 hover:text-white/70',
                ].join(' ')}
              >
                <Icon size={11} />
                {label}
              </button>
            );
          })}
          </div>
        </div>
        
        {/* Status and Time */}
        <div className="flex flex-col items-end gap-1 mt-2">
          <div className="flex items-center gap-2 text-white/80 text-xs font-mono tracking-widest uppercase">
            <span className="relative flex h-2 w-2">
              {!isPaused && viewMode === 'live' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  viewMode === 'live' && !isPaused ? 'bg-blue-500' :
                  viewMode === 'day'  ? 'bg-amber-400' :
                  viewMode === 'night'? 'bg-indigo-400' :
                  'bg-white/40'
                }`}
              />
            </span>
            {viewMode === 'day'   && 'DAY VIEW'}
            {viewMode === 'night' && 'NIGHT VIEW'}
            {viewMode === 'live'  && (isPaused ? 'SIMULATION PAUSED' : 'LIVE EARTH')}
          </div>
          <div className="text-white/50 text-xs font-mono tracking-widest">
            {timeString}
          </div>
        </div>
      </div>

      {/* Bottom Right: Playback Controls */}
      <div
        style={{ position: 'absolute', bottom: 32, right: 32 }}
        className="flex gap-3 pointer-events-auto"
      >
        <button
          onClick={togglePause}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-black/20 backdrop-blur-md text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-300"
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
        </button>

        <button
          onClick={() => {
            resetTime();
            window.dispatchEvent(new Event('reset-camera'));
          }}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-black/20 backdrop-blur-md text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-300"
          title="Reset View & Time"
        >
          <RotateCcw size={16} />
        </button>
      </div>

    </div>
  );
}
