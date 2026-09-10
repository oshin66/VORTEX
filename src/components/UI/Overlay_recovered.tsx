import { useEffect, useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { ViewMode } from '../../store/useSimulationStore';
import { Play, Pause, RotateCcw, Sun, Moon, Radio, Globe, MapPin } from 'lucide-react';
import { VortexText } from './VortexLogo';

const MODES: { id: ViewMode; label: string; Icon: React.FC<{ size: number }> }[] = [
  { id: 'day',   label: 'DAY',   Icon: Sun   },
  { id: 'night', label: 'NIGHT', Icon: Moon  },
  { id: 'live',  label: 'LIVE',  Icon: Radio },
];

export function Overlay() {
  const { isPaused, togglePause, resetTime, viewMode, setViewMode, isExploring, toggleExplore, isAnimating, showLabels, toggleLabels } = useSimulationStore();
  const [timeString, setTimeString] = useState('');
  const [isOceanOpen, setIsOceanOpen] = useState(false);

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

  // Keyboard shortcuts: ESC exits explore mode, P toggles geographic pins
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useSimulationStore.getState().isExploring) {
        toggleExplore();
      } else if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) {
        toggleLabels();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleExplore, toggleLabels]);

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
        {/* Controls row: pins toggle + explore button + mode toggle pill side by side */}
        <div className="flex items-center gap-2">
          {/* Continents & Oceans Pins toggle */}
          <button
            id="pins-btn"
            onClick={toggleLabels}
            title={showLabels ? 'Hide Continents & Oceans (P)' : 'Show Continents & Oceans (P)'}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono tracking-widest border transition-all duration-300 cursor-pointer',
              showLabels
                ? 'bg-amber-500/80 border-amber-400/50 text-white shadow-lg shadow-amber-500/25'
                : 'bg-black/40 backdrop-blur-md border-white/10 text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10',
            ].join(' ')}
          >
            <MapPin size={11} className={showLabels ? 'animate-bounce' : ''} />
            {showLabels ? 'PINS' : 'PINS'}
          </button>

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
        <div className="relative">
          {/* Drop-up Menu */}
          {isOceanOpen && (
            <div className="absolute bottom-full right-0 mb-2 py-2 bg-black/60 backdrop-blur-md border border-blue-500/30 rounded-xl flex flex-col min-w-[160px] overflow-hidden shadow-lg shadow-blue-500/20 transform origin-bottom animate-in fade-in slide-in-from-bottom-2 duration-200">
              {['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Southern Ocean', 'Arctic Ocean'].map(ocean => (
                <button
                  key={ocean}
                  className="px-4 py-2 text-xs font-mono text-left text-white/70 hover:text-white hover:bg-blue-500/20 transition-colors"
                  onClick={() => setIsOceanOpen(false)}
                >
                  {ocean}
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setIsOceanOpen(!isOceanOpen)}
            className={`flex items-center gap-2 px-4 h-10 rounded-full border transition-all duration-300 font-mono tracking-widest text-xs ${
              isOceanOpen 
                ? 'bg-blue-500/80 border-blue-400/50 text-white shadow-lg shadow-blue-500/30' 
                : 'border-white/10 bg-black/40 backdrop-blur-md text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10'
            }`}
            title="Oceans Menu"
          >
            OCEAN
          </button>
        </div>

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
