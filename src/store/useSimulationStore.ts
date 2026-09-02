import { create } from 'zustand'

export type ViewMode = 'day' | 'night' | 'live';

interface SimulationState {
  isPaused: boolean;
  timeMultiplier: number;
  simulationTime: number; // UNIX timestamp in milliseconds
  viewMode: ViewMode;
  isExploring: boolean;
  togglePause: () => void;
  setSpeed: (multiplier: number) => void;
  updateTime: (deltaTime: number) => void;
  resetTime: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleExplore: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  isPaused: false,
  timeMultiplier: 1, // 1x = real time
  simulationTime: Date.now(),
  viewMode: 'day', // default to day
  isExploring: false,
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setSpeed: (multiplier) => set({ timeMultiplier: multiplier }),
  updateTime: (deltaTime) => set((state) => ({
    simulationTime: state.isPaused ? state.simulationTime : state.simulationTime + deltaTime * state.timeMultiplier
  })),
  resetTime: () => set({ simulationTime: Date.now() }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleExplore: () => set((state) => ({ isExploring: !state.isExploring })),
}))
