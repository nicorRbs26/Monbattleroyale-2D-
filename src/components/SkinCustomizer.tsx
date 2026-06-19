import React from 'react';
import { Character } from '../types';
import { isHatLocked, isPatternLocked } from '../progression';

interface SkinCustomizerProps {
  skinColor: string;
  setSkinColor: (color: string) => void;
  hatStyle: Character['hatStyle'];
  setHatStyle: (hat: Character['hatStyle']) => void;
  patternStyle: Character['patternStyle'];
  setPatternStyle: (pat: Character['patternStyle']) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  onConfirm: () => void;
  playerLevel?: number;
}

const COLORS = [
  { value: '#ef4444', name: 'Rouge Enragé' },
  { value: '#3b82f6', name: 'Bleu Royal' },
  { value: '#10b981', name: 'Vert Toxique' },
  { value: '#f59e0b', name: 'Jaune Aura' },
  { value: '#a855f7', name: 'Violet Néon' },
  { value: '#ec4899', name: 'Rose Bonbon' },
  { value: '#1e293b', name: 'Slate Tactique' },
  { value: '#06b6d4', name: 'Cyan Cyber' },
];

const HATS: { value: Character['hatStyle']; name: string; emoji: string }[] = [
  { value: 'none', name: 'Sans Couvre-chef', emoji: '🧑‍🦲' },
  { value: 'cap', name: 'Casquette Pro-Gamer', emoji: '🧢' },
  { value: 'crown', name: 'Couronne Royale', emoji: '👑' },
  { value: 'helmet', name: 'Casque de Combat', emoji: '🪖' },
  { value: 'headphones', name: 'Casque Audio RGB', emoji: '🎧' },
  { value: 'bandana', name: 'Bandana Rebelle', emoji: '🧣' },
  { value: 'ninja', name: 'Bandeau de Ninja', emoji: '🥷' },
  { value: 'wizard', name: 'Chapeau de Sorcier', emoji: '🧙' },
];

const PATTERNS: { value: Character['patternStyle']; name: string; desc: string }[] = [
  { value: 'plain', name: 'Uni', desc: 'Une couleur pure, discrète' },
  { value: 'stripes', name: 'Zébré', desc: 'Lignes de combat élégantes' },
  { value: 'dots', name: 'Pois Tactiques', desc: 'Un style vintage et droll' },
  { value: 'camo', name: 'Camouflage', desc: 'Idéal pour camper dans les buissons' },
  { value: 'lightning', name: 'Éclairs d\'Aura', desc: 'Brille par ton énergie pure' },
];

