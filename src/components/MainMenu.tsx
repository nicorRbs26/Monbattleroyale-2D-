import React, { useState } from 'react';
import { PlayMode, PlayerStats, ArenaType } from '../types';
import SkinCustomizer from './SkinCustomizer';
import TouchHUDCustomizer, { TouchHUDLayout } from './TouchHUDCustomizer';
import { LEVEL_REWARDS, getXpRequired } from '../progression';
import { ARENA_THEMES, CUSTOM_WEAPONS } from '../utils';

interface MainMenuProps {
  stats: PlayerStats;
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedMode: PlayMode;
  setSelectedMode: (mode: PlayMode) => void;
  skinColor: string;
  setSkinColor: (color: string) => void;
  hatStyle: any;
  setHatStyle: (hat: any) => void;
  patternStyle: any;
  setPatternStyle: (pat: any) => void;
  onStartGame: () => void;
  onUpdateStats: (newStats: PlayerStats) => void;
  selectedArena: ArenaType | 'random';
  onSelectArena: (arena: ArenaType | 'random') => void;
  controlOption: 'keyboard' | 'gamepad' | 'touch';
  setControlOption: (opt: 'keyboard' | 'gamepad' | 'touch') => void;
}

const MODES_CONFIG: { value: PlayMode; label: string; desc: string; icon: string }[] = [
  { value: 'solo', label: 'Solo (Chacun pour soi)', desc: '40 joueurs en arène brutale. Que le meilleur survive !', icon: '👤' },
  { value: 'duo', label: 'Duo Tactique', desc: 'Faites équipe avec un coéquipier Bot contrôlé par l\'IA pour dominer !', icon: '👥' },
  { value: 'squad', label: 'Section / Squad', desc: 'Prenez d\'assaut l\'arène avec une escouade de 4 survivants !', icon: '🛡️' },
];

const ARENA_CONFIGS_DESC: Record<ArenaType, { name: string; emoji: string; desc: string }> = {
  military_forest: {
    name: 'Base Militaire Forestière',
    emoji: '🌲',
    desc: 'Bâtiments de casernes olive, dunes de sacs de sable de protection, marécages de boues ralentissantes et arbres de taïga denses.',
  },
  industrial: {
    name: 'Zone Industrielle Toxique',
    emoji: '🏭',
    desc: 'Grands hangars métalliques rouillés, conteneurs de fret multifonctions et d\'immenses bassins d\'écoulement d\'acides corrosifs.',
  },
  lava_ruins: {
    name: 'Ruines de Magma Volcanique',
    emoji: '🌋',
    desc: 'Temples d\'obsidienne sacrifiée, anciennes colonnes d\'autels et coulées de lave rougeoyante infligeant d\'immenses brûlures.',
  },
  cyber_neon: {
    name: 'Complexe Néon Cyberpunk',
    emoji: '🔮',
    desc: 'Serveurs mainframes technologiques, barrières laser holographiques et plaques d\'accélérateurs cybernétiques turbo.',
  },
  skeletal_desert: {
    name: 'Désert Squelettique Abandonné',
    emoji: '🏜️',
    desc: 'Ruines antiques de brique de sable chaud, fossiles de dinosaures gigantesques, oasiers de ressourcement d\'eau et sables mouvants.',
  },
  ai_custom: {
    name: 'Générateur d\'Arène IA',
    emoji: '✨',
    desc: 'Un univers dynamique généré sur-mesure par l\'intelligence artificielle Gemini selon votre propre invite textuelle, avec décors de bento-grid et micro-événements météo en direct.',
  },
};

