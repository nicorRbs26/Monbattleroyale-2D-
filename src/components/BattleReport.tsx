import React, { useEffect, useState } from 'react';
import { PlayMode, PlayerStats } from '../types';
import { calculateMatchXp, getXpRequired, LEVEL_REWARDS } from '../progression';
import { sounds } from '../audio';

interface BattleReportProps {
  rank: number;
  kills: number;
  survivedTime: number;
  mode: PlayMode;
  weaponOfChoice: string;
  deathCause: string;
  playerName: string;
  skinColor: string;
  hatStyle: string;
  patternStyle: string;
  onRestart: () => void;
  stats: PlayerStats;
}

const FUN_LOADING_MESSAGES = [
  'Restauration des archives de combat par l\'IA...',
  'Analyse pragmatique des variables vectorielles...',
  'Calcul du ratio d\'Aura résiduelle...',
  'Formulation des excuses tactiques de survie...',
  'L\'assistant Aura Prime passe en revue vos erreurs...',
  'Génération du rapport de combat par Gemini...',
  'Compilation des pires décisions de la partie...'
];

export default function BattleReport({
  rank,
  kills,
  survivedTime,
  mode,
  weaponOfChoice,
  deathCause,
  playerName,
  skinColor,
  hatStyle,
  patternStyle,
  onRestart,
  stats,
}: BattleReportProps) {
  const [reportText, setReportText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loadingIndex, setLoadingIndex] = useState<number>(0);

  // --- CALCULS DE PROGRESSION D'EXPÉRIENCE ---
  const matchXp = calculateMatchXp(rank, kills, survivedTime);
  const totalEarnedXp = matchXp.totalEarnedXp;

  // Évaluation d'avant-partie
  const finalLevel = stats.level || 1;
  const finalXp = stats.xp || 0;

  let startLevel = finalLevel;
  let startXp = finalXp;
  let carry = totalEarnedXp;

  while (carry > 0) {
    if (startXp >= carry) {
      startXp -= carry;
      carry = 0;
    } else {
      carry -= startXp;
      if (startLevel > 1) {
        startLevel -= 1;
        startXp = getXpRequired(startLevel);
      } else {
        startXp = 0;
        carry = 0;
      }
    }
  }

  // États réactifs d'animation
  const [animatedLevel, setAnimatedLevel] = useState<number>(startLevel);
  const [animatedXp, setAnimatedXp] = useState<number>(startXp);
  const [levelUpsCount, setLevelUpsCount] = useState<number>(0);
  const [recentUnlocks, setRecentUnlocks] = useState<any[]>([]);
  const [xpAnimationFinished, setXpAnimationFinished] = useState<boolean>(false);

  // Faire défiler les messages rigolos pendant le chargement
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % FUN_LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    let active = true;
    async function fetchAiReport() {
      try {
        setLoading(true);
        setErrorMsg('');
        const response = await fetch('/api/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rank,
            kills,
            survivedTime,
            mode,
            weaponOfChoice,
            deathCause,
            playerName,
            skinColor,
            hatStyle,
            patternStyle,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Erreur réseau ou réponse de serveur invalide.');
        }

        const data = await response.json();
        if (active) {
          setReportText(data.text || 'Aucune analyse générée.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setReportText(
            `[Rapport Émergence] Soldat ${playerName}, vous avez combattu courageusement et terminé #${rank} du mode ${mode}. ` +
            `Votre fin tragique fut provoquée par : "${deathCause}" après avoir vaillamment défait ${kills} adversaires à l'aide de votre ${weaponOfChoice || 'pistolet de secours'}. ` +
            'Vos choix esthétiques audacieux ont détourné l\'attention, mais n\'ont hélas pu contrer l\'inévitable. Améliorez vos compétences de tir et relancez !'
          );
          setLoading(false);
        }
      }
    }

    fetchAiReport();
    return () => {
      active = false;
    };
  }, [rank, kills, survivedTime, mode, weaponOfChoice, deathCause, playerName, skinColor, hatStyle, patternStyle]);

  // Animation de la jauge
  useEffect(() => {
    let isMounted = true;
    let tLevel = startLevel;
    let tXp = startXp;

    const intervalTime = 30; // ms
    const duration = 1800; // 1.8s
    const totalSteps = duration / intervalTime;
    const increment = Math.max(10, Math.round(totalEarnedXp / totalSteps));

    const ticker = setInterval(() => {
      if (!isMounted) return;

      if (tLevel === finalLevel && tXp >= finalXp) {
        setAnimatedLevel(finalLevel);
        setAnimatedXp(finalXp);
        setXpAnimationFinished(true);
        clearInterval(ticker);
        return;
      }

      const req = getXpRequired(tLevel);
      if (tXp + increment >= req) {
        tXp = (tXp + increment) - req;
        tLevel += 1;
        setLevelUpsCount(prev => prev + 1);
        sounds.playHeal(); // Joue un son glorieux de soins rétro pour l'Arpège !

        // Récupérer la liste des récompenses débloquées
        const unlocked = LEVEL_REWARDS.filter(r => r.level === tLevel);
        if (unlocked.length > 0) {
          setRecentUnlocks(prev => [...prev, ...unlocked]);
        }
      } else {
        tXp += increment;
      }

      if (tLevel === finalLevel && tXp > finalXp) {
        tXp = finalXp;
      }

      setAnimatedLevel(tLevel);
      setAnimatedXp(tXp);
    }, intervalTime);

    return () => {
      isMounted = false;
      clearInterval(ticker);
    };
  }, [startLevel, startXp, finalLevel, finalXp, totalEarnedXp]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isVictory = rank === 1;
  const currentReq = getXpRequired(animatedLevel);
  const xpPct = Math.round(Math.min(100, (animatedXp / currentReq) * 100));

  return (
    <div id="battle-report-main" className="max-w-4xl w-full mx-auto px-4 py-8">
      
      {/* En-tête du Rapport de Combat */}
      <div className="text-center mb-10">
        {isVictory ? (
          <div className="inline-block animate-bounce duration-1000">
            <span className="text-6xl drop-shadow-[0_4px_20px_rgba(245,158,11,0.6)]">🏆</span>
            <h1 className="text-4xl md:text-5xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-600 mt-2 uppercase tracking-widest drop-shadow">
              Victoire Royale !
            </h1>
            <p className="text-amber-400/80 font-mono text-sm max-w-sm mx-auto mt-2 tracking-wide uppercase font-black">
              Tu es l'unique survivant des 40 gladiateurs !
            </p>
          </div>
        ) : (
          <div>
            <span className="text-5xl">💀</span>
            <h1 className="text-4xl font-extrabold font-sans text-red-500 mt-2 uppercase tracking-wide">
              Éliminé !
            </h1>
            <p className="text-slate-400 font-mono text-xs mt-1">
              Position: <span className="text-red-400 font-semibold">#{rank} sur 40</span> • Cause : <span className="text-red-400 font-semibold">{deathCause}</span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* COLONNE GAUCHE & CENTRE : Stats Récoltées & Rapport d'expérience */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Grille de statistiques immédiates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Classement</p>
              <p className={`text-3xl font-black ${isVictory ? 'text-amber-500' : 'text-slate-200'}`}>
                #{rank} <span className="text-xs font-normal text-slate-500">/ 40</span>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Éliminations</p>
              <p className="text-3xl font-black text-amber-500">
                {kills} <span className="text-xs font-normal text-slate-500">kills</span>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Temps Survécu</p>
              <p className="text-3xl font-black text-blue-400">
                {formatTime(survivedTime)}
              </p>
            </div>
          </div>

          {/* TABLEAU DE PROGRESSION EXPÉRIENCE ANIMÉ */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl text-left font-sans">
            <h3 className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-6 font-black flex items-center gap-2">
              <span>🌀</span> RAPPORT DE PROGRESSION PAR PERFORMANCE
            </h3>

            {/* Détail du gain d'XP */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 border-b border-slate-800 pb-6 text-xs font-mono">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <span className="text-slate-500 block mb-1">⏱️ Survie ({survivedTime}s)</span>
                <span className="text-slate-200 font-bold font-sans">+{matchXp.survivalXp} XP</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <span className="text-slate-500 block mb-1">💀 Éliminations ({kills})</span>
                <span className="text-slate-200 font-bold font-sans">+{matchXp.killsXp} XP</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <span className="text-slate-500 block mb-1">🏆 Bonus de Rang</span>
                <span className="text-slate-200 font-bold font-sans">+{matchXp.rankXp} XP</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <span className="text-slate-500 block mb-1">🎮 Forfait d'Entrée</span>
                <span className="text-amber-500 font-bold font-sans">+{matchXp.gamesPlayedXp} XP</span>
              </div>
            </div>

            {/* Composant de barre d'XP */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-slate-200 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-serif text-sm font-black">
                    {animatedLevel}
                  </span>
                  NIVEAU DU COMBATTANT
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {animatedXp} / {currentReq} XP ({xpPct}%)
                </span>
              </div>
              
              <div className="relative w-full bg-slate-950 border border-slate-800 rounded-full h-6 p-0.5 shadow-inner flex items-center">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                  style={{ width: `${xpPct}%` }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-200 font-bold tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">
                  +{totalEarnedXp} XP AU TOTAL
                </span>
              </div>

              {/* Message de Level Up célébration */}
              {levelUpsCount > 0 && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-4 text-left animate-bounce">
                  <span className="text-3xl">🌟</span>
                  <div>
                    <h4 className="text-sm font-black text-amber-400 uppercase tracking-wide">Niveau Supérieur Débloqué !</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Félicitations, tu as grimpé de <span className="font-bold text-amber-400 text-sm">{levelUpsCount}</span> niveau(x) durant ce combat d'arène !
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rapport textuel généré par l'IA Gemini */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden text-left font-sans">
            <div className="absolute right-4 top-4 text-5xl opacity-5 select-none pointer-events-none">🤖</div>
            
            <h3 className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              Analyse Contextuelle IA — Chronique d'Arène
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-mono text-xs text-center animate-pulse tracking-wide">
                  {FUN_LOADING_MESSAGES[loadingIndex]}
                </p>
              </div>
            ) : (
              <div className="text-slate-200 font-sans leading-relaxed text-sm md:text-base space-y-3 whitespace-pre-line border-l-4 border-amber-500/40 pl-4 py-1">
                {reportText}
              </div>
            )}
          </div>

        </div>

        {/* COLONNE DROITE : Récompenses récemment débloquées */}
        <div className="flex flex-col gap-6">
          
          {/* Cadre de Récompenses Obtenues */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4 text-left font-sans">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-black flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <span>🎁</span> Déblocages du Match
            </h4>

            <div className="flex flex-col gap-3 min-h-[160px]">
              {recentUnlocks.length === 0 ? (
                <div className="text-xs italic text-slate-500 text-center py-10 flex flex-col items-center gap-2">
                  <span className="text-xl">📭</span>
                  <span>Aucune nouvelle récompense débloquée sur ces niveaux. Continuez à jouer !</span>
                  <span className="text-[10px] text-slate-600 mt-2">Paliers de paliers d'accessoires à partir du Niv. 2</span>
                </div>
              ) : (
                recentUnlocks.map((reward, i) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 flex gap-3 items-center animate-fade-in-up">
                    <span className="text-2xl w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800">
                      {reward.emojiOrColor}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[9px] text-amber-500 font-mono uppercase font-black">UNLOCKED AT LVL {reward.level}</span>
                      <h5 className="font-bold text-slate-200 text-xs truncate">{reward.name}</h5>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-tight">{reward.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {recentUnlocks.length > 0 && (
              <div className="bg-amber-500/5 text-amber-500 text-[10px] font-mono p-2.5 rounded-lg border border-amber-500/10 text-center leading-normal">
                ✨ Équipez directement vos skins et émotes débloqués dans le <span className="font-bold">Menu Principal › Onglet Progression</span> !
              </div>
            )}
          </div>

          {/* Profil Global */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-left font-sans">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3 font-semibold border-b border-slate-800 pb-2">Statut de Carrière</h4>
            <div className="grid grid-cols-2 gap-3 text-center py-2">
              <div className="bg-slate-950 p-2 rounded-xl">
                <span className="block text-slate-500 text-[9px] font-mono uppercase">Parties</span>
                <span className="text-sm font-sans font-black text-slate-200">{stats.gamesPlayed}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl">
                <span className="block text-slate-500 text-[9px] font-mono uppercase">Victoires</span>
                <span className="text-sm font-sans font-black text-amber-500">{stats.wins}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl">
                <span className="block text-slate-500 text-[9px] font-mono uppercase">Kills</span>
                <span className="text-sm font-sans font-black text-slate-200">{stats.kills}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl">
                <span className="block text-slate-500 text-[9px] font-mono uppercase">Ratio K/D</span>
                <span className="text-sm font-sans font-black text-slate-200">
                  {(stats.kills / Math.max(1, stats.gamesPlayed - stats.wins)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bouton de reprise */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onRestart}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-12 py-4 rounded-2xl transition-all shadow-xl hover:-translate-y-0.5 tracking-wider uppercase text-sm cursor-pointer"
        >
          Retourner au Salon 🎮
        </button>
      </div>

    </div>
  );
}
