import React from 'react';
import { Character, Weapon, PlayMode } from '../types';
import { TouchHUDLayout } from './TouchHUDCustomizer';

interface GameHUDProps {
  player: Character;
  mate?: Character; // en duo / squad
  survivorCount: number;
  kills: number;
  stormPhase: number;
  stormTimer: number;
  stormIsShrinking: boolean;
  killFeed: { id: string; text: string }[];
  onConsumeItem: (type: 'medkit' | 'shield') => void;
  onSelectWeapon: (idx: number) => void;
  playMode: PlayMode;
  onDash: () => void;
  spectatorMode: boolean;
  spectatingName?: string;
  equippedEmote?: string;
  onTriggerEmote?: () => void;
  touchLayout?: TouchHUDLayout;
  onReload?: () => void;
}

const RARITY_COLORS = {
  common: 'border-slate-600 bg-slate-900/80 text-slate-300',
  rare: 'border-blue-500 bg-blue-950/40 text-blue-300',
  epic: 'border-purple-500 bg-purple-950/40 text-purple-300',
  legendary: 'border-amber-500 bg-amber-950/40 text-amber-300',
};

/**
 * GameHUD component responsible for displaying the head-up display during gameplay.
 * Shows player stats, inventory, kill feed, and map elements.
 */
export default function GameHUD({
  player,
  mate,
  survivorCount,
  kills,
  stormPhase,
  stormTimer,
  stormIsShrinking,
  killFeed,
  onConsumeItem,
  onSelectWeapon,
  playMode,
  onDash,
  spectatorMode,
  spectatingName,
  equippedEmote,
  onTriggerEmote,
  touchLayout,
  onReload,
}: GameHUDProps) {

  // Assistant local emote helper
  const getEmoteEmojiLocal = (emoteId: string | undefined): string => {
    if (emoteId === 'thumbs_up') return '👍';
    if (emoteId === 'laugh') return '😂';
    if (emoteId === 'flag_white') return '🏳️';
    if (emoteId === 'victory') return '🔥';
    return '';
  };
  
  // Raccourci de formatage mn:ss
  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeWeapon: Weapon | null = player.weapons[player.activeWeaponIndex] || null;

  return (
    <div id="game-hud-root" className="absolute inset-0 pointer-events-none select-none font-mono flex flex-col justify-between p-4 z-20">
      
      {/* SECTION SUPÉRIEURE : Stats et Tempête */}
      <div className="flex justify-between items-start w-full">
        
        {/* Info Zone et Survivants */}
        <div className="flex flex-col gap-2 pointer-events-auto bg-slate-950/80 border border-slate-800 p-3 rounded-xl backdrop-blur-sm shadow-xl text-left">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Survivants</p>
              <p className="text-xl font-bold text-amber-400">{survivorCount} <span className="text-xs text-slate-500">/ 40</span></p>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Kills</p>
              <p className="text-xl font-bold text-red-500">{kills}</p>
            </div>
            {spectatorMode && (
              <>
                <div className="w-px h-8 bg-slate-800"></div>
                <div>
                  <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Spectateur 👁️</p>
                  <p className="text-xs font-bold text-purple-300">Cible : {spectatingName}</p>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-slate-800/80 pt-2 mt-1 flex items-center gap-3">
            <span className="text-lg">🌀</span>
            <div>
              <p className="text-[10px] uppercase text-slate-400">
                {stormIsShrinking ? 'Zone en mouvement !' : `Tempête Phase ${stormPhase}`}
              </p>
              <p className={`text-sm font-bold ${stormIsShrinking ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                {stormIsShrinking ? 'RÉTRÉCISSEMENT !' : `Prochain cercle : ${formatTime(stormTimer)}`}
              </p>
            </div>
          </div>
        </div>

        {/* FEED DE KILLS (FLUX D'ÉLIMINATIONS) */}
        <div className="flex flex-col gap-1.5 max-w-[280px] w-full text-right bg-slate-950/40 p-2 rounded-lg max-h-[140px] overflow-hidden">
          {killFeed.slice(-4).map((entry) => (
            <div key={entry.id} className="text-[11px] text-slate-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-900/60 font-sans truncate shadow-md animate-fade-in-down">
              {entry.text}
            </div>
          ))}
          {killFeed.length === 0 && (
            <div className="text-[9px] text-slate-600 uppercase font-sans tracking-tight">Le match commence...</div>
          )}
        </div>
      </div>

      {/* SECTION DU MILIEU : Aide Revive / KO ou Dash alert */}
      <div className="flex flex-col items-center justify-center gap-2">
        {player.knocked && (
          <div className="bg-red-600/90 border border-red-500 text-white font-sans text-sm font-black px-6 py-3 rounded-full shadow-2xl animate-pulse text-center">
            ⚠️ TU ES K.O ! Attends qu'un allié te soigne...
          </div>
        )}
        
        {player.reviveTimer > 0 && !player.knocked && (
          <div className="flex flex-col items-center gap-1 bg-slate-950/90 border border-amber-500/80 p-3 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.35)] backdrop-blur-md animate-fade-in pointer-events-none">
            <div className="text-amber-400 font-sans text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <span className="animate-spin text-sm">➕</span> RÉANIMATION EN COURS
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-40 bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                <div 
                  className="bg-amber-500 h-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)] transition-all ease-out" 
                  style={{ width: `${Math.min(100, (player.reviveTimer / 3000) * 100)}%` }}
                ></div>
              </div>
              <span className="text-amber-300 font-mono text-sm font-extrabold min-w-[32px] text-right">
                {Math.max(0, (3000 - player.reviveTimer) / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION INFÉRIEURE : HUD principal du joueur (HP, Boucliers, Inventaire) */}
      
      {/* 1. HUD ORDINATEUR (VISIBLE SUR DESKTOP) */}
      <div className="hidden md:flex flex-row justify-between items-end w-full gap-4">
        
        {/* PV / PB et coéquipiers (si applicable) */}
        <div className="flex flex-col gap-3 w-full max-w-[320px] pointer-events-auto">
          
          {/* Équipe en Duo/Squad (Affichage du coéquipier) */}
          {playMode !== 'solo' && mate && (
            <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl shadow-lg flex gap-3 items-center">
              <div 
                className="w-7 h-7 rounded-full border-2 border-slate-950 shrink-0"
                style={{ backgroundColor: mate.skinColor }}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-slate-300 truncate">{mate.name} (Allié)</span>
                  {mate.knocked ? (
                    <span className="text-[9px] bg-red-600 text-white font-bold px-1 rounded">K.O! CPR</span>
                  ) : mate.alive ? (
                    <span className="text-[9px] text-emerald-400">En vie</span>
                  ) : (
                    <span className="text-[9px] text-slate-600">Éliminé</span>
                  )}
                </div>
                
                {mate.alive && (
                  <div className="flex flex-col gap-0.5">
                    {/* HP allié */}
                    <div className="w-full bg-slate-900 rounded h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${mate.health}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ton Statut HP et Shield */}
          <div className="bg-slate-950/95 border-2 border-slate-800 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 backdrop-blur-md">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">🎮 {player.name}</span>
              <span className="text-[10px] text-slate-500">Contrôles : ZQSD/Flèches + Clic gauche pour Tirer</span>
            </div>

            {/* Barre de Vie */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400 font-bold">❤️ POINTS DE VIE (PV)</span>
                <span className="text-emerald-300 font-bold">{player.health} / 100</span>
              </div>
              <div className="w-full bg-slate-900 border border-slate-950 rounded-lg h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-200 ${player.health < 30 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
                  style={{ width: `${player.health}%` }}
                ></div>
              </div>
            </div>

            {/* Barre de Bouclier */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-blue-400 font-bold">🛡️ BOUCLIER (PB)</span>
                <span className="text-blue-300 font-bold">{player.shield} / 100</span>
              </div>
              <div className="w-full bg-slate-900 border border-slate-950 rounded-lg h-3 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-200"
                  style={{ width: `${player.shield}%` }}
                ></div>
              </div>
            </div>

            {/* Charges et indicateur de Dash */}
            <div className="flex justify-between items-center border-t border-slate-800/80 pt-2.5">
              <div className="flex gap-1.5 items-center">
                <span className="text-[10px] text-slate-400">DASH [Espace/Shift] :</span>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-sm ${i < player.dashCharges ? 'text-amber-400 filter drop-shadow' : 'text-slate-700'}`}
                    >
                      ⚡
                    </span>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={onDash}
                disabled={player.dashCharges <= 0 || player.dashCooldown > 0}
                className={`text-[10px] border px-2 py-1 rounded font-bold transition-all uppercase ${
                  player.dashCharges > 0 && player.dashCooldown <= 0
                    ? 'border-amber-500 text-amber-400 hover:bg-amber-500/20 active:scale-95 cursor-pointer'
                    : 'border-slate-800 text-slate-600'
                }`}
              >
                {player.dashCooldown > 0 ? `${(player.dashCooldown / 1000).toFixed(1)}s` : 'Prêt'}
              </button>
            </div>
          </div>
        </div>

        {/* INVENTAIRE (Armes, Munitions, Soins) */}
        <div className="w-full max-w-[400px] bg-slate-950/95 border-2 border-slate-800 p-4 rounded-2xl shadow-2xl pointer-events-auto backdrop-blur-md flex flex-col gap-3">
          <p className="text-xs text-slate-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5 font-bold">Inventaire Tactique</p>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Slot Arme d'épaule 1 */}
            <button
              onClick={() => onSelectWeapon(0)}
              className={`border-2 rounded-xl p-3 flex flex-col justify-between h-20 text-left transition-all relative ${
                player.activeWeaponIndex === 0 ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
              } ${player.weapons[0] ? RARITY_COLORS[player.weapons[0].rarity] : 'bg-slate-950/40 border-dashed text-slate-600'}`}
            >
              <span className="text-[9px] text-slate-500 absolute top-1 left-2 font-bold uppercase tracking-widest">[Slot 1]</span>
              {player.weapons[0] ? (
                <>
                  <span className="text-xs font-bold line-clamp-1 mt-2">{player.weapons[0].name}</span>
                  <span className="text-[11px] font-mono font-bold mt-auto self-end text-slate-300">
                    {player.weapons[0].currentClip} / {player.weapons[0].clipSize} 
                    <span className="text-[9px] text-slate-500 ml-1">({player.ammo[player.weapons[0].type]})</span>
                  </span>
                </>
              ) : (
                <span className="text-xs m-auto italic">Vide</span>
              )}
            </button>

            {/* Slot Arme d'épaule 2 */}
            <button
              onClick={() => onSelectWeapon(1)}
              className={`border-2 rounded-xl p-3 flex flex-col justify-between h-20 text-left transition-all relative ${
                player.activeWeaponIndex === 1 ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
              } ${player.weapons[1] ? RARITY_COLORS[player.weapons[1].rarity] : 'bg-slate-950/40 border-dashed text-slate-600'}`}
            >
              <span className="text-[9px] text-slate-500 absolute top-1 left-2 font-bold uppercase tracking-widest">[Slot 2]</span>
              {player.weapons[1] ? (
                <>
                  <span className="text-xs font-bold line-clamp-1 mt-2">{player.weapons[1].name}</span>
                  <span className="text-[11px] font-mono font-bold mt-auto self-end text-slate-300">
                    {player.weapons[1].currentClip} / {player.weapons[1].clipSize} 
                    <span className="text-[9px] text-slate-500 ml-1">({player.ammo[player.weapons[1].type]})</span>
                  </span>
                </>
              ) : (
                <span className="text-xs m-auto italic">Vide</span>
              )}
            </button>
          </div>

          {/* Consommables (Soin et Potion) */}
          <div className="flex gap-2 justify-between border-t border-slate-800/80 pt-2.5 mt-1">
            
            {/* Bouton Kit de soin */}
            <button
              onClick={() => onConsumeItem('medkit')}
              disabled={player.medkits <= 0 || player.health >= 100}
              className={`flex-1 flex justify-between items-center px-3 py-2 border rounded-xl transition-all cursor-pointer ${
                player.medkits > 0 && player.health < 100
                  ? 'border-emerald-600/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50 active:scale-95'
                  : 'border-slate-800 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🩹</span>
                <span className="text-[10px] font-bold">KITS (PV75)</span>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold">x{player.medkits}</span>
            </button>

            {/* Bouton Potion de bouclier */}
            <button
              onClick={() => onConsumeItem('shield')}
              disabled={player.shieldPotions <= 0 || player.shield >= 100}
              className={`flex-1 flex justify-between items-center px-3 py-2 border rounded-xl transition-all cursor-pointer ${
                player.shieldPotions > 0 && player.shield < 100
                  ? 'border-blue-600/60 bg-blue-950/30 text-blue-300 hover:bg-blue-950/50 active:scale-95'
                  : 'border-slate-800 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🧪</span>
                <span className="text-[10px] font-bold">POTIONS (PB50)</span>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-blue-400 font-bold">x{player.shieldPotions}</span>
            </button>
          </div>

          {/* Bouton Émote */}
          {equippedEmote && equippedEmote !== 'none' && onTriggerEmote && (
            <button
              onClick={onTriggerEmote}
              className="w-full flex items-center justify-center gap-2 mt-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-amber-500 hover:bg-slate-950 text-amber-400 font-sans font-bold hover:text-amber-300 transition-all active:scale-95 cursor-pointer text-xs"
            >
              <span className="text-sm">💬</span> Exprimer {getEmoteEmojiLocal(equippedEmote)} <span className="text-[10px] text-slate-500 font-mono ml-1 font-normal">(T)</span>
            </button>
          )}
          
        </div>
      </div>

      {/* 2. HUD SMARTPHONE UNI-PANE SANS CONSTITUANTS GÊNANTS POUR LES JOYSTICKS */}
      <div 
        className="flex md:hidden flex-col items-center justify-center w-full max-w-[380px] mx-auto pointer-events-auto bg-slate-950/95 border-2 border-slate-800/90 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md gap-3"
        style={touchLayout ? {
          position: 'absolute',
          left: `${touchLayout.mobileHUD.x}%`,
          top: `${touchLayout.mobileHUD.y}%`,
          transform: 'translate(-50%, -50%)',
        } : undefined}
      >
        
        {/* PV & Bouclier side-by-side */}
        <div className="flex gap-2 w-full text-[11px] font-bold font-mono">
          {/* Points de vie */}
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-emerald-400 flex items-center gap-1">❤️ PV : {player.health}/100</span>
            <div className="w-full bg-slate-900 border border-slate-950 rounded h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-200 ${player.health < 30 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
                style={{ width: `${player.health}%` }}
              />
            </div>
          </div>
          {/* Bouclier */}
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-blue-400 flex items-center gap-1">🛡️ PB : {player.shield}/100</span>
            <div className="w-full bg-slate-900 border border-slate-950 rounded h-3 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-200"
                style={{ width: `${player.shield}%` }}
              />
            </div>
          </div>
        </div>

        {/* Armes en mini-slots */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {/* Slot 1 */}
          <button
            onClick={() => onSelectWeapon(0)}
            className={`border rounded-xl px-2 py-1.5 flex flex-col justify-center items-center h-16 text-center transition-all relative cursor-pointer ${
              player.activeWeaponIndex === 0 ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-800'
            } ${player.weapons[0] ? RARITY_COLORS[player.weapons[0].rarity] : 'bg-slate-950/40 border-dashed text-slate-600'}`}
          >
            <span className="text-[9px] text-slate-400 absolute top-1 left-2 font-bold uppercase tracking-wider">Slot 1</span>
            {player.weapons[0] ? (
              <div className="flex flex-col items-center mt-2.5">
                <span className="text-xs font-black truncate max-w-[130px] leading-tight text-white">{player.weapons[0].name}</span>
                <span className="text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  {player.weapons[0].currentClip}/{player.weapons[0].clipSize}
                  {player.activeWeaponIndex === 0 && player.weapons[0].currentClip < player.weapons[0].clipSize && player.ammo[player.weapons[0].type] > 0 && (
                    <span 
                      role="button"
                      onClick={(e) => { e.stopPropagation(); onReload?.(); }}
                      className="bg-slate-800 hover:bg-slate-700 p-0.5 rounded border border-slate-700 animate-pulse active:scale-90"
                    >
                      🔄
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-[10px] italic mt-2 text-slate-600">Vide</span>
            )}
          </button>

          {/* Slot 2 */}
          <button
            onClick={() => onSelectWeapon(1)}
            className={`border rounded-xl px-2 py-1.5 flex flex-col justify-center items-center h-16 text-center transition-all relative cursor-pointer ${
              player.activeWeaponIndex === 1 ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-800'
            } ${player.weapons[1] ? RARITY_COLORS[player.weapons[1].rarity] : 'bg-slate-950/40 border-dashed text-slate-600'}`}
          >
            <span className="text-[9px] text-slate-400 absolute top-1 left-2 font-bold uppercase tracking-wider">Slot 2</span>
            {player.weapons[1] ? (
              <div className="flex flex-col items-center mt-2.5">
                <span className="text-xs font-black truncate max-w-[130px] leading-tight text-white">{player.weapons[1].name}</span>
                <span className="text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  {player.weapons[1].currentClip}/{player.weapons[1].clipSize}
                  {player.activeWeaponIndex === 1 && player.weapons[1].currentClip < player.weapons[1].clipSize && player.ammo[player.weapons[1].type] > 0 && (
                    <span 
                      role="button"
                      onClick={(e) => { e.stopPropagation(); onReload?.(); }}
                      className="bg-slate-800 hover:bg-slate-700 p-0.5 rounded border border-slate-700 animate-pulse active:scale-90"
                    >
                      🔄
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-[10px] italic mt-2 text-slate-600">Vide</span>
            )}
          </button>
        </div>

        {/* Consommables (Soin et Potion) & Emote pour mobile */}
        <div className="flex gap-2 w-full justify-between items-center">
          <button
            onClick={() => onConsumeItem('medkit')}
            disabled={player.medkits <= 0 || player.health >= 100}
            className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 px-2.5 h-11 border-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              player.medkits > 0 && player.health < 100
                ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/65 active:scale-95'
                : 'border-slate-800 text-slate-600 opacity-50'
            }`}
          >
            🩹 KIT PV ({player.medkits})
          </button>

          <button
            onClick={() => onConsumeItem('shield')}
            disabled={player.shieldPotions <= 0 || player.shield >= 100}
            className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 px-2.5 h-11 border-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              player.shieldPotions > 0 && player.shield < 100
                ? 'border-blue-600/70 bg-blue-950/40 text-blue-300 hover:bg-blue-950/65 active:scale-95'
                : 'border-slate-800 text-slate-600 opacity-50'
            }`}
          >
            🧪 POT PB ({player.shieldPotions})
          </button>

          {equippedEmote && equippedEmote !== 'none' && onTriggerEmote && (
            <button
              onClick={onTriggerEmote}
              className="px-4 py-2.5 h-11 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500 text-amber-400 text-xs font-black active:scale-95 transition-all text-center cursor-pointer"
            >
              💬 {getEmoteEmojiLocal(equippedEmote)}
            </button>
          )}
        </div>

        {/* Barre d'état de Dash miniature */}
        <div className="flex justify-between items-center w-full border-t border-slate-850 pt-2 text-[10px] text-slate-400 font-mono">
          <div className="flex gap-1.5 items-center">
            <span className="font-bold">Charges :</span>
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <span 
                  key={i} 
                  className={`text-xs ${i < player.dashCharges ? 'text-amber-400 filter drop-shadow' : 'text-slate-800'}`}
                >
                  ⚡
                </span>
              ))}
            </div>
          </div>
          <span className="font-bold">
            {player.dashCooldown > 0 ? `${(player.dashCooldown / 1000).toFixed(1)}s` : 'Dash OK'}
          </span>
        </div>

      </div>
    </div>
  );
}