export default function MainMenu({
  stats,
  playerName,
  setPlayerName,
  selectedMode,
  setSelectedMode,
  skinColor,
  setSkinColor,
  hatStyle,
  setHatStyle,
  patternStyle,
  setPatternStyle,
  onStartGame,
  onUpdateStats,
  selectedArena,
  onSelectArena,
  controlOption,
  setControlOption,
}: MainMenuProps) {
  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);
  const [activeSegment, setActiveSegment] = useState<'home' | 'progression' | 'weapons' | 'options' | 'touch-customizer'>('home');

  const playerLevel = stats.level || 1;
  const playerXp = stats.xp || 0;
  const xpNeeded = getXpRequired(playerLevel);
  const xpPercentage = Math.round(Math.min(100, (playerXp / xpNeeded) * 100));

  // Équiper ou déséquiper un effet visuel d'arme ou une émote
  const handleEquipReward = (type: 'weapon_effect' | 'emote', itemId: string) => {
    if (type === 'weapon_effect') {
      const isCurrentlyEquipped = stats.equippedWeaponEffect === itemId;
      const nextEquipped = isCurrentlyEquipped ? 'none' : itemId;
      onUpdateStats({
        ...stats,
        equippedWeaponEffect: nextEquipped,
      });
    } else if (type === 'emote') {
      const isCurrentlyEquipped = stats.equippedEmote === itemId;
      const nextEquipped = isCurrentlyEquipped ? 'none' : itemId;
      onUpdateStats({
        ...stats,
        equippedEmote: nextEquipped,
      });
    }
  };

  // Formater le temps historique en mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="main-menu-root" className="max-w-4xl w-full mx-auto px-4 py-8">
      
      {/* LOGO STATS TITRE */}
      <div className="text-center mb-6 relative">
        <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">🌀</span>
        <h1 className="text-5xl md:text-6xl font-black font-sans uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 drop-shadow">
          Battle Royale 2D
        </h1>
        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest mt-2">
          Lootet, combattez, survivez dans la tempête • IA-Powered Reports
        </p>
      </div>

      {/* Onglets Principaux */}
      {!showCustomizer && (
        <div className="flex flex-wrap justify-center gap-3 mb-8 font-sans">
          <button
            onClick={() => setActiveSegment('home')}
            id="tab-arena"
            className={`px-5 py-2 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeSegment === 'home'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🏠</span> Arène
          </button>
          <button
            onClick={() => setActiveSegment('progression')}
            id="tab-progression"
            className={`px-5 py-2 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all cursor-pointer flex items-center gap-2 relative ${
              activeSegment === 'progression'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🌀</span> Progression & Récompenses
            <span className="bg-red-500 text-white rounded-full text-[8px] w-4 h-4 flex items-center justify-center absolute -top-1 -right-1 font-sans">
              ★
            </span>
          </button>
          <button
            onClick={() => setActiveSegment('weapons')}
            id="tab-weapons"
            className={`px-5 py-2 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeSegment === 'weapons'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🔫</span> Arsenal ({CUSTOM_WEAPONS.length})
          </button>
          <button
            onClick={() => setActiveSegment('options')}
            id="tab-options"
            className={`px-5 py-2 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeSegment === 'options'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>⚙️</span> Options
          </button>
        </div>
      )}

      {showCustomizer ? (
        <div className="animate-fade-in-up">
          <SkinCustomizer
            skinColor={skinColor}
            setSkinColor={setSkinColor}
            hatStyle={hatStyle}
            setHatStyle={setHatStyle}
            patternStyle={patternStyle}
            setPatternStyle={setPatternStyle}
            playerName={playerName}
            setPlayerName={setPlayerName}
            onConfirm={() => setShowCustomizer(false)}
            playerLevel={playerLevel}
          />
          <button
            onClick={() => setShowCustomizer(false)}
            className="mt-4 text-xs font-mono text-slate-500 hover:text-slate-300 block mx-auto underline cursor-pointer"
          >
            ← Retourner sans enregistrer
          </button>
        </div>
      ) : activeSegment === 'progression' ? (
        /* VUE PROGRESSION ET COMPENSE DE NIVEAU */
        <div className="animate-fade-in-up bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl font-sans text-left">
          
          {/* Header de Progression */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-slate-800 pb-8 mb-8">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/10">
                Lvl {playerLevel}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-200 tracking-tight">Profil du Combattant</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{playerName}</p>
              </div>
            </div>

            {/* Jauge d'XP */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">Barre d'Expérience (XP)</span>
                <span className="text-slate-400">{playerXp} / {xpNeeded} XP ({xpPercentage}%)</span>
              </div>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl h-5 overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl transition-all duration-1000 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse"
                  style={{ width: `${xpPercentage}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                💡 <span className="font-semibold text-slate-400">Astuce :</span> Jouez des parties, survivez à la tempête et gagnez des duels pour obtenir un maximum de points d'expérience (XP) !
              </p>
            </div>
          </div>

          {/* Liste Track des Recompenses */}
          <div>
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-black mb-6">🏆 Chemin Récompenses & Niveaux</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LEVEL_REWARDS.map((reward) => {
                const isUnlocked = playerLevel >= reward.level;
                
                // Status de check d'équipé
                const isEquippedEffect = reward.type === 'weapon_effect' && stats.equippedWeaponEffect === reward.id;
                const isEquippedEmote = reward.type === 'emote' && stats.equippedEmote === reward.id;
                const isEquipped = isEquippedEffect || isEquippedEmote;

                // Afficher le type sous forme lisible
                const rTypeLabels = {
                  hat: 'Accessoire',
                  pattern: 'Motif Skinner',
                  emote: 'Émote',
                  weapon_effect: 'Projectiles',
                };

                return (
                  <div
                    key={`${reward.level}-${reward.id}`}
                    className={`border rounded-2xl p-4 flex gap-4 transition-all ${
                      isEquipped
                        ? 'border-amber-500 bg-slate-900 shadow-lg shadow-amber-500/5'
                        : isUnlocked
                        ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                        : 'border-slate-950 bg-slate-950/20 opacity-60'
                    }`}
                  >
                    {/* Icône de Récompense */}
                    <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl border ${
                      isUnlocked ? 'bg-slate-950 border-slate-700' : 'bg-slate-950/10 border-slate-900 text-slate-700'
                    }`}>
                      {isUnlocked ? reward.emojiOrColor : '🔒'}
                    </div>

                    {/* Détails de la Récompense */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-amber-500 font-mono uppercase tracking-wide">
                            {rTypeLabels[reward.type]} • Débloqué Lvl {reward.level}
                          </span>
                          <h4 className="font-bold text-slate-200 text-sm mt-0.5 truncate">{reward.name}</h4>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{reward.desc}</p>
                      
                      {/* Actions */}
                      <div className="mt-3.5 flex justify-end">
                        {!isUnlocked ? (
                          <span className="text-[10px] font-mono text-amber-500/50 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/15">
                            Bloqué • Niv. requis {reward.level}
                          </span>
                        ) : reward.type === 'hat' || reward.type === 'pattern' ? (
                          <span className="text-[10px] font-mono text-slate-500">
                            ✓ Débloqué (Équiper dans Personnaliser)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEquipReward(reward.type as 'weapon_effect' | 'emote', reward.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                              isEquipped
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 border border-slate-700'
                            }`}
                          >
                            {isEquipped ? '✓ ÉQUIPÉ' : 'ÉQUIPER'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : activeSegment === 'weapons' ? (
        /* VUE ARSENAL DES 15 ARMES */
        <div className="animate-fade-in-up bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl font-sans text-left">
          <div className="border-b border-slate-800 pb-6 mb-6">
            <h3 className="text-2xl font-black text-slate-200 tracking-tight flex items-center gap-2">
              <span>🔫</span> Arsenal Officiel & Spécifications ({CUSTOM_WEAPONS.length} Armes)
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
              Voici la liste complète des armes de combat disponibles dans l'arène de Battle Royale, chargée dynamiquement avec les caractéristiques et dégâts issus de <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-500 font-mono text-[11px]">armes_battle_royale.json</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CUSTOM_WEAPONS.map((weapon, idx) => {
              const rarityColors = {
                common: 'border-slate-800 bg-slate-950/40 text-slate-400',
                rare: 'border-blue-900/80 bg-blue-950/20 text-blue-400',
                epic: 'border-purple-900/80 bg-purple-950/20 text-purple-400',
                legendary: 'border-amber-600/80 bg-amber-950/20 text-amber-400 shadow-lg shadow-amber-500/5',
              };

              const rarityLabel = {
                common: 'Standard (Commun)',
                rare: 'Rare',
                epic: 'Épique',
                legendary: 'Légendaire',
              }[weapon.rarity];

              // Calcul de la cadence de tirs par seconde
              const tps = (1000 / weapon.fireRate).toFixed(1);

              return (
                <div
                  key={idx}
                  id={`weapon-def-card-${idx}`}
                  className={`border rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-slate-700 ${rarityColors[weapon.rarity]}`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] uppercase font-mono tracking-widest font-bold font-sans">
                        {rarityLabel}
                      </span>
                      <span className="text-xl">
                        {weapon.type === 'pistol' && '🔫'}
                        {weapon.type === 'shotgun' && '💥'}
                        {weapon.type === 'rifle' && '☄️'}
                        {weapon.type === 'sniper' && '🎯'}
                        {weapon.type === 'rocket' && '🚀'}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-200 mt-1">{weapon.nom}</h4>
                    
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-950">
                        <span className="text-[9px] text-slate-500 block">Dégâts</span>
                        <span className="font-bold text-red-500 mt-0.5 block">{weapon.damage} HP</span>
                      </div>
                      <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-950">
                        <span className="text-[9px] text-slate-500 block">Cadence</span>
                        <span className="font-bold text-sky-400 mt-0.5 block">{tps}/s</span>
                      </div>
                      <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-950">
                        <span className="text-[9px] text-slate-500 block">Chargeur</span>
                        <span className="font-bold text-amber-500 mt-0.5 block">{weapon.clipSize}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Vélocité : {weapon.bulletSpeed} px/f</span>
                    <span>Portée : {weapon.range} px</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeSegment === 'options' ? (
        <div className="animate-fade-in-up bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl font-sans text-left">
          <div className="border-b border-slate-800 pb-6 mb-6">
            <h3 className="text-2xl font-black text-slate-200 tracking-tight flex items-center gap-2">
              <span>⚙️</span> Choix du Mode de Contrôles
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
              Sélectionnez ci-dessous votre mode de jeu préféré. Le moteur s'adaptera automatiquement à vos contrôleurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Clavier + Souris */}
            <div
              onClick={() => {
                setControlOption('keyboard');
                localStorage.setItem('br_control_option', 'keyboard');
              }}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col gap-3 ${
                controlOption === 'keyboard'
                  ? 'border-amber-500 bg-slate-900 ring-4 ring-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 opacity-80'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-4xl">⌨️</span>
                {controlOption === 'keyboard' && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Actif</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-200">Clavier + Souris</h4>
                <p className="text-xs text-slate-400 mt-2 font-sans leading-relaxed">
                  Le pilotage traditionnel PC de haute précision. Déplacement avec <span className="text-slate-300 font-bold">ZQSD ou Flèches</span>, visée fluide au curseur, tir instantané au clic gauche.
                </p>
              </div>
            </div>

            {/* Manette Bluetooth */}
            <div
              onClick={() => {
                setControlOption('gamepad');
                localStorage.setItem('br_control_option', 'gamepad');
              }}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col gap-3 ${
                controlOption === 'gamepad'
                  ? 'border-amber-500 bg-slate-900 ring-4 ring-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 opacity-80'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-4xl">🎮</span>
                {controlOption === 'gamepad' && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Actif</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-200">Manette Bluetooth</h4>
                <p className="text-xs text-slate-400 mt-2 font-sans leading-relaxed">
                  Idéal pour console et manettes sans fil (Xbox/PlayStation). <span className="text-slate-300 font-bold">Stick gauche</span> pour bouger, <span className="text-slate-300 font-bold">stick droit</span> pour viser, gâchettes de tir, et boutons d'actions optimisés.
                </p>
              </div>
            </div>

            {/* Tactile Smartphone */}
            <div
              onClick={() => {
                setControlOption('touch');
                localStorage.setItem('br_control_option', 'touch');
              }}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col gap-3 ${
                controlOption === 'touch'
                  ? 'border-amber-500 bg-slate-900 ring-4 ring-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 opacity-80'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-4xl">📱</span>
                {controlOption === 'touch' && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Actif</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-200">Tactile Smartphone</h4>
                <p className="text-xs text-slate-400 mt-2 font-sans leading-relaxed">
                  Contrôles virtuels affichés directement à l'écran. <span className="text-slate-300 font-bold">Joystick gauche</span> interactif pour le mouvement, <span className="text-slate-300 font-bold">joystick droit</span> d'aim auto-shoot, et gros boutons tactiles.
                </p>
                {controlOption === 'touch' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSegment('touch-customizer');
                    }}
                    className="mt-3.5 w-full bg-slate-800 hover:bg-slate-700 hover:text-amber-400 text-amber-500 border border-amber-500/20 hover:border-amber-500/50 font-sans font-black py-2.5 px-3.5 rounded-xl text-[11px] transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    ⚙️ PERSONNALISER LA DISPOSITION
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Guide visuel */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-2xl font-sans mb-6">
            <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest mb-2.5">
              💡 Schéma de pilotage sélectionné
            </h4>
            {controlOption === 'keyboard' ? (
              <ul className="text-xs text-slate-300 space-y-2 font-mono">
                <li>• <span className="text-amber-400 font-bold">ZQSD ou Flèches Clavier</span> : Se déplacer</li>
                <li>• <span className="text-amber-400 font-bold">Mouvement de la Souris</span> : Pivoter et regarder</li>
                <li>• <span className="text-amber-400 font-bold">Clic Gauche Souris</span> : Faire feu / Tirer</li>
                <li>• <span className="text-amber-400 font-bold">Espace ou Maj (Shift)</span> : Dash de téléportation tactique (cooldown requis)</li>
                <li>• <span className="text-amber-400 font-bold">Touches A/Q / Touche E/R</span> : Utiliser Medkit, Potion de Bouclier</li>
              </ul>
            ) : controlOption === 'gamepad' ? (
              <ul className="text-xs text-slate-300 space-y-2 font-mono">
                <li>• <span className="text-amber-400 font-bold">Stick Analogique Gauche</span> : Mouvement doux et progressif à 360°</li>
                <li>• <span className="text-amber-400 font-bold">Stick Analogique Droit</span> : Pivoter et viser la direction</li>
                <li>• <span className="text-amber-400 font-bold">Gâchette Droite (RT/RB / Zone 7/5)</span> : Tirer</li>
                <li>• <span className="text-amber-400 font-bold">Gâchette Gauche (LT / Zone 6) ou Bouton A (Zone 0)</span> : Dash tactique</li>
                <li>• <span className="text-amber-400 font-bold">Bouton B (Zone 1) ou Bouton LB (Zone 4)</span> : Changer d'active d'arme</li>
                <li>• <span className="text-amber-400 font-bold">Bouton X (Zone 2) / Bouton Y (Zone 3)</span> : Utiliser un kit de soin ou une potion de bouclier</li>
              </ul>
            ) : (
              <ul className="text-xs text-slate-300 space-y-2 font-mono">
                <li>• <span className="text-amber-400 font-bold">Joystick Gauche Virtuel</span> : Poser le doigt à gauche pour courir librement</li>
                <li>• <span className="text-amber-400 font-bold">Joystick Droit Virtuel</span> : Viser et faire feu automatiquement si glissé à + de 20%</li>
                <li>• <span className="text-amber-400 font-bold">Gros Bouton Éclat Jaune ⚡</span> : Dash de vitesse sur les côtés</li>
                <li>• <span className="text-amber-400 font-bold">Bouton Soins et Armes</span> : Tapoter directement sur les boutons tactiles de soins ou d'armes de la barre HUD pour interagir.</li>
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 font-sans">
            <button
              onClick={() => setActiveSegment('home')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs md:text-sm px-6 py-3 rounded-xl transition-all uppercase cursor-pointer"
            >
              Confirmer et Retourner
            </button>
          </div>
        </div>
      ) : activeSegment === 'touch-customizer' ? (
        <div className="animate-fade-in-up">
          <TouchHUDCustomizer
            initialLayout={(() => {
              const saved = localStorage.getItem('br_touch_hud_layout');
              if (saved) {
                try {
                  return JSON.parse(saved);
                } catch (e) {}
              }
              return {
                leftJoystick: { x: 15, y: 80 },
                rightJoystick: { x: 80, y: 80 },
                dashButton: { x: 82, y: 55 },
                mobileHUD: { x: 50, y: 82 }
              };
            })()}
            onSave={(newLayout) => {
              localStorage.setItem('br_touch_hud_layout', JSON.stringify(newLayout));
              // Save a custom event to notify App state of change if live update is needed
              window.dispatchEvent(new Event('br_touch_layout_updated'));
              setActiveSegment('options');
            }}
            onClose={() => {
              setActiveSegment('options');
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* COLONNE GAUCHE : Lanceur & Choix de Mode */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            {/* Pseudo et Skin QuickView */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
              <div className="flex gap-4 items-center">
                <div 
                  className="w-12 h-12 rounded-full border-2 border-slate-950 flex items-center justify-center relative shadow-lg"
                  style={{ backgroundColor: skinColor }}
                >
                  {patternStyle === 'lightning' && <span className="text-sm">⚡</span>}
                  {hatStyle !== 'none' && (
                    <span className="absolute -top-4 text-xl">
                      {hatStyle === 'cap' ? '🧢' : hatStyle === 'crown' ? '👑' : hatStyle === 'helmet' ? '🪖' : hatStyle === 'headphones' ? '🎧' : hatStyle === 'bandana' ? '🧣' : hatStyle === 'ninja' ? '🥷' : '🧙'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-sm font-mono">{playerName || 'Identité Secrète'}</h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">Statut: Prêt au combat</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomizer(true)}
                className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                Personnaliser 🎨
              </button>
            </div>

            {/* MOTEUR DE GÉNÉRATION PROCÉDURALE DES ARÈNES */}
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                🏟️ Moteur d'Arènes Procédurales
              </h2>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md flex flex-col gap-3">
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Le moteur génère en temps réel des architectures, des couverts défensifs tactiques et des zones interactives uniques à chaque lancement de partie.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <button
                    onClick={() => onSelectArena('random')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                      selectedArena === 'random'
                        ? 'border-amber-400 bg-amber-500/10 shadow-lg text-amber-400 font-bold'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-xl mb-1">🎲</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider truncate w-full">Aléatoire</span>
                  </button>

                  <button
                    onClick={() => onSelectArena('military_forest')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                      selectedArena === 'military_forest'
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg text-emerald-400 font-bold'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-xl mb-1">🌲</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider truncate w-full">Forêt</span>
                  </button>

                  <button
                    onClick={() => onSelectArena('industrial')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                      selectedArena === 'industrial'
                        ? 'border-sky-500 bg-sky-500/10 shadow-lg text-sky-400 font-bold'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-xl mb-1">🏭</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider truncate w-full">Industriel</span>
                  </button>

                  <button
                    onClick={() => onSelectArena('lava_ruins')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                      selectedArena === 'lava_ruins'
                        ? 'border-orange-500 bg-orange-500/10 shadow-lg text-orange-400 font-bold'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-xl mb-1">🌋</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider truncate w-full">Magma</span>
                  </button>

                  <button
                    onClick={() => onSelectArena('cyber_neon')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                      selectedArena === 'cyber_neon'
                        ? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-lg text-fuchsia-400 font-bold'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-xl mb-1">🔮</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider truncate w-full">Cyber</span>
                  </button>

                  <button
                    onClick={() => onSelectArena('skeletal_desert')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                      selectedArena === 'skeletal_desert'
                        ? 'border-amber-600 bg-amber-600/10 shadow-lg text-amber-500 font-bold'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-xl mb-1">🏜️</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider truncate w-full">Désert</span>
                  </button>
                </div>

                {/* Description de l'arène sélectionnée */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl text-left">
                  <div className="flex items-center gap-1.5 mb-1 text-slate-200">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                      {selectedArena === 'random' ? '🎲 Sélection Aléatoire Activée' : '📍 ' + ARENA_CONFIGS_DESC[selectedArena].name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal font-sans">
                    {selectedArena === 'random'
                      ? 'L\'arène sera générée de manière unique et selon un thème choisi au hasard pour chaque partie.'
                      : ARENA_CONFIGS_DESC[selectedArena].desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Liste des Modes de Jeu */}
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">Sélectionner un Mode</h2>
              <div className="flex flex-col gap-3">
                {MODES_CONFIG.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedMode(mode.value)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                      selectedMode === mode.value
                        ? 'border-amber-500 bg-slate-900 ring-4 ring-amber-500/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                    }`}
                  >
                    <span className="text-2xl mt-1">{mode.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base text-slate-200">{mode.label}</h4>
                      <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">{mode.desc}</p>
                    </div>
                    {selectedMode === mode.value && (
                      <span className="text-amber-500 font-black text-sm absolute top-3 right-4">✓ SÉLECTIONNÉ</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton de Grand Lancement */}
            <button
              onClick={onStartGame}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-4 px-6 rounded-2xl transition-all shadow-xl transform active:scale-95 tracking-widest uppercase text-base flex justify-center items-center gap-2 cursor-pointer mt-2"
            >
              <span>🚀</span> LANCER LA BATAILLE ROYALE !
            </button>
          </div>

          {/* COLONNE DROITE : Stats Globales & Règles du Jeu */}
          <div className="flex flex-col gap-6">
            {/* Règles & Contrôles */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl font-sans">
              <h4 className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-3 font-bold">⌨️ Contrôles du Jeu</h4>
              <ul className="text-xs text-slate-400 space-y-2.5 leading-relaxed font-mono">
                <li><span className="text-slate-200 font-bold bg-slate-950 px-1.5 py-0.5 rounded mr-1">ZQSD</span> ou <span className="text-slate-200 font-bold bg-slate-950 px-1.5 py-0.5 rounded mr-1">Flèches</span> : Déplacement</li>
                <li><span className="text-slate-200 font-bold bg-slate-950 px-1.5 py-0.5 rounded mr-1">Aim / Visée</span> : Curseur de la Souris</li>
                <li><span className="text-slate-200 font-bold bg-slate-950 px-1.5 py-0.5 rounded mr-1">Clic gauche</span> : Tirer votre arme</li>
                <li><span className="text-slate-200 font-bold bg-slate-950 px-1.5 py-0.5 rounded mr-1">Espace</span> ou <span className="text-slate-200 font-bold bg-slate-950 px-1.5 py-0.5 rounded mr-1">Shift L</span> : Dash rapide</li>
                <li><span className="text-slate-200 font-bold bg-slate-950 px-1.5 py-0.5 rounded mr-1">A</span> ou <span className="text-slate-200 font-bold bg-slate-950 px-1.5 py-0.5 rounded mr-1">Mains libres</span> : Ramassage auto des loots au sol</li>
                <li><span className="text-slate-200 font-bold bg-slate-950 px-1.5 py-0.5 rounded mr-1">Molette / Clic HUD</span> : Changer d'arme</li>
              </ul>
              
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 leading-normal">
                💡 <span className="font-semibold text-slate-400">Tactique :</span> Restez toujours proche du centre du cercle pour éviter de subir les dégâts impitoyables de la tempête invisible !
              </div>
            </div>

            {/* Statistiques Historiques */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col gap-4">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">📊 Vos Résultats</h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs border-b border-slate-800 pb-3">
                <div className="bg-slate-950/40 p-2 rounded-lg">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-tight">Jouées</span>
                  <span className="font-bold text-slate-200 text-sm mt-0.5 block">{stats.gamesPlayed}</span>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-lg">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-tight">Wins 🏆</span>
                  <span className="font-bold text-amber-500 text-sm mt-0.5 block">{stats.wins}</span>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-lg">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-tight">Kills 💀</span>
                  <span className="font-bold text-red-400 text-sm mt-0.5 block">{stats.kills}</span>
                </div>
              </div>

              {/* Historique Déroulant */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-mono">Dernières batailles :</p>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {stats.history.length === 0 ? (
                    <div className="text-xs italic text-slate-600 text-center py-4">Aucune partie enregistrée. Entrez dans l'arène !</div>
                  ) : (
                    stats.history.map((h, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg text-xs border border-slate-800/60">
                        <div className="flex flex-col text-left">
                          <span className={`font-bold ${h.rank === 1 ? 'text-amber-500' : 'text-slate-300'}`}>
                            {h.rank === 1 ? '🏆 TOP 1' : `Rang #${h.rank}`}
                          </span>
                          <span className="text-[10px] text-slate-500 lowercase">mode {h.mode}</span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="text-slate-400 font-bold">{h.kills} kills</span>
                          <span className="text-[9px] text-slate-600">{formatTime(h.survivedTime)}s</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
