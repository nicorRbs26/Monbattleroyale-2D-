import React from 'react';
import { Character } from '../types';

interface SpectatorControlsProps {
  livingBotsList: Character[];
  currentSpectateIdx: number;
  onNextSpectate: () => void;
  onPrevSpectate: () => void;
  onViewReport: () => void;
}

export default function SpectatorControls({
  livingBotsList,
  currentSpectateIdx,
  onNextSpectate,
  onPrevSpectate,
  onViewReport,
}: SpectatorControlsProps) {
  const currentTarget = livingBotsList[currentSpectateIdx];

  return (
    <div id="spectator-controls-overlay" className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-950/90 border-2 border-purple-500/80 px-6 py-4 rounded-2xl flex flex-col items-center gap-3 shadow-2xl backdrop-blur-md pointer-events-auto z-30 font-mono text-purple-300">
      <div className="flex items-center gap-2">
        <span className="animate-pulse text-base">👁️</span>
        <span className="text-sm font-black tracking-widest uppercase">MODE SPECTATEUR</span>
      </div>

      {currentTarget ? (
        <span className="text-xs bg-purple-950/60 px-3 py-1 rounded-full border border-purple-900 font-bold">
          Cible : <span className="text-white">{currentTarget.name}</span> ({currentTarget.health} HP)
        </span>
      ) : (
        <span className="text-xs italic text-slate-500">Aucune cible à spectater...</span>
      )}

      <div className="flex gap-2 w-full mt-1 justify-center">
        <button
          onClick={onPrevSpectate}
          className="bg-purple-950 border border-purple-800 hover:bg-purple-900 active:scale-95 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          ◀ Précédente
        </button>
        <button
          onClick={onNextSpectate}
          className="bg-purple-950 border border-purple-800 hover:bg-purple-900 active:scale-95 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          Suivante ▶
        </button>
      </div>

      <button
        onClick={onViewReport}
        className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-sans font-black text-xs py-2 rounded-xl transition-all shadow mt-2 uppercase tracking-wide cursor-pointer"
      >
        Quitter & Voir Stats de Partie 📊
      </button>
    </div>
  );
}