export default function SkinCustomizer({
  skinColor,
  setSkinColor,
  hatStyle,
  setHatStyle,
  patternStyle,
  setPatternStyle,
  playerName,
  setPlayerName,
  onConfirm,
  playerLevel = 1,
}: SkinCustomizerProps) {
  return (
    <div id="skin-customizer-container" className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl p-6 md:p-8 max-w-2xl w-full mx-auto shadow-2xl backdrop-blur-md">
      <h2 id="skin-customizer-title" className="text-2xl font-bold font-sans text-amber-500 mb-6 flex items-center gap-2">
        <span>🎨</span> Personnaliser son Survivant
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Colonne de Gauche : Aperçu du Skin */}
        <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 flex flex-col items-center justify-center relative min-h-[220px]">
          <div className="absolute top-3 left-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Aperçu 2D</div>
          
          {/* Rendu dynamique du skin en CSS / SVG */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Corps du joueur */}
            <div 
              className="w-24 h-24 rounded-full border-4 border-slate-950 shadow-lg flex items-center justify-center relative overflow-hidden transition-colors duration-300"
              style={{ backgroundColor: skinColor }}
            >
              {/* Rendu des motifs */}
              {patternStyle === 'stripes' && (
                <div className="absolute inset-0 flex flex-col justify-around rotate-45 scale-125 opacity-25">
                  <div className="h-2 w-full bg-black"></div>
                  <div className="h-2 w-full bg-black"></div>
                  <div className="h-2 w-full bg-black"></div>
                </div>
              )}
              {patternStyle === 'dots' && (
                <div className="absolute inset-0 grid grid-cols-3 p-2 gap-2 opacity-30">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              )}
              {patternStyle === 'camo' && (
                <div className="absolute inset-0 bg-repeat opacity-25 scale-110" style={{ backgroundImage: 'radial-gradient(circle, #052e16 25%, transparent 26%), radial-gradient(circle, #3f6212 25%, transparent 26%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 8px 8px' }}></div>
              )}
              {patternStyle === 'lightning' && (
                <div className="absolute inset-0 flex items-center justify-center font-bold text-yellow-300 select-none scale-150 opacity-40 animate-pulse">
                  ⚡
                </div>
              )}

              {/* Mains de combat en vue de dessus */}
              <div className="absolute -right-1 bottom-4 w-6 h-6 rounded-full border-2 border-slate-950 transition-colors" style={{ backgroundColor: skinColor }}></div>
              <div className="absolute -left-1 bottom-4 w-6 h-6 rounded-full border-2 border-slate-950 transition-colors" style={{ backgroundColor: skinColor }}></div>

              {/* Yeux ronds blancs avec pupilles noires orientés vers le haut (orientation tir) */}
              <div className="absolute top-6 left-5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-black -mt-1"></div>
              </div>
              <div className="absolute top-6 right-5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-black -mt-1"></div>
              </div>
            </div>

            {/* Chapeau positionné au-dessus en vue de dessus */}
            {hatStyle !== 'none' && (
              <div className="absolute top-1 z-10 text-4xl animate-bounce" style={{ animationDuration: '3s' }}>
                {HATS.find(h => h.value === hatStyle)?.emoji}
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-sm font-semibold text-slate-300 font-mono tracking-wide">{playerName || 'Anonyme'}</span>
            <p className="text-xs text-slate-500 mt-1">Équipé de : {HATS.find(h => h.value === hatStyle)?.name}</p>
          </div>
        </div>

        {/* Colonne de Droite : Contrôles de Configuration */}
        <div className="flex flex-col gap-5">
          {/* Nom du Joueur */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400 font-sans">Pseudo du Joueur</label>
            <input
              type="text"
              placeholder="Pseudo"
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.replace(/[^a-zA-Z0-9_\-\s]/g, ''))}
              className="bg-slate-950 text-slate-100 border border-slate-700 focus:border-amber-500 outline-none px-4 py-2 rounded-lg font-sans w-full transition-all text-sm font-semibold"
            />
          </div>

          {/* Sélection de Couleur */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400 font-sans">Couleur Corporelle</label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((col) => (
                <button
                  key={col.value}
                  onClick={() => setSkinColor(col.value)}
                  className={`w-full aspect-square rounded-lg border-2 relative transition-all duration-150 ${skinColor === col.value ? 'border-amber-500 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'border-slate-800 hover:border-slate-600'}`}
                  style={{ backgroundColor: col.value }}
                  title={col.name}
                >
                  {skinColor === col.value && (
                    <span className="absolute inset-0 flex items-center justify-center text-slate-950 font-bold drop-shadow text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rangée du Bas : Chapeaux et Motifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-t border-slate-800/80 pt-6">
        {/* Style de Chapeau */}
        <div>
          <label className="text-sm font-medium text-slate-400 font-sans block mb-3">Accessoire / Chapeau</label>
          <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 font-sans">
            {HATS.map((hat) => {
              const isLocked = isHatLocked(hat.value, playerLevel);
              const getLevelReq = hat.value === 'ninja' ? 4 : hat.value === 'headphones' ? 6 : hat.value === 'crown' ? 8 : 1;
              return (
                <button
                  key={hat.value}
                  disabled={isLocked}
                  onClick={() => !isLocked && setHatStyle(hat.value)}
                  className={`flex items-center justify-between gap-1 px-3 py-2 rounded-lg border text-left transition-all text-xs font-semibold cursor-pointer ${
                    isLocked
                      ? 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                      : hatStyle === hat.value
                        ? 'bg-slate-800 text-amber-400 border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                  title={isLocked ? `Bloqué ! Débloquez au Niveau ${getLevelReq}` : hat.name}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base">{hat.emoji}</span>
                    <span className="truncate">{hat.name}</span>
                  </div>
                  {isLocked && <span className="text-[10px] text-red-500 shrink-0 font-mono">🔒 Niv.{getLevelReq}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Motifs de Skin */}
        <div>
          <label className="text-sm font-medium text-slate-400 font-sans block mb-3">Motif du Corps</label>
          <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 font-sans">
            {PATTERNS.map((pat) => {
              const isLocked = isPatternLocked(pat.value, playerLevel);
              const getLevelReq = pat.value === 'camo' ? 5 : pat.value === 'lightning' ? 10 : 1;
              return (
                <button
                  key={pat.value}
                  disabled={isLocked}
                  onClick={() => !isLocked && setPatternStyle(pat.value)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isLocked
                      ? 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                      : patternStyle === pat.value
                        ? 'bg-slate-800 text-amber-400 border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                  title={isLocked ? `Bloqué ! Débloquez au Niveau ${getLevelReq}` : pat.name}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{pat.name}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{pat.desc}</span>
                  </div>
                  {isLocked && <span className="text-[10px] text-red-500 shrink-0 font-mono">🔒 Niv.{getLevelReq}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onConfirm}
          className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold px-8 py-3 rounded-xl transition-all shadow-xl font-sans tracking-wide text-sm cursor-pointer"
        >
          Confirmer et Enregistrer
        </button>
      </div>
    </div>
  );
}
